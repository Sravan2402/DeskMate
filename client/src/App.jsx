// src/App.jsx — this is what your App.jsx should look like

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";

// ── Protected Route wrapper ──────────────────────────────
// Checks if accessToken exists in localStorage.
// If not → redirects to /login automatically.
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// ── App ──────────────────────────────────────────────────
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public — anyone can visit */}
        <Route path="/login" element={<Login />} />

        {/* Protected — must be logged in */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
