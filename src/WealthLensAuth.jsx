import { useState } from "react";
import { TrendingUp, Eye, EyeOff, ArrowRight, Loader2, Copy, Check } from "lucide-react";

import { apiFetch } from "./constants";

function Field({ label, type, value, onChange, placeholder, error, rightSlot, ...inputProps }) {
  return (
    <label style={{ display: "block", marginBottom: "1.25rem" }}>
      <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#8892A8", marginBottom: "6px" }}>{label}</span>
      <div style={{ position: "relative" }}>
        <input
          type={type} value={value} onChange={onChange} placeholder={placeholder} {...inputProps}
          style={{
            width: "100%", background: "#131722", border: `1.5px solid ${error ? "#F6465D" : "#2A3040"}`,
            borderRadius: "12px", padding: "11px 14px", paddingRight: rightSlot ? "42px" : "14px",
            fontSize: "14.5px", color: "#E8EAF0", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s ease",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#D4A853")}
          onBlur={(e) => (e.target.style.borderColor = error ? "#F6465D" : "#2A3040")}
        />
        {rightSlot && <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}>{rightSlot}</div>}
      </div>
      {error && <span style={{ display: "block", fontSize: "12.5px", color: "#F6465D", marginTop: "5px" }}>{error}</span>}
    </label>
  );
}

