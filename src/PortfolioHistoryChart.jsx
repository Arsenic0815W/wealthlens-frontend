import { useState, useEffect } from "react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp } from "lucide-react";
import { apiFetch, cardStyle } from "./constants";

export default function PortfolioHistoryChart({ token, refreshKey }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const { res, data: json } = await apiFetch("/insights/portfolio-history", { token });
        if (res.ok) setData(json);
      } catch {
        // fail quietly — this chart is a nice-to-have, not core functionality
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [token, refreshKey]);

  if (loading || data.length < 2) return null; // need at least 2 points for a line

  const first = data[0].value;
  const last = data[data.length - 1].value;
  const changePct = first > 0 ? ((last - first) / first) * 100 : 0;
  const isUp = changePct >= 0;

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp size={16} color="#D4A853" />
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#E8EAF0", margin: 0 }}>Portfolio Value Over Time</h2>
        </div>
        <span style={{ fontSize: "13.5px", fontWeight: 700, color: isUp ? "#10B981" : "#F6465D", fontFamily: "'JetBrains Mono', monospace" }}>
          {isUp ? "+" : ""}{changePct.toFixed(1)}%
        </span>
      </div>

      <div style={{ width: "100%", height: "180px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: 10 }}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4A853" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#D4A853" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
              minTickGap={40}
              axisLine={{ stroke: "#1E2536" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              formatter={(value) => [`Rs ${value.toLocaleString("en-IN")}`, "Value"]}
              labelFormatter={(label) => new Date(label).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              contentStyle={{ background: "#1A1F2E", border: "1px solid #2A3040", borderRadius: "12px", fontSize: "12px", color: "#E8EAF0" }}
            />
            <Area type="monotone" dataKey="value" stroke="#D4A853" strokeWidth={2} fill="url(#portfolioGradient)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "6px" }}>
        Based on Stocks, ETFs, exchange-traded Gold, and Crypto only — Mutual Funds, Bonds, and physical/digital gold aren't included yet.
      </div>
    </div>
  );
}


