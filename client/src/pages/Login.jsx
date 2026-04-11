import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080/";

const Logo = () => (
  <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl shadow-xl shadow-indigo-500/20 mb-4 md:mb-5 text-white transform hover:rotate-3 transition-transform duration-300">
    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/40">
      <ShieldAlert className="text-white" size={24} />
    </div>
  </div>
);

const InputField = ({
  label,
  type,
  value,
  onChange,
  placeholder,
  isDarkMode,
  showForgot,
}) => (
  <div className="w-full space-y-2">
    <div className="flex justify-between items-center">
      <label
        className={`block text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}
      >
        {label}
      </label>
      {showForgot && (
        <button
          type="button"
          className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest hover:text-indigo-600 transition-colors"
        >
          Forgot?
        </button>
      )}
    </div>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-4 py-3 min-h-[50px] rounded-2xl border transition-all text-base font-medium focus:outline-none focus:ring-2 ${type === "password" ? "tracking-[0.2em]" : ""} ${
        isDarkMode
          ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-indigo-500/20 focus:border-indigo-500"
          : "bg-white border-slate-200 text-slate-700 placeholder:text-slate-400 focus:ring-indigo-500/10 focus:border-indigo-300"
      }`}
      required
    />
  </div>
);

const LoginApp = ({ isDarkMode: propDarkMode }) => {
  const navigate = useNavigate();
  const [view, setView] = useState("login");

  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const stored =
    typeof window !== "undefined" ? localStorage.getItem("theme") : null;
  const [localDark, setLocalDark] = useState(
    stored ? stored === "dark" : prefersDark,
  );
  const isDark = typeof propDarkMode === "boolean" ? propDarkMode : localDark;

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
    if (typeof propDarkMode !== "boolean") {
      localStorage.setItem("theme", localDark ? "dark" : "light");
    }
  }, [localDark, propDarkMode, isDark]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}api/account/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Login failed.");
      } else {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("userEmail", data.user.email);
        navigate("/home", { state: { email: data.user.email } });
      }
    } catch (err) {
      setError("Network error: could not reach server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}api/account/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Registration failed.");
      } else {
        setView("login");
        resetForm();
      }
    } catch (err) {
      setError("Network error: could not reach server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative ${isDark ? "bg-slate-900" : "bg-slate-50"}`}
    >
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6">
        <button
          type="button"
          aria-label="Toggle theme"
          onClick={() => setLocalDark((s) => !s)}
          className={`flex items-center gap-2 px-3 py-2 rounded-3xl transition-all h-10 ${isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
        >
          {isDark ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM4.22 4.22a1 1 0 011.42 0l.71.71a1 1 0 11-1.42 1.42l-.71-.71a1 1 0 010-1.42zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zm8 6a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm5.78-1.78a1 1 0 010 1.42l-.71.71a1 1 0 11-1.42-1.42l.71-.71a1 1 0 011.42 0zM17 9a1 1 0 100 2h1a1 1 0 100-2h-1zM6.34 14.66a1 1 0 011.42 0l.71.71a1 1 0 01-1.42 1.42l-.71-.71a1 1 0 010-1.42zM13 4a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wider">
                Dark
              </span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-slate-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M17.293 13.293A8 8 0 116.707 2.707a7 7 0 0010.586 10.586z" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wider">
                Light
              </span>
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col items-center w-full max-w-sm sm:max-w-[440px] md:max-w-[460px]">
        {/* Brand */}
        <div className="text-center mb-6 md:mb-10 mt-4 sm:mt-0 animate-in fade-in slide-in-from-top-4 duration-700">
          <Logo />
          <h2
            className={`text-3xl md:text-4xl font-black mb-1 tracking-tight ${isDark ? "text-white" : "text-slate-800"}`}
          >
            Deskmate
          </h2>
          <p
            className={`text-[10px] md:text-[11px] font-bold uppercase tracking-[0.4em] ${isDark ? "text-slate-500" : "text-slate-400"} p-3`}
          >
            Safe Remote Access
          </p>
        </div>

        <div
          className={`relative w-full rounded-3xl shadow-lg p-6 sm:p-10 md:p-14 flex flex-col items-center overflow-hidden transition-colors duration-300 ${isDark ? "bg-slate-900 border border-slate-800" : "bg-white"}`}
        >
          {view === "login" ? (
            <div className="w-full flex flex-col items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div
                className={`px-5 py-1.5 rounded-full w-40 h-8 justify-center flex items-center ${isDark ? "bg-indigo-500/10" : "bg-indigo-50"}`}
              >
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                  Sign In to Continue
                </span>
              </div>
              <h2
                className={`text-2xl md:text-3xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Welcome Back
              </h2>
              <p className="text-xs md:text-sm font-medium text-slate-400 text-center">
                Securely access your workspace anywhere.
              </p>

              <form
                onSubmit={handleLogin}
                className="w-full flex flex-col gap-5 mt-2"
              >
                {error && (
                  <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest text-center bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">
                    {error}
                  </div>
                )}
                <InputField
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="email@example.com"
                  isDarkMode={isDark}
                />
                <InputField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  isDarkMode={isDark}
                  showForgot
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 h-12 rounded-2xl bg-indigo-600 text-white font-bold uppercase tracking-wider hover:bg-indigo-500 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div
                className={`mt-6 pt-6 border-t w-full text-center ${isDark ? "border-slate-800" : "border-slate-50"}`}
              >
                <p className="text-[11px] font-semibold text-slate-400">
                  New to Deskmate?
                  <button
                    onClick={() => {
                      setView("register");
                      resetForm();
                    }}
                    className="ml-2.5 text-indigo-600 font-bold uppercase tracking-widest hover:text-indigo-500 transition-colors cursor-pointer"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
              <div
                className={`px-5 py-1.5 rounded-full ${isDark ? "bg-indigo-500/10" : "bg-indigo-50"}`}
              >
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                  Register New Identity
                </span>
              </div>
              <h2
                className={`text-2xl md:text-3xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Sign Up
              </h2>
              <p className="text-xs md:text-sm font-medium text-slate-400 text-center">
                Start your secure journey with Deskmate.
              </p>

              <form
                onSubmit={handleRegister}
                className="w-full flex flex-col gap-5 mt-2"
              >
                {error && (
                  <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest text-center bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">
                    {error}
                  </div>
                )}
                <InputField
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="email@example.com"
                  isDarkMode={isDark}
                />
                <InputField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  isDarkMode={isDark}
                />
                <InputField
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="••••••••"
                  isDarkMode={isDark}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 h-12 rounded-2xl bg-indigo-600 text-white font-bold uppercase tracking-wider hover:bg-indigo-500 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {isLoading ? "Creating..." : "Create Identity"}
                </button>
              </form>

              <div
                className={`mt-6 pt-6 border-t w-full text-center ${isDark ? "border-slate-800" : "border-slate-50"}`}
              >
                <p className="text-[11px] font-semibold text-slate-400">
                  Already have an identity?
                  <button
                    onClick={() => {
                      setView("login");
                      resetForm();
                    }}
                    className="ml-2.5 text-indigo-600 font-bold uppercase tracking-widest hover:text-indigo-500 transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginApp;
