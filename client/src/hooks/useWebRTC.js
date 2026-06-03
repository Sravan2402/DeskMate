// src/hooks/useWebRTC.js
import { useEffect, useRef, useCallback, useState } from "react";
import socket from "../utils/socket";

// Metered.ca TURN credentials (from your dashboard)
const METERED_USER = "744bfc4fa8089e5e22b93c9c	";
const METERED_PASS = "CReueu7JXgSgW5QL";

const buildIceServers = () => [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  // UDP — lowest latency, try first
  {
    urls: "turn:a.relay.metered.ca:80",
    username: METERED_USER,
    credential: METERED_PASS,
  },
  // TCP fallback — gets through most firewalls
  {
    urls: "turn:a.relay.metered.ca:80?transport=tcp",
    username: METERED_USER,
    credential: METERED_PASS,
  },
  // TCP on 443 — almost always open
  {
    urls: "turn:a.relay.metered.ca:443",
    username: METERED_USER,
    credential: METERED_PASS,
  },
  // TLS on 443 — last resort, works even behind deep-packet inspection
  {
    urls: "turns:a.relay.metered.ca:443",
    username: METERED_USER,
    credential: METERED_PASS,
  },
];

const ICE_SERVERS = { iceServers: buildIceServers(), iceCandidatePoolSize: 10 };

const canScreenShare = () =>
  typeof navigator !== "undefined" &&
  typeof navigator.mediaDevices?.getDisplayMedia === "function";

