// Set VITE_API_URL in .env (dev) or in your host's build settings (prod),
// e.g. VITE_API_URL=https://your-backend.example.com — no trailing /api.
export const API_BASE = `${(import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "")}/api`;

// App registers this so any authenticated request that comes back 401
// (expired/invalid token) logs the user out, from whichever component made it.
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) { onUnauthorized = fn; }

// One place for base URL, auth header, JSON parsing and 401 handling.
// Returns { res, data }; callers decide what a non-ok response means.
export async function apiFetch(path, { token, method = "GET", body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token && onUnauthorized) onUnauthorized(data.error);
  return { res, data };
}

// Mirrors the backend's isPriceSyncable: GOLD without an exchange suffix
// (SGB, physical/digital gold, gold funds) has no market price history.
const PRICE_SYNCABLE_TYPES = ["STOCK", "ETF", "GOLD", "CRYPTO"];
export function isPriceSyncable(h) {
  if (!PRICE_SYNCABLE_TYPES.includes(h.assetType)) return false;
  return h.assetType !== "GOLD" || h.ticker.includes(".");
}

export const cardStyle = {
  background: "linear-gradient(145deg, #131722 0%, #161B2A 100%)",
  border: "1px solid #1E2536",
  borderRadius: "16px",
  padding: "1.5rem",
  marginBottom: "1.75rem",
  boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
};

export const pageStyle = {
  minHeight: "100vh",
  background: "#0B0E17",
  fontFamily: "'Inter', sans-serif",
};

export const primaryButtonStyle = {
  background: "linear-gradient(135deg, #D4A853 0%, #B8923E 100%)",
  color: "#0B0E17",
  border: "none",
  borderRadius: "12px",
  padding: "10px 18px",
  fontSize: "13.5px",
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  boxShadow: "0 2px 12px rgba(212,168,83,0.25)",
  transition: "all 0.2s ease",
};

export const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(5,8,15,0.7)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
  zIndex: 50,
};

export const modalStyle = {
  width: "100%",
  maxWidth: "420px",
  maxHeight: "88vh",
  overflowY: "auto",
  background: "#131722",
  border: "1px solid #2A3040",
  borderRadius: "20px",
  padding: "1.75rem",
  boxSizing: "border-box",
  boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
};

export const iconButtonStyle = {
  background: "#1A1F2E",
  border: "1px solid #2A3040",
  borderRadius: "10px",
  padding: "7px",
  cursor: "pointer",
  color: "#8892A8",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
};

export const spinKeyframes = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
