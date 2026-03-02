import React from "react";
import { TrendingUp, RefreshCw, Clock, Wifi, WifiOff } from "lucide-react";

interface HeaderProps {
  lastUpdated: Date | null;
  isLoading: boolean;
  onRefresh: () => void;
  isDemo: boolean;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export default function Header({ lastUpdated, isLoading, onRefresh, isDemo, apiKey, onApiKeyChange }: HeaderProps) {
  const [editingKey, setEditingKey] = React.useState(false);
  const [tempKey, setTempKey] = React.useState(apiKey);

  const now = new Date();
  const dateStr = now.toLocaleDateString("pl-PL", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <header className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-b border-blue-800/40 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Top row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-xl p-2.5 shadow-lg shadow-blue-500/30">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                StockPicker <span className="text-blue-400">AI</span>
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">Inteligentny analizator akcji giełdowych</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              isDemo
                ? "bg-amber-900/40 border-amber-600/50 text-amber-300"
                : "bg-green-900/40 border-green-600/50 text-green-300"
            }`}>
              {isDemo ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              {isDemo ? "Tryb Demo" : "Live API"}
            </div>

            {/* Last updated */}
            {lastUpdated && (
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Aktualizacja: {lastUpdated.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-blue-700/30"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Ładowanie..." : "Odśwież"}
            </button>
          </div>
        </div>

        {/* Date bar */}
        <div className="mt-3 pt-3 border-t border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-slate-300 text-sm capitalize">📅 {dateStr}</p>

          {/* API Key input */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">Klucz API:</span>
            {editingKey ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempKey}
                  onChange={e => setTempKey(e.target.value)}
                  placeholder="Wklej klucz Alpha Vantage..."
                  className="bg-slate-800 border border-blue-700 text-white text-xs px-3 py-1.5 rounded-lg w-52 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => { onApiKeyChange(tempKey); setEditingKey(false); }}
                  className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                >Zapisz</button>
                <button
                  onClick={() => setEditingKey(false)}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                >Anuluj</button>
              </div>
            ) : (
              <button
                onClick={() => { setTempKey(apiKey); setEditingKey(true); }}
                className="text-blue-400 hover:text-blue-300 text-xs underline transition-colors"
              >
                {apiKey === "demo" ? "⚠️ Ustaw klucz API →" : `●●●●${apiKey.slice(-4)}`}
              </button>
            )}
          </div>
        </div>

        {/* Demo warning */}
        {isDemo && (
          <div className="mt-3 bg-amber-900/30 border border-amber-700/50 rounded-lg px-4 py-2.5 text-amber-300 text-xs">
            <strong>ℹ️ Tryb demonstracyjny</strong> – Dane są symulowane. Aby uzyskać dane giełdowe na żywo, 
            pobierz <strong>bezpłatny klucz API</strong> ze strony{" "}
            <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noreferrer" className="underline text-amber-200 font-semibold">
              alphavantage.co
            </a>{" "}
            i wklej go powyżej (25 zapytań/dzień za darmo).
          </div>
        )}
      </div>
    </header>
  );
}
