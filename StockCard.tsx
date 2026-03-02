import React from "react";
import { TrendingUp, TrendingDown, BarChart2, ChevronDown, ChevronUp } from "lucide-react";
import { StockQuote, HistoricalPoint, generateDemoHistory, fetchHistoricalData, API_KEY } from "../services/stockService";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";

interface StockCardProps {
  stock: StockQuote;
  rank: number;
  isTop?: boolean;
}

const recColors: Record<string, string> = {
  "SILNE KUPNO": "from-green-600 to-emerald-700",
  "KUPNO": "from-blue-600 to-cyan-700",
  "TRZYMAJ": "from-slate-600 to-slate-700",
  "SPRZEDAJ": "from-red-700 to-rose-800",
};

const recBadge: Record<string, string> = {
  "SILNE KUPNO": "bg-green-500/20 text-green-300 border-green-500/40",
  "KUPNO": "bg-blue-500/20 text-blue-300 border-blue-500/40",
  "TRZYMAJ": "bg-slate-500/20 text-slate-300 border-slate-500/40",
  "SPRZEDAJ": "bg-red-500/20 text-red-300 border-red-500/40",
};

const recEmoji: Record<string, string> = {
  "SILNE KUPNO": "🚀",
  "KUPNO": "📈",
  "TRZYMAJ": "⏸️",
  "SPRZEDAJ": "📉",
};

export default function StockCard({ stock, rank, isTop }: StockCardProps) {
  const [expanded, setExpanded] = React.useState(isTop && rank === 1);
  const [history, setHistory] = React.useState<HistoricalPoint[]>([]);
  const [loadingChart, setLoadingChart] = React.useState(false);

  const isPositive = stock.change >= 0;
  const scoreColor =
    stock.score >= 75 ? "text-green-400" :
    stock.score >= 60 ? "text-blue-400" :
    stock.score >= 40 ? "text-slate-400" : "text-red-400";

  React.useEffect(() => {
    if (expanded && history.length === 0) {
      setLoadingChart(true);
      const load = async () => {
        let data: HistoricalPoint[] = [];
        if (API_KEY !== "demo") {
          data = await fetchHistoricalData(stock.symbol);
        }
        if (!data || data.length === 0) {
          data = generateDemoHistory(stock.symbol);
        }
        setHistory(data);
        setLoadingChart(false);
      };
      load();
    }
  }, [expanded]);

  const chartColor = isPositive ? "#22c55e" : "#ef4444";

  return (
    <div className={`bg-slate-800/60 border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/20 ${
      isTop && rank === 1 ? "border-green-500/60 shadow-lg shadow-green-900/20" :
      isTop && rank === 2 ? "border-blue-500/40" :
      "border-slate-700/50"
    }`}>
      {/* Rank ribbon */}
      {isTop && (
        <div className={`bg-gradient-to-r ${recColors[stock.recommendation]} px-4 py-1.5 flex items-center justify-between`}>
          <span className="text-white text-xs font-bold tracking-wide">
            {rank === 1 ? "🥇 NAJLEPSZA AKCJA DNIA" : rank === 2 ? "🥈 2. MIEJSCE" : "🥉 3. MIEJSCE"}
          </span>
          <span className="text-white/80 text-xs">{recEmoji[stock.recommendation]} {stock.recommendation}</span>
        </div>
      )}

      <div className="p-4">
        {/* Main row */}
        <div className="flex items-start justify-between gap-3">
          {/* Symbol & info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="bg-slate-700 rounded-lg w-11 h-11 flex items-center justify-center flex-shrink-0 font-bold text-white text-sm border border-slate-600">
              {stock.symbol.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-bold text-lg leading-tight">{stock.symbol}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${recBadge[stock.recommendation]}`}>
                  {recEmoji[stock.recommendation]} {stock.recommendation}
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5 truncate">{stock.name}</p>
              <p className="text-slate-500 text-xs">{stock.sector}</p>
            </div>
          </div>

          {/* Price */}
          <div className="text-right flex-shrink-0">
            <div className="text-white font-bold text-xl">${stock.price.toFixed(2)}</div>
            <div className={`flex items-center justify-end gap-1 text-sm font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isPositive ? "+" : ""}{stock.change.toFixed(2)} ({isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-700/50 rounded-lg py-2 px-1">
            <div className="text-slate-400 text-xs">Min/Max</div>
            <div className="text-white text-xs font-medium mt-0.5">${stock.low.toFixed(0)}–${stock.high.toFixed(0)}</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg py-2 px-1">
            <div className="text-slate-400 text-xs">Wolumen</div>
            <div className="text-white text-xs font-medium mt-0.5">
              {stock.volume >= 1000000 ? `${(stock.volume / 1000000).toFixed(1)}M` : `${(stock.volume / 1000).toFixed(0)}K`}
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg py-2 px-1">
            <div className="text-slate-400 text-xs">Score AI</div>
            <div className={`text-xs font-bold mt-0.5 ${scoreColor}`}>{stock.score}/100</div>
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Ocena AI</span>
            <span className={scoreColor}>{stock.score}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                stock.score >= 75 ? "bg-gradient-to-r from-green-500 to-emerald-400" :
                stock.score >= 60 ? "bg-gradient-to-r from-blue-500 to-cyan-400" :
                stock.score >= 40 ? "bg-gradient-to-r from-slate-500 to-slate-400" :
                "bg-gradient-to-r from-red-500 to-rose-400"
              }`}
              style={{ width: `${stock.score}%` }}
            />
          </div>
        </div>

        {/* Reason */}
        <p className="mt-2 text-slate-400 text-xs bg-slate-700/30 rounded-lg px-3 py-2 border border-slate-700/50">
          💡 {stock.reason}
        </p>

        {/* Expand button */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 text-slate-500 hover:text-blue-400 text-xs transition-colors py-1"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          {expanded ? "Ukryj wykres" : "Pokaż wykres (30 dni)"}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {/* Chart */}
        {expanded && (
          <div className="mt-3 border-t border-slate-700/50 pt-3">
            {loadingChart ? (
              <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                <RefreshCwIcon />
                <span className="ml-2">Ładowanie wykresu...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#64748b", fontSize: 9 }}
                    tickFormatter={v => v.slice(5)}
                    interval={6}
                  />
                  <YAxis tick={{ fill: "#64748b", fontSize: 9 }} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: "#94a3b8" }}
                    itemStyle={{ color: chartColor }}
                    formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(2)}`, "Cena"]}
                  />
                  <Area type="monotone" dataKey="close" stroke={chartColor} strokeWidth={2} fill={`url(#grad-${stock.symbol})`} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RefreshCwIcon() {
  return (
    <svg className="w-4 h-4 animate-spin text-slate-500" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}
