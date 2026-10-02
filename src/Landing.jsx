import { TrendingUp, ArrowRight } from "lucide-react";
import { pageStyle, primaryButtonStyle } from "./constants";

export default function Landing({ onGetStarted, onLogin }) {
  return (
    <div style={pageStyle}>
      <nav style={navStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp size={18} color="#D4A853" strokeWidth={2.5} />
          <span style={{ fontWeight: 600, fontSize: "15px", color: "#E8EAF0" }}>WealthLens</span>
        </div>
        <button onClick={onGetStarted} style={navCtaStyle}>Get Started</button>
      </nav>

      <div style={heroStyle}>
        <h1 style={heroTitleStyle}>
          Your portfolio,<br />clearly understood.
        </h1>
        <p style={heroSubtitleStyle}>
          Track stocks, mutual funds, ETFs, gold, and crypto in one place. Real-time prices, allocation insights, and entry quality analysis.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button onClick={onGetStarted} style={heroPrimaryBtn}>Get Started <ArrowRight size={15} /></button>
          <button onClick={onLogin} style={heroSecondaryBtn}>Log in</button>
        </div>
      </div>

      <div style={statsBarStyle}>
        {[
          { value: "6", label: "Asset classes" },
          { value: "Daily", label: "Price sync" },
          { value: "100%", label: "Private" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#E8EAF0", fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={featuresSectionStyle}>
        <div style={featuresGridStyle}>
          {[
            { title: "Real-Time Tracking", desc: "Prices sync automatically every trading day across all asset classes." },
            { title: "Allocation Insights", desc: "See how your portfolio splits across stocks, funds, gold, and crypto." },
            { title: "Entry Analysis", desc: "Evaluate whether you bought at a fair price with historical context." },
            { title: "Multi-Asset", desc: "Stocks, mutual funds, bonds, ETFs, gold, and crypto in one dashboard." },
            { title: "Secure", desc: "Your data stays private. No tracking, no sharing, no noise." },
            { title: "Fast", desc: "One-click sync updates every holding. No spreadsheets needed." },
          ].map((f) => (
            <div key={f.title} style={featureCardStyle}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#E8EAF0", margin: "0 0 6px" }}>{f.title}</h3>
              <p style={{ fontSize: "13px", color: "#6B7280", margin: 0, lineHeight: "1.6" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={ctaSectionStyle}>
        <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#E8EAF0", margin: "0 0 6px" }}>Start tracking today</h2>
        <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 1.25rem" }}>Free. No credit card required.</p>
        <button onClick={onGetStarted} style={{ ...heroPrimaryBtn, padding: "11px 22px" }}>Get Started <ArrowRight size={15} /></button>
      </div>

      <footer style={footerStyle}>
        <span style={{ fontSize: "12px", color: "#4B5563" }}>WealthLens</span>
        <span style={{ fontSize: "12px", color: "#4B5563" }}>Portfolio intelligence</span>
      </footer>
    </div>
  );
}


const navStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 2rem", borderBottom: "1px solid #1E2536" };
const navCtaStyle = { background: "transparent", color: "#D4A853", border: "1px solid #2A3040", borderRadius: "8px", padding: "7px 16px", fontSize: "13px", fontWeight: 500, cursor: "pointer" };

const heroStyle = { textAlign: "center", padding: "5rem 2rem 3.5rem", maxWidth: "640px", margin: "0 auto" };
const heroTitleStyle = { fontSize: "36px", fontWeight: 700, margin: "0 0 1rem", letterSpacing: "-0.02em", lineHeight: 1.2 };
const heroSubtitleStyle = { fontSize: "15px", color: "#8892A8", margin: "0 0 1.75rem", lineHeight: 1.7 };
const heroPrimaryBtn = { background: "#D4A853", color: "#0B0E17", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" };
const heroSecondaryBtn = { background: "transparent", color: "#8892A8", border: "1px solid #2A3040", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: 500, cursor: "pointer" };

const statsBarStyle = { display: "flex", justifyContent: "center", gap: "4rem", padding: "1.5rem 2rem", borderTop: "1px solid #1E2536", borderBottom: "1px solid #1E2536", maxWidth: "800px", margin: "0 auto" };

const featuresSectionStyle = { padding: "3.5rem 2rem", maxWidth: "900px", margin: "0 auto" };
const featuresGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" };
const featureCardStyle = { borderLeft: "2px solid #2A3040", paddingLeft: "1rem" };

const ctaSectionStyle = { textAlign: "center", padding: "3rem 2rem 4rem", borderTop: "1px solid #1E2536", maxWidth: "900px", margin: "0 auto" };

const footerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 2rem", borderTop: "1px solid #1E2536" };
