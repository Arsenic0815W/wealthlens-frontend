import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { AlertTriangle, CheckCircle2, Info, Sparkles } from "lucide-react";
import { apiFetch, cardStyle } from "./constants";

const ASSET_COLORS = {
  STOCK: "#D4A853", MUTUAL_FUND: "#A78BFA", BOND: "#C084FC",
  ETF: "#34D399", GOLD: "#FBBF24", CRYPTO: "#F472B6", OTHER: "#6B7280",
};

function insightTone(text) {
  if (text.includes("large share") || text.includes("outsized") || text.includes("consider spreading")) {
    return { icon: AlertTriangle, iconColor: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" };
  }
  if (text.includes("reasonably spread") || text.includes("no single")) {
    return { icon: CheckCircle2, iconColor: "#10B981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" };
  }
  return { icon: Info, iconColor: "#D4A853", bg: "rgba(212,168,83,0.08)", border: "rgba(212,168,83,0.2)" };
}

export default function InsightsPanel({ token, refreshKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchInsights() {
      try {
        const { res, data: json } = await apiFetch("/insights/allocation", { token });
        if (!res.ok) throw new Error(json.error || "Failed to load insights");
        setData(json);
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, [token, refreshKey]);

  if (loading) {
    return <div style={{ padding: "1.5rem 0", textAlign: "center", color: "#6B7280", fontSize: "13.5px" }}>Analyzing your portfolio…</div>;
  }
  if (error || !data || data.byAssetType.length === 0) return null;

  const chartData = data.byAssetType.map((a) => ({ name: a.label, value: a.value, percent: a.percent, color: ASSET_COLORS[a.assetType] || ASSET_COLORS.OTHER }));

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
        <Sparkles size={16} color="#D4A853" />
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#E8EAF0", margin: 0 }}>Portfolio Insights</h2>
      </div>

      <div style={{ display: "flex", gap: "28px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ width: "150px", height: "150px", flexShrink: 0, position: "relative" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={chartData.length > 1 ? 3 : 0} strokeWidth={0}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(value, name, props) => [`${props.payload.percent.toFixed(1)}%`, name]} contentStyle={{ background: "#1A1F2E", border: "1px solid #2A3040", borderRadius: "12px", fontSize: "12.5px", color: "#E8EAF0" }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
            <div style={{ fontSize: "10.5px", color: "#6B7280" }}>Total</div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#E8EAF0", fontFamily: "'JetBrains Mono', monospace" }}>Rs {(data.totalValue / 1000).toFixed(0)}k</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "9px", minWidth: "150px" }}>
          {chartData.map((a) => (
            <div key={a.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "9px", height: "9px", borderRadius: "3px", background: a.color, flexShrink: 0 }} />
              <span style={{ fontSize: "13.5px", color: "#8892A8", flex: 1 }}>{a.name}</span>
              <span style={{ fontSize: "13.5px", color: "#E8EAF0", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{a.percent.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {data.insights.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
          {data.insights.map((text, i) => {
            const tone = insightTone(text);
            const Icon = tone.icon;
            return (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", background: tone.bg, border: `1px solid ${tone.border}`, borderRadius: "12px", padding: "11px 14px" }}>
                <Icon size={16} color={tone.iconColor} style={{ flexShrink: 0, marginTop: "1px" }} />
                <span style={{ fontSize: "13.5px", color: "#C4C9D4", lineHeight: "1.55" }}>{text}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


