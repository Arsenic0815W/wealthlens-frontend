import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from "recharts";
import { BarChart3 } from "lucide-react";
import { cardStyle } from "./constants";

export default function GainLossChart({ holdings }) {
  const data = holdings
    .filter((h) => h.currentPrice != null)
    .map((h) => {
      const invested = Number(h.quantity) * Number(h.buyPrice);
      const current = Number(h.quantity) * Number(h.currentPrice);
      const pct = invested > 0 ? ((current - invested) / invested) * 100 : 0;
      return { ticker: h.ticker, pct: Math.round(pct * 10) / 10 };
    })
    .sort((a, b) => b.pct - a.pct);

  if (data.length < 2) return null; // not much to compare with fewer than 2 synced holdings

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <BarChart3 size={16} color="#D4A853" />
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#E8EAF0", margin: 0 }}>Gain / Loss by Holding</h2>
      </div>

      <div style={{ width: "100%", height: Math.max(120, data.length * 34) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="ticker" tick={{ fontSize: 12.5, fill: "#C4C9D4", fontFamily: "'JetBrains Mono', monospace" }} width={90} axisLine={false} tickLine={false} />
            <ReferenceLine x={0} stroke="#2A3040" />
            <Tooltip formatter={(value) => [`${value >= 0 ? "+" : ""}${value}%`, "Gain/Loss"]} contentStyle={{ background: "#1A1F2E", border: "1px solid #2A3040", borderRadius: "12px", fontSize: "12px", color: "#E8EAF0" }} />
            <Bar dataKey="pct" radius={[0, 6, 6, 0]} barSize={16}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.pct >= 0 ? "#10B981" : "#F6465D"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


