import { useState, useEffect, useCallback } from "react";
import Landing from "./Landing";
import WealthLensAuth from "./WealthLensAuth";
import Dashboard from "./Dashboard";
import { apiFetch, setUnauthorizedHandler, pageStyle } from "./constants";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  // With a saved token, start in "restoring" until /auth/me confirms it,
  // instead of dropping a logged-in user on the landing page.
  const [screen, setScreen] = useState(() => (localStorage.getItem("token") ? "restoring" : "landing"));
  const [authMode, setAuthMode] = useState("signup");
  const [user, setUser] = useState(null);
  const [authNotice, setAuthNotice] = useState("");

  const handleLogout = useCallback((notice = "") => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setAuthMode("login");
    setAuthNotice(notice);
    setScreen("auth");
  }, []);

  // Any 401 on an authenticated request (expired or revoked token) ends the session.
  useEffect(() => {
    setUnauthorizedHandler(() => handleLogout("Your session expired. Please log in again."));
    return () => setUnauthorizedHandler(null);
  }, [handleLogout]);

  // Restore the session on page load. A 401 is handled by the handler above;
  // if the server is unreachable, keep the token and let the dashboard show its own errors.
  useEffect(() => {
    if (!token || screen !== "restoring") return;
    let cancelled = false;
    apiFetch("/auth/me", { token })
      .then(({ res, data }) => {
        if (cancelled || res.status === 401) return; // 401 → handler already logged out
        if (res.ok) setUser({ id: data.id, name: data.name, email: data.email });
        setScreen("dashboard");
      })
      .catch(() => { if (!cancelled) setScreen("dashboard"); });
    return () => { cancelled = true; };
  }, [token, screen]);

  const handleAuthSuccess = (newToken, newUser) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(newUser);
    setAuthNotice("");
    setScreen("dashboard");
  };

  if (screen === "restoring") {
    return <div style={{ ...pageStyle, display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280", fontSize: "13.5px" }}>Loading your portfolio…</div>;
  }

  if (screen === "landing") {
    return (
      <Landing
        onGetStarted={() => { setAuthMode("signup"); setAuthNotice(""); setScreen("auth"); }}
        onLogin={() => { setAuthMode("login"); setAuthNotice(""); setScreen("auth"); }}
      />
    );
  }

  if (!token || screen === "auth") {
    return <WealthLensAuth key={authMode} initialMode={authMode} notice={authNotice} onAuthSuccess={handleAuthSuccess} onBack={() => setScreen("landing")} />;
  }

  return <Dashboard token={token} user={user} onLogout={() => handleLogout()} />;
}

export default App;