export const useWebRTC = (
  role,
  code,
  onSessionEnded,
  initialGuestReady = false,
) => {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const onSessionEndedRef = useRef(onSessionEnded);

  // Buffer the pending offer until the guest socket listener is confirmed ready
  const pendingOfferRef = useRef(null);

  // Buffer ICE candidates that arrive before setRemoteDescription
  const iceCandidateQueueRef = useRef([]);
  const remoteDescSetRef = useRef(false);

  // FIX: use a ref for guestReady so sendStream always reads the current value
  // without needing to be recreated every time guestReady state changes.
  const guestReadyRef = useRef(initialGuestReady);

  // ICE disconnected restart timer — avoids restarting too aggressively
  const iceRestartTimerRef = useRef(null);

  useEffect(() => {
    onSessionEndedRef.current = onSessionEnded;
  }, [onSessionEnded]);

  const [isCapturing, setIsCapturing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [guestReady, setGuestReady] = useState(initialGuestReady);
  const [error, setError] = useState(null);
  const [isMobileHost] = useState(role === "host" && !canScreenShare());

  // Keep ref in sync with state
  useEffect(() => {
    guestReadyRef.current = guestReady;
  }, [guestReady]);

  const stopSharing = useCallback(() => {
    clearTimeout(iceRestartTimerRef.current);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    pendingOfferRef.current = null;
    iceCandidateQueueRef.current = [];
    remoteDescSetRef.current = false;
    guestReadyRef.current = false;
    setIsCapturing(false);
    setIsConnected(false);
    setGuestReady(false);
  }, []);

  const createPeerConnection = useCallback(() => {
    if (pcRef.current) pcRef.current.close();
    clearTimeout(iceRestartTimerRef.current);

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        console.log(
          "🧊 Candidate:",
          candidate.type,
          candidate.protocol,
          candidate.address,
        );
        socket.emit("ice-candidate", { code, candidate });
      } else {
        console.log("🧊 ICE gathering complete");
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log("🧊 Gathering:", pc.iceGatheringState);
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log("🧊 ICE:", state);

      if (state === "disconnected") {
        // Give it 3 s to self-recover before forcing a restart
        iceRestartTimerRef.current = setTimeout(() => {
          if (pcRef.current?.iceConnectionState === "disconnected") {
            console.warn("🧊 ICE still disconnected after 3 s — restarting");
            pcRef.current.restartIce();
          }
        }, 3000);
      }

      if (state === "failed") {
        clearTimeout(iceRestartTimerRef.current);
        console.warn("🧊 ICE failed — restarting immediately");
        pc.restartIce();
      }

      if (state === "connected" || state === "completed") {
        clearTimeout(iceRestartTimerRef.current);
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log("🔗 Conn:", state);
      if (state === "connected") setIsConnected(true);
      if (["disconnected", "failed", "closed"].includes(state))
        setIsConnected(false);
    };

    pc.ontrack = (event) => {
      console.log("🎥 ontrack fired");
      const stream = event.streams[0];
      if (!stream) return;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current
          .play()
          .catch((e) => console.warn("autoplay blocked:", e.message));
      }
    };

    return pc;
  }, [code]);

  // Drain the ICE candidate queue after remote description is set
  const drainIceCandidateQueue = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const queued = iceCandidateQueueRef.current;
    iceCandidateQueueRef.current = [];
    console.log(`🧊 Draining ${queued.length} queued ICE candidates`);
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn("Failed to add queued ICE candidate", e);
      }
    }
  }, []);

  const sendStream = useCallback(
    async (stream) => {
      localStreamRef.current = stream;
      setIsCapturing(true);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      stream.getTracks().forEach((t) => {
        t.onended = () => {
          socket.emit("end-session", { code });
          stopSharing();
          onSessionEndedRef.current?.();
        };
      });

      const pc = createPeerConnection();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // FIX: read from ref (always current) instead of stale closure state
      if (guestReadyRef.current) {
        console.log("📤 Sending offer immediately (guest already joined)");
        socket.emit("offer", { code, offer });
      } else {
        console.log("⏳ Buffering offer until guest joins");
        pendingOfferRef.current = offer;
      }
    },
    // No longer depends on `guestReady` state — reads via ref instead
    [code, createPeerConnection, stopSharing],
  );

  const startScreenShare = useCallback(async () => {
    if (!canScreenShare()) {
      setError(
        "Screen sharing isn't supported on mobile.\nUse a desktop browser to share your screen.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always", frameRate: { ideal: 30, max: 60 } },
        audio: true,
      });
      await sendStream(stream);
    } catch (err) {
      if (err.name === "NotAllowedError")
        setError("Screen share permission denied.");
      else setError("Screen capture failed: " + err.message);
    }
  }, [sendStream]);

  const startCameraShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });
      await sendStream(stream);
    } catch (err) {
      if (err.name === "NotAllowedError") setError("Camera permission denied.");
      else setError("Camera failed: " + err.message);
    }
  }, [sendStream]);

  const handleOffer = useCallback(
    async (offer) => {
      remoteDescSetRef.current = false;
      iceCandidateQueueRef.current = []; // clear stale candidates from any previous attempt
      const pc = createPeerConnection();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        remoteDescSetRef.current = true;
        await drainIceCandidateQueue();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { code, answer });
      } catch (err) {
        setError("Failed to connect: " + err.message);
      }
    },
    [code, createPeerConnection, drainIceCandidateQueue],
  );

  useEffect(() => {
    if (!code) return;

    const onPeerJoined = ({ role: peerRole } = {}) => {
      if (peerRole === "agent") {
        console.log("🤖 Agent joined room — ignoring for WebRTC");
        return;
      }

      if (role === "host") {
        console.log("👤 Guest joined room");
        guestReadyRef.current = true; // update ref immediately
        setGuestReady(true);

        if (pendingOfferRef.current) {
          console.log("📤 Flushing buffered offer to guest");
          socket.emit("offer", { code, offer: pendingOfferRef.current });
          pendingOfferRef.current = null;
        }
      }
    };

    const onOffer = (offer) => {
      if (role === "guest") handleOffer(offer);
    };

    const onAnswer = async (answer) => {
      if (role === "host") {
        try {
          await pcRef.current?.setRemoteDescription(
            new RTCSessionDescription(answer),
          );
          remoteDescSetRef.current = true;
          await drainIceCandidateQueue();
        } catch (err) {
          setError("Failed: " + err.message);
        }
      }
    };

    const onIceCandidate = async (candidate) => {
      if (!candidate) return;
      if (!remoteDescSetRef.current || !pcRef.current) {
        console.log("⏳ Queuing ICE candidate (remote desc not set yet)");
        iceCandidateQueueRef.current.push(candidate);
        return;
      }
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        // Benign — often fires during renegotiation
      }
    };

    const onSessionEnded = () => {
      stopSharing();
      onSessionEndedRef.current?.();
    };

    socket.on("peer-joined", onPeerJoined);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIceCandidate);
    socket.on("session-ended", onSessionEnded);

    return () => {
      socket.off("peer-joined", onPeerJoined);
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIceCandidate);
      socket.off("session-ended", onSessionEnded);
    };
  }, [code, role, handleOffer, stopSharing, drainIceCandidateQueue]);

  return {
    localVideoRef,
    remoteVideoRef,
    isCapturing,
    isConnected,
    guestReady,
    error,
    isMobileHost,
    stopSharing,
    startScreenShare,
    startCameraShare,
  };
};
