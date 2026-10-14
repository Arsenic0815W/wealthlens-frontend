import { useState, useEffect } from "react";
import { TrendingUp, Plus, X, Trash2, Pencil, LogOut, ShieldCheck, Clock, AlertTriangle, Sparkles, PartyPopper, Wallet, Layers, RefreshCw } from "lucide-react";
import InsightsPanel from "./InsightsPanel";
import EvaluateModal from "./EvaluateModal";
import SecurityModal from "./SecurityModal";
import PortfolioHistoryChart from "./PortfolioHistoryChart";
import GainLossChart from "./GainLossChart";
import { apiFetch, isPriceSyncable, pageStyle, primaryButtonStyle, overlayStyle, modalStyle, iconButtonStyle, spinKeyframes } from "./constants";

// Folder is "Data" — the path must match its exact case or the Linux build fails.
import stocksData from "./Data/stocks.json";
import mutualFundsData from "./Data/mutualFunds.json";
import bondsData from "./Data/bonds.json";
import etfsData from "./Data/etfs.json";
import goldData from "./Data/gold.json";
import cryptoData from "./Data/crypto.json";

const ASSET_TYPES = [
  { value: "STOCK", label: "Stock" }, { value: "MUTUAL_FUND", label: "Mutual Fund" },
  { value: "BOND", label: "Bond" }, { value: "ETF", label: "ETF" },
  { value: "GOLD", label: "Gold" }, { value: "CRYPTO", label: "Crypto" }, { value: "OTHER", label: "Other" },
];

const ASSET_DATASETS = { STOCK: stocksData, MUTUAL_FUND: mutualFundsData, BOND: bondsData, ETF: etfsData, GOLD: goldData, CRYPTO: cryptoData, OTHER: [] };

const ASSET_BADGE_COLORS = {
  STOCK: { bg: "rgba(212,168,83,0.12)", text: "#D4A853" }, MUTUAL_FUND: { bg: "rgba(139,92,246,0.12)", text: "#A78BFA" },
  BOND: { bg: "rgba(168,85,247,0.12)", text: "#C084FC" }, ETF: { bg: "rgba(16,185,129,0.12)", text: "#34D399" },
  GOLD: { bg: "rgba(245,158,11,0.12)", text: "#FBBF24" }, CRYPTO: { bg: "rgba(236,72,153,0.12)", text: "#F472B6" }, OTHER: { bg: "rgba(107,114,128,0.12)", text: "#9CA3AF" },
};

function assetLabel(value) { return ASSET_TYPES.find((a) => a.value === value)?.label || value; }

function AssetBadge({ type }) {
  const c = ASSET_BADGE_COLORS[type] || ASSET_BADGE_COLORS.OTHER;
  return <span style={{ fontSize: "10.5px", fontWeight: 600, color: c.text, background: c.bg, borderRadius: "6px", padding: "3px 8px", whiteSpace: "nowrap", letterSpacing: "0.02em" }}>{assetLabel(type)}</span>;
}

function searchAssets(dataset, query) {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  const scored = [];
  for (const item of dataset) {
    const sym = item.symbol.toUpperCase();
    const name = item.name.toUpperCase();
    let score = null;
    if (sym.startsWith(q)) score = 0;
    else if (name.startsWith(q)) score = 1;
    else if (sym.includes(q)) score = 2;
    else if (name.includes(q)) score = 3;
    if (score !== null) scored.push({ ...item, _score: score });
  }
  scored.sort((a, b) => a._score - b._score || a.symbol.localeCompare(b.symbol));
  return scored.slice(0, 8);
}

