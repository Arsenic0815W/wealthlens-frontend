import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { X, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { apiFetch, overlayStyle, modalStyle, iconButtonStyle, spinKeyframes } from "./constants";

const VERDICT_STYLES = {
  "Good Entry": { bg: "rgba(16,185,129,0.08)", text: "#10B981", border: "rgba(16,185,129,0.2)", icon: TrendingUp },
  "Fair Entry": { bg: "rgba(245,158,11,0.08)", text: "#F59E0B", border: "rgba(245,158,11,0.2)", icon: Minus },
  "Overpaid": { bg: "rgba(246,70,93,0.08)", text: "#F6465D", border: "rgba(246,70,93,0.2)", icon: TrendingDown },
};

export default function EvaluateModal({ holding, token, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function evaluate() {
      try {
        const { res, data: json } = await apiFetch(`/insights/evaluate/${holding._id}`, { method: "POST", token });
        if (!res.ok) throw new Error(json.error || "Couldn't evaluate this holding");
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    evaluate();
  }, [holding._id, token]);

  const verdictStyle = data ? VERDICT_STYLES[data.verdict] : null;
  const VerdictIcon = verdictStyle?.icon;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#E8EAF0", margin: 0 }}>Entry Quality</h2>
          <button onClick={onClose} style={iconButtonStyle} aria-label="Close"><X size={16} /></button>
        </div>
        <p style={{ fontSize: "13.5px", color: "#6B7280", margin: "0 0 18px", fontFamily: "'JetBrains Mono', monospace" }}>{holding.ticker}</p>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "2.5rem 0" }}>
            <Loader2 size={22} color="#D4A853" style={{ animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: "13.5px", color: "#6B7280" }}>Analyzing historical prices…</span>
          </div>
        )}

        {!loading && error && (
          <div style={{ background: "rgba(246,70,93,0.08)", border: "1px solid rgba(246,70,93,0.2)", borderRadius: "12px", padding: "12px 14px", fontSize: "13.5px", color: "#F6465D", lineHeight: "1.5" }}>{error}</div>
        )}

        {!loading && data && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: verdictStyle.bg, border: `1px solid ${verdictStyle.border}`, borderRadius: "14px", padding: "14px 16px", marginBottom: "16px" }}>
              <VerdictIcon size={20} color={verdictStyle.text} />
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: verdictStyle.text }}>{data.verdict}</div>
                <div style={{ fontSize: "11.5px", color: verdictStyle.text, opacity: 0.85, fontFamily: "'JetBrains Mono', monospace" }}>Score: {data.score > 0 ? "+" : ""}{data.score} / 100</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <StatBox label="You paid" value={`Rs ${data.buyPrice.toLocaleString("en-IN")}`} />
              <StatBox label="52-wk range at buy" value={data.signals.week52Low != null ? `${data.signals.week52Low.toLocaleString("en-IN")} – ${data.signals.week52High.toLocaleString("en-IN")}` : "Not enough data"} small />
              {data.currentPrice != null && <StatBox label="Now trading at" value={`Rs ${data.currentPrice.toLocaleString("en-IN")}`} accent={data.unrealizedPnlPct >= 0 ? "#10B981" : "#F6465D"} />}
              {data.unrealizedPnlPct != null && <StatBox label="Unrealized" value={`${data.unrealizedPnlPct >= 0 ? "+" : ""}${data.unrealizedPnlPct}%`} accent={data.unrealizedPnlPct >= 0 ? "#10B981" : "#F6465D"} />}
            </div>

            {data.priceHistory && data.priceHistory.length > 1 && (
              <div style={{ marginBottom: "18px" }}>
                <div style={sectionLabelStyle}>Price since you bought</div>
                <div style={{ width: "100%", height: "110px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.priceHistory} margin={{ top: 6, right: 6, bottom: 0, left: 6 }}>
                      <XAxis dataKey="date" hide />
                      <YAxis domain={["auto", "auto"]} hide />
                      <ReferenceLine y={data.buyPrice} stroke="#4B5563" strokeDasharray="4 3" />
                      <Tooltip
                        formatter={(value) => [`Rs ${value.toLocaleString("en-IN")}`, "Price"]}
                        labelFormatter={(label) => new Date(label).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        contentStyle={{ background: "#1A1F2E", border: "1px solid #2A3040", borderRadius: "12px", fontSize: "12px", color: "#E8EAF0" }}
                      />
                      <Line type="monotone" dataKey="close" stroke="#D4A853" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ fontSize: "10.5px", color: "#6B7280", marginTop: "2px" }}>Dashed line marks your buy price</div>
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <div style={sectionLabelStyle}>Why</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.reasons.map((r, i) => <div key={i} style={bulletRowStyle}><span style={bulletDotStyle} /><span style={bulletTextStyle}>{r}</span></div>)}
              </div>
            </div>

            <div>
              <div style={sectionLabelStyle}>What this means for you</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.nextSteps.map((s, i) => <div key={i} style={bulletRowStyle}><span style={bulletDotStyle} /><span style={bulletTextStyle}>{s}</span></div>)}
              </div>
            </div>
          </>
        )}
        <style>{spinKeyframes}</style>
      </div>
    </div>
  );
}

function StatBox({ label, value, accent, small }) {
  return (
    <div style={{ background: "#1A1F2E", border: "1px solid #1E2536", borderRadius: "12px", padding: "10px 12px" }}>
      <div style={{ fontSize: "10.5px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "3px" }}>{label}</div>
      <div style={{ fontSize: small ? "12.5px" : "15px", fontWeight: 700, color: accent || "#E8EAF0", fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
    </div>
  );
}

const sectionLabelStyle = { fontSize: "11px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600, marginBottom: "8px" };
const bulletRowStyle = { display: "flex", gap: "8px", alignItems: "flex-start" };
const bulletDotStyle = { width: "5px", height: "5px", borderRadius: "50%", background: "#4B5563", flexShrink: 0, marginTop: "6px" };
const bulletTextStyle = { fontSize: "13.5px", color: "#C4C9D4", lineHeight: "1.55" };

