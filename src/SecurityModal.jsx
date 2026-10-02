import { useState, useEffect } from "react";
import { X, Loader2, Copy, Check } from "lucide-react";
import { apiFetch, overlayStyle, modalStyle, primaryButtonStyle, iconButtonStyle, spinKeyframes } from "./constants";

const labelStyle = { display: "block", fontSize: "13px", fontWeight: 600, color: "#8892A8", marginBottom: "6px" };
const inputStyle = { width: "100%", background: "#0B0E17", border: "1.5px solid #2A3040", borderRadius: "12px", padding: "11px 14px", fontSize: "14.5px", color: "#E8EAF0", outline: "none", boxSizing: "border-box", marginBottom: "1rem" };
const errorStyle = { background: "rgba(246,70,93,0.08)", border: "1px solid rgba(246,70,93,0.2)", borderRadius: "12px", padding: "10px 14px", fontSize: "13.5px", color: "#F6465D", marginBottom: "1rem" };
const mutedStyle = { fontSize: "13.5px", color: "#8892A8", margin: "0 0 1rem", lineHeight: 1.5 };
const btn = { ...primaryButtonStyle, width: "100%", justifyContent: "center" };

// Sets up or removes TOTP two-factor auth. The backup codes and QR live only in
// this component's state, so closing the modal discards them.
export default function SecurityModal({ token, onClose }) {
  const [enabled, setEnabled] = useState(null); // null = loading
  const [setup, setSetup] = useState(null); // { qrCodeDataUrl, otpauthUrl }
  const [backupCodes, setBackupCodes] = useState(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiFetch("/auth/me", { token })
      .then(({ res, data }) => { if (res.ok) setEnabled(!!data.twoFactorEnabled); else setError(data.error || "Couldn't load security settings."); })
      .catch(() => setError("Couldn't reach the server."));
  }, [token]);

  const call = async (path, body) => {
    setBusy(true);
    setError("");
    try {
      const { res, data } = await apiFetch(`/auth/2fa/${path}`, { token, method: "POST", body });
      if (!res.ok) { setError(data.error || "Something went wrong. Try again."); return null; }
      return data;
    } catch {
      setError("Couldn't reach the server. Please try again.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const startSetup = async () => { const d = await call("setup"); if (d) setSetup(d); };
  const confirmEnable = async (e) => {
    e.preventDefault();
    const d = await call("enable", { code: code.trim() });
    if (d) { setBackupCodes(d.backupCodes); setEnabled(true); setSetup(null); setCode(""); }
  };
  const disable = async (e) => {
    e.preventDefault();
    const d = await call("disable", { password, code: code.trim() });
    if (d) { setEnabled(false); setCode(""); setPassword(""); }
  };
  const copyCodes = async () => {
    try { await navigator.clipboard.writeText(backupCodes.join("\n")); setCopied(true); } catch { setError("Couldn't copy. Select the codes and copy them manually."); }
  };

  const codeInput = (id, label = "6-digit code from your authenticator app") => (
    <>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      <input id={id} type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={16} placeholder="123456" style={inputStyle} />
    </>
  );
  const submitContent = (text) => (busy ? <Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} /> : text);

  let body;
  if (backupCodes) {
    body = (
      <>
        <p style={{ ...mutedStyle, color: "#D4A853" }}><strong>Save these now — they won't be shown again.</strong> Each backup code works once if you lose your authenticator.</p>
        <ul aria-label="Backup codes" style={{ listStyle: "none", margin: "0 0 1rem", padding: "1rem", background: "#0B0E17", border: "1px solid #2A3040", borderRadius: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontFamily: "monospace", fontSize: "14px", color: "#E8EAF0" }}>
          {backupCodes.map((c) => <li key={c}>{c}</li>)}
        </ul>
        <button type="button" onClick={copyCodes} style={{ ...btn, marginBottom: "0.75rem" }}>{copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy codes</>}</button>
        <button type="button" onClick={onClose} style={{ ...iconButtonStyle, width: "100%", padding: "10px", fontSize: "13.5px" }}>I've saved them</button>
      </>
    );
  } else if (enabled === null) {
    body = error ? null : <p style={mutedStyle}>Loading…</p>;
  } else if (enabled) {
    body = (
      <form onSubmit={disable}>
        <p style={mutedStyle}>Two-factor authentication is <strong style={{ color: "#E8EAF0" }}>on</strong>. To turn it off, confirm your password and a code (authenticator or backup).</p>
        <label htmlFor="sec-password" style={labelStyle}>Current password</label>
        <input id="sec-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
        {codeInput("sec-disable-code", "Authenticator or backup code")}
        <button type="submit" disabled={busy || !password || !code} style={btn}>{submitContent("Disable 2FA")}</button>
      </form>
    );
  } else if (setup) {
    body = (
      <form onSubmit={confirmEnable}>
        <p style={mutedStyle}>Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.</p>
        <img src={setup.qrCodeDataUrl} alt="QR code for your authenticator app" width={180} height={180} style={{ display: "block", margin: "0 auto 1rem", background: "#fff", padding: "8px", borderRadius: "12px" }} />
        {codeInput("sec-enable-code")}
        <button type="submit" disabled={busy || code.trim().length !== 6} style={btn}>{submitContent("Confirm and enable")}</button>
      </form>
    );
  } else {
    body = (
      <>
        <p style={mutedStyle}>Two-factor authentication is <strong style={{ color: "#E8EAF0" }}>off</strong>. Add an authenticator app (Google Authenticator, Authy, 1Password…) for a second login step.</p>
        <button type="button" onClick={startSetup} disabled={busy} style={btn}>{submitContent("Enable 2FA")}</button>
      </>
    );
  }

  return (
    <div style={overlayStyle} onClick={backupCodes ? undefined : onClose}>
      <div style={modalStyle} role="dialog" aria-modal="true" aria-labelledby="sec-title" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 id="sec-title" style={{ fontSize: "18px", fontWeight: 700, color: "#E8EAF0", margin: 0 }}>Security</h2>
          <button type="button" onClick={onClose} style={iconButtonStyle} aria-label="Close"><X size={16} /></button>
        </div>
        {error && <div role="alert" style={errorStyle}>{error}</div>}
        {body}
      </div>
      <style>{spinKeyframes}</style>
    </div>
  );
}