export default function WealthLensAuth({ initialMode = "login", notice = "", onAuthSuccess, onBack }) {
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(notice);
  const [tempToken, setTempToken] = useState(null); // set → showing the 2FA step
  const [code, setCode] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  // Signup wizard: { step: "email" } → { step: "qr", setupToken, qrCodeDataUrl } → { step: "backup", backupCodes, session }
  const [signup, setSignup] = useState(null);
  const [copied, setCopied] = useState(false);

  const update = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setErrors((err) => ({ ...err, [key]: undefined })); };

  const validate = () => {
    const errs = {};
    if (mode === "signup" && !form.name.trim()) errs.name = "Enter your name";
    if (!form.email.trim()) errs.email = "Enter your email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errs.email = "Enter a valid email";
    if (!form.password) errs.password = "Enter your password";
    else if (form.password.length < 6) errs.password = "At least 6 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/login" : "/signup";
      const email = form.email.trim().toLowerCase();
      const body = mode === "login" ? { email, password: form.password } : { name: form.name, email, password: form.password };
      const { res, data } = await apiFetch(`/auth${endpoint}`, { method: "POST", body });
      if (!res.ok) { setServerError(data.error || "Something went wrong. Try again."); return; }
      if (data.twoFactorRequired) { setTempToken(data.tempToken); return; }
      if (data.verificationRequired) { setSignup({ step: "email" }); setCode(""); return; }
      onAuthSuccess(data.token, data.user);
    } catch {
      setServerError("Couldn't reach the server. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!code.trim()) { setServerError("Enter your code"); return; }
    setLoading(true);
    try {
      const { res, data } = await apiFetch("/auth/2fa/verify-login", { method: "POST", body: { tempToken, code: code.trim() } });
      if (!res.ok) {
        setServerError(data.error || "Something went wrong. Try again.");
        if (res.status === 401 && /expired|Invalid token/.test(data.error || "")) backToPassword();
        return;
      }
      onAuthSuccess(data.token, data.user);
    } catch {
      setServerError("Couldn't reach the server. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  function backToPassword() { setTempToken(null); setSignup(null); setCode(""); setUseBackup(false); }

  const submitSignupCode = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!/^\d{6}$/.test(code.trim())) { setServerError("Enter the 6-digit code"); return; }
    setLoading(true);
    try {
      const isEmail = signup.step === "email";
      const { res, data } = await apiFetch(isEmail ? "/auth/signup/verify" : "/auth/signup/complete", {
        method: "POST",
        body: isEmail ? { email: form.email.trim().toLowerCase(), code: code.trim() } : { setupToken: signup.setupToken, code: code.trim() },
      });
      if (!res.ok) {
        setServerError(data.error || "Something went wrong. Try again.");
        if (/expired|sign up again/i.test(data.error || "")) backToPassword();
        return;
      }
      setCode("");
      setSignup(isEmail
        ? { step: "qr", setupToken: data.setupToken, qrCodeDataUrl: data.qrCodeDataUrl }
        : { step: "backup", backupCodes: data.backupCodes, session: { token: data.token, user: data.user } });
    } catch {
      setServerError("Couldn't reach the server. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setServerError("");
    setLoading(true);
    try {
      const { res, data } = await apiFetch("/auth/signup", { method: "POST", body: { name: form.name, email: form.email.trim().toLowerCase(), password: form.password } });
      setServerError(res.ok ? "A new code is on its way." : data.error || "Couldn't resend the code.");
    } catch {
      setServerError("Couldn't reach the server. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const copyCodes = async () => {
    try { await navigator.clipboard.writeText(signup.backupCodes.join("\n")); setCopied(true); } catch { setServerError("Couldn't copy. Select the codes and copy them manually."); }
  };

  return (
    <div style={pageStyle}>
      <div style={{ width: "100%", maxWidth: "400px", marginBottom: "1rem" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "13.5px", display: "flex", alignItems: "center", gap: "6px", padding: 0 }}>
          <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to home
        </button>
      </div>
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.75rem" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "linear-gradient(135deg, #D4A853 0%, #B8923E 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(212,168,83,0.3)" }}>
            <TrendingUp size={17} color="#0B0E17" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "18px", color: "#E8EAF0" }}>WealthLens</span>
        </div>

        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#E8EAF0", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
          {signup?.step === "email" ? "Verify your email" : signup?.step === "qr" ? "Set up your authenticator" : signup?.step === "backup" ? "Save your backup codes" : tempToken ? "Two-factor authentication" : mode === "login" ? "Log in to your portfolio" : "Track your portfolio"}
        </h1>
        <p style={{ fontSize: "13.5px", color: "#6B7280", margin: "0 0 1.75rem" }}>
          {signup?.step === "email" ? `We sent a 6-digit code to ${form.email.trim()}. It expires in 10 minutes.`
            : signup?.step === "qr" ? "Scan this QR code with an authenticator app (Google Authenticator, Authy, 1Password…), then enter the 6-digit code it shows."
            : signup?.step === "backup" ? "Save these now, they won't be shown again. Each works once if you lose your authenticator."
            : tempToken ? (useBackup ? "Enter one of your saved backup codes." : "Enter the code from your authenticator app.") : mode === "login" ? "Pick up where you left off." : "Create an account to start tracking holdings."}
        </p>

        {signup?.step === "backup" ? (
        <div>
          <ul aria-label="Backup codes" style={{ listStyle: "none", margin: "0 0 1rem", padding: "1rem", background: "#0B0E17", border: "1px solid #2A3040", borderRadius: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontFamily: "monospace", fontSize: "14px", color: "#E8EAF0" }}>
            {signup.backupCodes.map((c) => <li key={c}>{c}</li>)}
          </ul>
          {serverError && <div role="alert" style={{ background: "rgba(246,70,93,0.08)", border: "1px solid rgba(246,70,93,0.2)", borderRadius: "12px", padding: "10px 14px", fontSize: "13.5px", color: "#F6465D", marginBottom: "1.1rem" }}>{serverError}</div>}
          <button type="button" onClick={copyCodes} style={{ ...primaryButtonStyle, marginBottom: "0.75rem" }}>{copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy codes</>}</button>
          <button type="button" onClick={() => onAuthSuccess(signup.session.token, signup.session.user)} style={{ width: "100%", background: "#1A1F2E", border: "1px solid #2A3040", borderRadius: "12px", padding: "11px", color: "#E8EAF0", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>I've saved them, continue</button>
        </div>
        ) : signup ? (
        <form onSubmit={submitSignupCode}>
          {signup.step === "qr" && <img src={signup.qrCodeDataUrl} alt="QR code for your authenticator app" width={180} height={180} style={{ display: "block", margin: "0 auto 1.25rem", background: "#fff", padding: "8px", borderRadius: "12px" }} />}
          <Field
            label={signup.step === "email" ? "Email verification code" : "Authenticator code"} type="text" value={code}
            onChange={(e) => { setCode(e.target.value); setServerError(""); }}
            placeholder="123456" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6}
          />
          {serverError && (
            <div role="alert" style={{ background: "rgba(246,70,93,0.08)", border: "1px solid rgba(246,70,93,0.2)", borderRadius: "12px", padding: "10px 14px", fontSize: "13.5px", color: "#F6465D", marginBottom: "1.1rem" }}>{serverError}</div>
          )}
          <button type="submit" disabled={loading} style={primaryButtonStyle}>
            {loading ? <Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} /> : (<>{signup.step === "email" ? "Verify email" : "Create account"}<ArrowRight size={15} /></>)}
          </button>
          <p style={{ textAlign: "center", fontSize: "13.5px", marginTop: "1.25rem" }}>
            {signup.step === "email" && (
              <button type="button" onClick={resendCode} disabled={loading} style={{ background: "none", border: "none", color: "#D4A853", cursor: "pointer", fontSize: "13.5px", fontWeight: 600, padding: 0, marginRight: "1rem" }}>Resend code</button>
            )}
            <button type="button" onClick={() => { backToPassword(); setServerError(""); }} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "13.5px", padding: 0 }}>Start over</button>
          </p>
        </form>
        ) : tempToken ? (
        <form onSubmit={submitCode}>
          <Field
            label={useBackup ? "Backup code" : "6-digit code"} type="text" value={code}
            onChange={(e) => { setCode(e.target.value); setServerError(""); }}
            placeholder={useBackup ? "xxxxx-xxxxx" : "123456"}
            inputMode={useBackup ? "text" : "numeric"} autoComplete="one-time-code" autoFocus
            maxLength={useBackup ? 16 : 6}
          />
          {serverError && (
            <div style={{ background: "rgba(246,70,93,0.08)", border: "1px solid rgba(246,70,93,0.2)", borderRadius: "12px", padding: "10px 14px", fontSize: "13.5px", color: "#F6465D", marginBottom: "1.1rem" }}>{serverError}</div>
          )}
          <button type="submit" disabled={loading} style={primaryButtonStyle}>
            {loading ? <Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} /> : (<>Verify<ArrowRight size={15} /></>)}
          </button>
          <p style={{ textAlign: "center", fontSize: "13.5px", marginTop: "1.25rem" }}>
            <button type="button" onClick={() => { setUseBackup((b) => !b); setCode(""); setServerError(""); }} style={{ background: "none", border: "none", color: "#D4A853", cursor: "pointer", fontSize: "13.5px", fontWeight: 600, padding: 0 }}>
              {useBackup ? "Use authenticator code instead" : "Use a backup code instead"}
            </button>
          </p>
        </form>
        ) : (
        <form onSubmit={submit}>
          {mode === "signup" && <Field label="Name" type="text" value={form.name} onChange={update("name")} placeholder="Shubham Bhujbal" error={errors.name} />}
          <Field label="Email" type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" error={errors.email} />
          <Field
            label="Password" type={showPassword ? "text" : "password"} value={form.password} onChange={update("password")} placeholder="••••••••" error={errors.password}
            rightSlot={
              <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? "Hide password" : "Show password"} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "#6B7280" }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          {serverError && (
            <div style={{ background: "rgba(246,70,93,0.08)", border: "1px solid rgba(246,70,93,0.2)", borderRadius: "12px", padding: "10px 14px", fontSize: "13.5px", color: "#F6465D", marginBottom: "1.1rem" }}>{serverError}</div>
          )}

          <button type="submit" disabled={loading} style={primaryButtonStyle}>
            {loading ? <Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} /> : (<>{mode === "login" ? "Log in" : "Create account"}<ArrowRight size={15} /></>)}
          </button>
        </form>
        )}

        {!tempToken && !signup && <p style={{ textAlign: "center", fontSize: "13.5px", color: "#6B7280", marginTop: "1.5rem" }}>
          {mode === "login" ? "New to WealthLens?" : "Already have an account?"}{" "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErrors({}); setServerError(""); }} style={{ background: "none", border: "none", color: "#D4A853", cursor: "pointer", fontSize: "13.5px", fontWeight: 600, padding: 0 }}>
            {mode === "login" ? "Create one" : "Log in"}
          </button>
        </p>}
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const pageStyle = { minHeight: "100vh", background: "#0B0E17", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", fontFamily: "'Inter', sans-serif" };
const cardStyle = { width: "100%", maxWidth: "400px", background: "linear-gradient(145deg, #131722 0%, #161B2A 100%)", border: "1px solid #2A3040", borderRadius: "20px", padding: "2.25rem", boxSizing: "border-box", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" };
const primaryButtonStyle = { width: "100%", background: "linear-gradient(135deg, #D4A853 0%, #B8923E 100%)", color: "#0B0E17", border: "none", borderRadius: "12px", padding: "12px", fontSize: "14.5px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: "0 2px 12px rgba(212,168,83,0.25)", transition: "all 0.2s ease" };