function TickerAutocomplete({ assetType, value, onChange, error }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const dataset = ASSET_DATASETS[assetType] || [];
  const results = searchAssets(dataset, query);
  const freeText = dataset.length === 0;

  // Reset the query when the asset type changes — adjusted during render, not in an effect.
  const [prevAssetType, setPrevAssetType] = useState(assetType);
  if (assetType !== prevAssetType) { setPrevAssetType(assetType); setQuery(value || ""); }

  const selectItem = (item) => {
    const label = assetType === "MUTUAL_FUND" ? item.name : item.symbol;
    setQuery(label); onChange(label); setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); selectItem(results[highlightIdx]); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text" value={query}
        placeholder={assetType === "MUTUAL_FUND" ? "Search fund name..." : assetType === "CRYPTO" ? "Search crypto (e.g. BTC)" : freeText ? "Enter asset name" : "Search ticker (e.g. TCS)"}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); setHighlightIdx(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={handleKeyDown}
        style={inputStyle(error)}
      />
      {open && !freeText && results.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#1A1F2E", border: "1px solid #2A3040", borderRadius: "12px", boxShadow: "0 12px 40px rgba(0,0,0,0.5)", zIndex: 10, maxHeight: "240px", overflowY: "auto" }}>
          {results.map((item, idx) => (
            <div key={item.symbol} onMouseDown={() => selectItem(item)} onMouseEnter={() => setHighlightIdx(idx)}
              style={{ padding: "10px 14px", cursor: "pointer", background: idx === highlightIdx ? "rgba(212,168,83,0.08)" : "transparent", display: "flex", justifyContent: "space-between", gap: "8px", borderBottom: idx < results.length - 1 ? "1px solid #1E2536" : "none" }}>
              <span style={{ fontSize: "13.5px", color: "#E8EAF0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
              <span style={{ fontSize: "12.5px", color: "#6B7280", flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>{item.symbol}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ token, user, onLogout }) {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [evaluatingHolding, setEvaluatingHolding] = useState(null);
  const [editingHolding, setEditingHolding] = useState(null);
  const [marketStatus, setMarketStatus] = useState(null);
  const [showSecurity, setShowSecurity] = useState(false);
  // Bumped whenever holdings change so the insights and history panels refetch.
  const [refreshKey, setRefreshKey] = useState(0);
  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    async function fetchMarketStatus() {
      try {
        const { res, data } = await apiFetch("/market/status", { token });
        if (res.ok) setMarketStatus(data);
      } catch { /* fail quietly */ }
    }
    fetchMarketStatus();
  }, [token]);

  const fetchHoldings = async () => {
    setLoading(true); setError("");
    try {
      const { res, data } = await apiFetch("/holdings", { token });
      if (!res.ok) throw new Error(data.error || "Failed to load holdings");
      setHoldings(data);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  // Mount-time data fetch; fetchHoldings' sync setLoading(true) is the only "setState in effect".
  useEffect(() => { fetchHoldings(); }, []); // eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect

  const handleDelete = async (h) => {
    if (!window.confirm(`Delete ${h.ticker} (${h.quantity} units)? This can't be undone.`)) return;
    try {
      const { res, data } = await apiFetch(`/holdings/${h._id}`, { method: "DELETE", token });
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      setHoldings((prev) => prev.filter((x) => x._id !== h._id));
      bumpRefresh();
    } catch (err) { setError(err.message); }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage("");
    try {
      const { res, data } = await apiFetch("/prices/sync", { method: "POST", token });
      if (!res.ok) throw new Error(data.error || "Sync failed");

      const totalUpdated = (data.market?.updated || 0) + (data.mutualFunds?.updated || 0);
      const totalFailed = (data.market?.failed || 0) + (data.mutualFunds?.failed || 0);
      setSyncMessage(totalFailed > 0 ? `Updated ${totalUpdated}, ${totalFailed} couldn't be synced.` : `Updated ${totalUpdated} holding${totalUpdated !== 1 ? "s" : ""}.`);

      await fetchHoldings();
      bumpRefresh();
    } catch (err) {
      setSyncMessage(err.message);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(""), 5000);
    }
  };

  const visibleHoldings = filterType === "ALL" ? holdings : holdings.filter((h) => h.assetType === filterType);
  const totalInvested = holdings.reduce((sum, h) => sum + Number(h.quantity) * Number(h.buyPrice), 0);
  const totalCurrentValue = holdings.reduce((sum, h) => {
    const price = h.currentPrice != null ? Number(h.currentPrice) : Number(h.buyPrice);
    return sum + Number(h.quantity) * price;
  }, 0);
  const totalGainLoss = totalCurrentValue - totalInvested;
  const totalGainLossPct = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
  const typesPresent = ["ALL", ...new Set(holdings.map((h) => h.assetType))];
  const gainLossIcon = <TrendingUp size={16} color={totalGainLoss >= 0 ? "#10B981" : "#F6465D"} />;

  return (
    <div style={pageStyle}>
      <div style={topBarStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "linear-gradient(135deg, #D4A853 0%, #B8923E 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(212,168,83,0.3)" }}>
            <TrendingUp size={16} color="#0B0E17" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "17px", color: "#E8EAF0", letterSpacing: "-0.01em" }}>WealthLens</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "13.5px", color: "#8892A8" }}>{user?.name}</span>
          <button onClick={() => setShowSecurity(true)} style={iconButtonStyle} aria-label="Security settings"><ShieldCheck size={16} /></button>
          <button onClick={onLogout} style={iconButtonStyle} aria-label="Log out"><LogOut size={16} /></button>
        </div>
      </div>

      <div style={contentStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#E8EAF0", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Your Holdings</h1>
            <p style={{ fontSize: "13.5px", color: "#6B7280", margin: 0 }}>{holdings.length} position{holdings.length !== 1 ? "s" : ""} tracked</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleSync} disabled={syncing} style={secondaryButtonStyle}>
              <RefreshCw size={15} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
              {syncing ? "Syncing…" : "Sync prices"}
            </button>
            <button onClick={() => setShowForm(true)} style={primaryButtonStyle}><Plus size={16} /> Add Holding</button>
          </div>
        </div>

        {syncMessage && (
          <div style={{ fontSize: "12.5px", color: "#8892A8", marginBottom: "1rem" }}>{syncMessage}</div>
        )}

        <div style={bannerStyle("rgba(212,168,83,0.08)", "#D4A853")}>
          <Clock size={14} color="#D4A853" style={{ flexShrink: 0 }} />
          <span style={{ color: "#C4B896" }}>Prices update automatically every weekday at <strong style={{ color: "#D4A853" }}>4:00 PM IST</strong>. Stocks, ETFs, exchange-traded Gold, Crypto, and Mutual Funds are synced — Bonds and physical/digital gold are coming soon.</span>
        </div>

        {marketStatus && !marketStatus.isOpen && (
          <div style={bannerStyle("rgba(245,158,11,0.08)", "#F59E0B")}>
            <PartyPopper size={14} color="#F59E0B" style={{ flexShrink: 0, marginTop: "1px" }} />
            <span style={{ color: "#C4A882" }}>
              {marketStatus.reason === "holiday" ? (
                <>{marketStatus.greeting && <strong style={{ color: "#F59E0B" }}>{marketStatus.greeting} </strong>}Markets are closed today for <strong style={{ color: "#F59E0B" }}>{marketStatus.holidayName}</strong>. Prices won't update until the next trading day.</>
              ) : (
                <>Markets are closed for the weekend. Prices will next update on the following trading day.</>
              )}
            </span>
          </div>
        )}

        <InsightsPanel token={token} refreshKey={refreshKey} />
        <PortfolioHistoryChart token={token} refreshKey={refreshKey} holdings={holdings.filter(isPriceSyncable)} />
        <GainLossChart holdings={holdings} />

        <div style={summaryGridStyle}>
          <SummaryCard icon={<Wallet size={16} color="#D4A853" />} label="Total Invested" value={`Rs ${totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} />
          <SummaryCard icon={<Wallet size={16} color="#D4A853" />} label="Current Value" value={`Rs ${totalCurrentValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} />
          <SummaryCard icon={gainLossIcon} label="Total Gain/Loss"
            value={`${totalGainLoss >= 0 ? "+" : "-"}Rs ${Math.abs(totalGainLoss).toLocaleString("en-IN", { maximumFractionDigits: 0 })} (${totalGainLoss >= 0 ? "+" : ""}${totalGainLossPct.toFixed(1)}%)`}
            valueColor={totalGainLoss >= 0 ? "#10B981" : "#F6465D"} />
          <SummaryCard icon={<Layers size={16} color="#D4A853" />} label="Positions" value={holdings.length} />
        </div>

        {holdings.length > 0 && (
          <div style={{ display: "flex", gap: "8px", margin: "1.5rem 0", flexWrap: "wrap" }}>
            {typesPresent.map((t) => (
              <button key={t} onClick={() => setFilterType(t)}
                style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", border: "none",
                  background: filterType === t ? "linear-gradient(135deg, #D4A853 0%, #B8923E 100%)" : "#1A1F2E", color: filterType === t ? "#0B0E17" : "#8892A8",
                  boxShadow: filterType === t ? "0 2px 8px rgba(212,168,83,0.25)" : "none",
                  transition: "all 0.2s ease" }}>
                {t === "ALL" ? "All" : assetLabel(t)}
              </button>
            ))}
          </div>
        )}

        {error && <div style={{ background: "rgba(246,70,93,0.08)", border: "1px solid rgba(246,70,93,0.2)", borderRadius: "12px", padding: "12px 16px", fontSize: "13.5px", color: "#F6465D", marginBottom: "1.25rem" }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "#6B7280", fontSize: "13.5px" }}>Loading holdings…</div>
        ) : visibleHoldings.length === 0 ? (
          <div style={{ ...tableCardStyle, padding: "3rem 2rem", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 1rem" }}>No holdings yet. Add your first position to start tracking.</p>
            <button onClick={() => setShowForm(true)} style={{ ...primaryButtonStyle, margin: "0 auto" }}><Plus size={16} /> Add Holding</button>
          </div>
        ) : (
          <div style={tableCardStyle}>
            <div style={tableHeaderRow}>
              <span style={{ ...thStyle, flex: 2, textAlign: "left" }}>Holding</span>
              <span style={{ ...thStyle, textAlign: "right" }}>Qty</span>
              <span style={{ ...thStyle, textAlign: "right" }}>Buy</span>
              <span style={{ ...thStyle, textAlign: "right" }}>Now</span>
              <span style={{ ...thStyle, flex: 1.3, textAlign: "right" }}>Gain / Loss</span>
              <span style={{ flex: 0.8 }}></span>
            </div>
            {visibleHoldings.map((h) => {
              const hasPrice = h.currentPrice != null;
              const currentPrice = hasPrice ? Number(h.currentPrice) : null;
              const invested = Number(h.quantity) * Number(h.buyPrice);
              const currentValue = hasPrice ? Number(h.quantity) * currentPrice : null;
              const gainLoss = hasPrice ? currentValue - invested : null;
              const gainLossPct = hasPrice && invested > 0 ? (gainLoss / invested) * 100 : null;
              const gainColor = gainLoss == null ? "#6B7280" : gainLoss >= 0 ? "#10B981" : "#F6465D";

              return (
                <div key={h._id} style={tableRow}>
                  <span style={{ flex: 2, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13.5px", color: "#E8EAF0", fontWeight: 600 }}>{h.ticker}</span>
                    <AssetBadge type={h.assetType} />
                  </span>
                  <span style={tdStyle}>{h.quantity}</span>
                  <span style={tdStyle}>{Number(h.buyPrice).toLocaleString("en-IN")}</span>
                  <span style={tdStyle}>{hasPrice ? currentPrice.toLocaleString("en-IN") : <span style={{ color: "#4B5563" }}>—</span>}</span>
                  <span style={{ ...tdStyle, flex: 1.3, color: gainColor, fontWeight: 700 }}>
                    {hasPrice ? `${gainLoss >= 0 ? "+" : "-"}${Math.abs(gainLoss).toLocaleString("en-IN", { maximumFractionDigits: 0 })} (${gainLoss >= 0 ? "+" : ""}${gainLossPct.toFixed(1)}%)` : "—"}
                  </span>
                  <span style={{ flex: 0.8, display: "flex", justifyContent: "flex-end", gap: "2px" }}>
                    {isPriceSyncable(h) && (
                      <button onClick={() => setEvaluatingHolding(h)} style={evaluateButtonStyle} aria-label={`Evaluate entry price for ${h.ticker}`}><Sparkles size={14} /></button>
                    )}
                    <button onClick={() => setEditingHolding(h)} style={deleteButtonStyle} aria-label={`Edit ${h.ticker}`}><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(h)} style={deleteButtonStyle} aria-label={`Delete ${h.ticker}`}><Trash2 size={14} /></button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && <HoldingFormModal token={token} onClose={() => setShowForm(false)} onSaved={(holding) => { setHoldings((prev) => [holding, ...prev]); setShowForm(false); bumpRefresh(); }} />}
      {editingHolding && <HoldingFormModal token={token} holding={editingHolding} onClose={() => setEditingHolding(null)} onSaved={(holding) => { setHoldings((prev) => prev.map((x) => (x._id === holding._id ? holding : x))); setEditingHolding(null); bumpRefresh(); }} />}
      {showSecurity && <SecurityModal token={token} onClose={() => setShowSecurity(false)} />}
      {evaluatingHolding && <EvaluateModal holding={evaluatingHolding} token={token} onClose={() => setEvaluatingHolding(null)} />}

      <style>{spinKeyframes}</style>
    </div>
  );
}

function SummaryCard({ icon, label, value, valueColor }) {
  return (
    <div style={summaryCardStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        {icon}<span style={{ fontSize: "12px", color: "#6B7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      </div>
      <span style={{ fontSize: "20px", fontWeight: 700, color: valueColor || "#E8EAF0", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em" }}>{value}</span>
    </div>
  );
}

// Add when `holding` is absent, edit (PUT) when it's given.
function HoldingFormModal({ token, holding, onClose, onSaved }) {
  const isEdit = Boolean(holding);
  const [form, setForm] = useState(() => isEdit
    ? { ticker: holding.ticker, assetType: holding.assetType, quantity: String(holding.quantity), buyPrice: String(holding.buyPrice), buyDate: String(holding.buyDate).slice(0, 10), note: holding.note || "" }
    : { ticker: "", assetType: "STOCK", quantity: "", buyPrice: "", buyDate: "", note: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [priceMismatch, setPriceMismatch] = useState(null);

  const update = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setErrors((err) => ({ ...err, [key]: undefined })); setPriceMismatch(null); };
  const setTicker = (val) => { setForm((f) => ({ ...f, ticker: val })); setErrors((err) => ({ ...err, ticker: undefined })); setPriceMismatch(null); };
  const changeAssetType = (e) => { setForm((f) => ({ ...f, assetType: e.target.value, ticker: "" })); setPriceMismatch(null); };

  const validate = () => {
    const errs = {};
    if (!form.ticker.trim()) errs.ticker = "Required";
    if (!form.quantity || Number(form.quantity) <= 0) errs.quantity = "Must be greater than 0";
    if (!form.buyPrice || Number(form.buyPrice) < 0) errs.buyPrice = "Enter a valid price";
    if (!form.buyDate) errs.buyDate = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitHolding = async (confirmPrice) => {
    setSubmitting(true);
    try {
      const { res, data } = await apiFetch(isEdit ? `/holdings/${holding._id}` : "/holdings", {
        method: isEdit ? "PUT" : "POST", token,
        // On edit, send the note even when blank so it can be cleared.
        body: { ticker: form.ticker, assetType: form.assetType, quantity: Number(form.quantity), buyPrice: Number(form.buyPrice), buyDate: form.buyDate, note: isEdit ? form.note : form.note || undefined, confirmPrice },
      });
      if (!res.ok) {
        if (data.priceMismatch) setPriceMismatch({ message: data.error, historicalPrice: data.historicalPrice });
        else setServerError(data.error || (isEdit ? "Failed to save changes" : "Failed to add holding"));
        return;
      }
      onSaved(data);
    } catch { setServerError("Couldn't reach the server."); } finally { setSubmitting(false); }
  };

  const submit = async (e) => { e.preventDefault(); setServerError(""); setPriceMismatch(null); if (!validate()) return; await submitHolding(false); };
  const confirmAnyway = async () => { await submitHolding(true); };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#E8EAF0", margin: 0 }}>{isEdit ? `Edit ${holding.ticker}` : "Add Holding"}</h2>
          <button onClick={onClose} style={iconButtonStyle} aria-label="Close"><X size={16} /></button>
        </div>

        <form onSubmit={submit}>
          <label style={{ display: "block", marginBottom: "1rem" }}>
            <span style={fieldLabelStyle}>Asset Type</span>
            <select value={form.assetType} onChange={changeAssetType} style={{ ...inputStyle(false), cursor: "pointer" }}>
              {ASSET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>

          <label style={{ display: "block", marginBottom: "1rem" }}>
            <span style={fieldLabelStyle}>{form.assetType === "MUTUAL_FUND" ? "Fund Name" : "Ticker / Symbol"}</span>
            <TickerAutocomplete assetType={form.assetType} value={form.ticker} onChange={setTicker} error={errors.ticker} />
          </label>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "1rem" }}>
                <span style={fieldLabelStyle}>Quantity</span>
                <input type="number" value={form.quantity} onChange={update("quantity")} placeholder="10" style={inputStyle(errors.quantity)} />
                {errors.quantity && <span style={errorTextStyle}>{errors.quantity}</span>}
              </label>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "1rem" }}>
                <span style={fieldLabelStyle}>Buy Price (Rs)</span>
                <input type="number" value={form.buyPrice} onChange={update("buyPrice")} placeholder="3450" style={inputStyle(errors.buyPrice)} />
                {errors.buyPrice && <span style={errorTextStyle}>{errors.buyPrice}</span>}
              </label>
            </div>
          </div>

          <label style={{ display: "block", marginBottom: "1rem" }}>
            <span style={fieldLabelStyle}>Buy Date</span>
            <input type="date" value={form.buyDate} onChange={update("buyDate")} style={inputStyle(errors.buyDate)} />
            {errors.buyDate && <span style={errorTextStyle}>{errors.buyDate}</span>}
          </label>

          <label style={{ display: "block", marginBottom: "1rem" }}>
            <span style={fieldLabelStyle}>Note (optional)</span>
            <input type="text" value={form.note} onChange={update("note")} placeholder="Long term hold" style={inputStyle(false)} />
          </label>

          {serverError && <div style={{ background: "rgba(246,70,93,0.08)", border: "1px solid rgba(246,70,93,0.2)", borderRadius: "12px", padding: "10px 14px", fontSize: "13.5px", color: "#F6465D", marginBottom: "1rem" }}>{serverError}</div>}

          {priceMismatch && (
            <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "12px", padding: "12px 14px", marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                <AlertTriangle size={15} color="#F59E0B" style={{ flexShrink: 0, marginTop: "1px" }} />
                <span style={{ fontSize: "12.5px", color: "#C4A882", lineHeight: "1.5" }}>{priceMismatch.message}</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={confirmAnyway} disabled={submitting} style={{ flex: 1, background: "#1A1F2E", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B", borderRadius: "10px", padding: "8px", fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}>{submitting ? "Saving…" : isEdit ? "Save anyway" : "Add anyway"}</button>
                <button type="button" onClick={() => setPriceMismatch(null)} style={{ flex: 1, background: "transparent", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B", borderRadius: "10px", padding: "8px", fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}>Let me fix it</button>
              </div>
            </div>
          )}

          {!priceMismatch && (
            <button type="submit" disabled={submitting} style={{ ...primaryButtonStyle, width: "100%", justifyContent: "center", marginTop: "0.5rem" }}>{submitting ? "Saving…" : isEdit ? "Save Changes" : "Add Holding"}</button>
          )}
        </form>
      </div>
    </div>
  );
}

const fieldLabelStyle = { display: "block", fontSize: "13px", fontWeight: 600, color: "#8892A8", marginBottom: "6px" };
const errorTextStyle = { display: "block", fontSize: "12.5px", color: "#F6465D", marginTop: "4px" };
function inputStyle(error) {
  return { width: "100%", background: "#131722", border: `1.5px solid ${error ? "#F6465D" : "#2A3040"}`, borderRadius: "12px", padding: "10px 14px", fontSize: "14px", color: "#E8EAF0", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s ease" };
}
function bannerStyle(bg, borderColor) {
  return { display: "flex", alignItems: "flex-start", gap: "8px", background: bg, border: `1px solid ${borderColor}22`, borderLeft: `3px solid ${borderColor}`, borderRadius: "12px", padding: "10px 14px", fontSize: "13px", marginBottom: "0.85rem", lineHeight: "1.5" };
}

const topBarStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", background: "rgba(19,23,34,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid #1E2536", position: "sticky", top: 0, zIndex: 40 };
const contentStyle = { width: "100%", padding: "2rem 2.5rem" };
const secondaryButtonStyle = { background: "#1A1F2E", color: "#D4A853", border: "1px solid #2A3040", borderRadius: "12px", padding: "10px 14px", fontSize: "13.5px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s ease" };
const summaryGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "1rem", marginBottom: "0.25rem" };
const summaryCardStyle = { background: "linear-gradient(145deg, #131722 0%, #161B2A 100%)", border: "1px solid #1E2536", borderRadius: "16px", padding: "1.25rem", boxShadow: "0 4px 24px rgba(0,0,0,0.2)", transition: "all 0.2s ease" };
const tableCardStyle = { background: "#131722", border: "1px solid #1E2536", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.2)" };
const tableHeaderRow = { display: "flex", padding: "12px 20px", borderBottom: "1px solid #1E2536", gap: "12px", background: "#161B2A" };
const tableRow = { display: "flex", padding: "14px 20px", borderBottom: "1px solid #1A1F2E", gap: "12px", alignItems: "center", transition: "background 0.15s ease" };
const thStyle = { flex: 1, fontSize: "11px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 };
const tdStyle = { flex: 1, fontSize: "13.5px", color: "#C4C9D4", textAlign: "right", fontFamily: "'JetBrains Mono', monospace" };
const deleteButtonStyle = { background: "transparent", border: "none", color: "#4B5563", cursor: "pointer", padding: "6px", display: "flex", borderRadius: "8px", transition: "all 0.15s ease" };
const evaluateButtonStyle = { background: "transparent", border: "none", color: "#D4A853", cursor: "pointer", padding: "6px", display: "flex", borderRadius: "8px", transition: "all 0.15s ease" };

