import React from "react";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { StockQuote } from "../services/stockService";

interface MarketSummaryProps {
  stocks: StockQuote[];
}

export default function MarketSummary({ stocks }: MarketSummaryProps) {
  if (stocks.length === 0) return null;

  const gainers = stocks.filter(s => s.changePercent > 0).length;
  const losers = stocks.filter(s => s.changePercent < 0).length;
  const avgChange = stocks.reduce((a, b) => a + b.changePercent, 0) / stocks.length;
  const avgScore = Math.round(stocks.reduce((a, b) => a + b.score, 0) / stocks.length);
  const bestGain = Math.max(...stocks.map(s => s.changePercent));
  const worstLoss = Math.min(...stocks.map(s => s.changePercent));

  const marketSentiment =
    avgChange > 1 ? { label: "Byczy 🐂", color: "text-green-400" } :
    avgChange > 0 ? { label: "Lekko pozytywny 📈", color: "text-green-300" } :
    avgChange > -1 ? { label: "Neutralny ➡️", color: "text-slate-300" } :
    { label: "Niedźwiedzi 🐻", color: "text-red-400" };

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-blue-400" />
        <h2 className="text-white font-bold text-lg">Podsumowanie Rynku</h2>
        <span className={`ml-auto font-semibold text-sm ${marketSentiment.color}`}>{marketSentiment.label}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox
          label="Rosnące"
          value={`${gainers}/${stocks.length}`}
          icon={<TrendingUp className="w-4 h-4 text-green-400" />}
          color="text-green-400"
          bg="bg-green-900/20 border-green-800/40"
        />
        <StatBox
          label="Spadające"
          value={`${losers}/${stocks.length}`}
          icon={<TrendingDown className="w-4 h-4 text-red-400" />}
          color="text-red-400"
          bg="bg-red-900/20 border-red-800/40"
        />
        <StatBox
          label="Śr. zmiana"
          value={`${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`}
          icon={<span className="text-xs">%</span>}
          color={avgChange >= 0 ? "text-green-400" : "text-red-400"}
          bg="bg-slate-700/40 border-slate-600/40"
        />
        <StatBox
          label="Śr. Score AI"
          value={`${avgScore}/100`}
          icon={<span className="text-xs">🤖</span>}
          color="text-blue-400"
          bg="bg-blue-900/20 border-blue-800/40"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="bg-slate-700/30 border border-slate-700/40 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Najlepszy wzrost dziś</div>
          <div className="text-green-400 font-bold">
            +{bestGain.toFixed(2)}% – {stocks.find(s => s.changePercent === bestGain)?.symbol}
          </div>
        </div>
        <div className="bg-slate-700/30 border border-slate-700/40 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Największy spadek dziś</div>
          <div className="text-red-400 font-bold">
            {worstLoss.toFixed(2)}% – {stocks.find(s => s.changePercent === worstLoss)?.symbol}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon, color, bg }: {
  label: string; value: string; icon: React.ReactNode; color: string; bg: string;
}) {
  return (
    <div className={`border rounded-lg p-3 ${bg}`}>
      <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
        {icon} {label}
      </div>
      <div className={`font-bold text-lg ${color}`}>{value}</div>
    </div>
  );
}
