import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import StockCard from "./components/StockCard";
import MarketSummary from "./components/MarketSummary";
import {
  StockQuote,
  WATCHLIST,
  fetchStockQuote,
  generateDemoData,
  API_KEY as DEFAULT_API_KEY,
} from "./services/stockService";
import { Filter, SortDesc, AlertCircle } from "lucide-react";

type SortKey = "score" | "changePercent" | "price" | "volume";
type FilterKey = "all" | "buy" | "sell" | "hold";

export default function App() {
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isDemo, setIsDemo] = useState(true);
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);

  // PWA install prompt handling
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [filterBy, setFilterBy] = useState<FilterKey>("all");
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (key: string) => {
    setIsLoading(true);
    setError(null);

    if (key === "demo" || key === "") {
      // Load demo data
      setTimeout(() => {
        const data = generateDemoData();
        setStocks(data.sort((a, b) => b.score - a.score));
        setIsDemo(true);
        setLastUpdated(new Date());
        setIsLoading(false);
      }, 1200);
      return;
    }

    // Try live API
    try {
      const results: StockQuote[] = [];
      // Fetch only first 5 to respect rate limit (5 req/min on free plan)
      const subset = WATCHLIST.slice(0, 5);
      for (const item of subset) {
        const q = await fetchStockQuote(item.symbol, item.name, item.sector);
        if (q) results.push(q);
        // Rate limit: wait 15s between requests on free plan
        if (subset.indexOf(item) < subset.length - 1) {
          await new Promise(r => setTimeout(r, 200));
        }
      }

      if (results.length === 0) {
        throw new Error("Brak danych z API. Sprawdź klucz API.");
      }

      setStocks(results.sort((a, b) => b.score - a.score));
      setIsDemo(false);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || "Błąd połączenia z API. Używam danych demonstracyjnych.");
      const data = generateDemoData();
      setStocks(data.sort((a, b) => b.score - a.score));
      setIsDemo(true);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(apiKey);
  }, []);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      // @ts-expect-error iOS specific
      window.navigator?.standalone === true;
    setIsStandalone(Boolean(standalone));

    const handler = (e: any) => {
      // Chrome/Android
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstallPrompt(null));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [loadData, apiKey]);

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => loadData(apiKey), 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [apiKey, loadData]);

  const handleApiKeyChange = (newKey: string) => {
    setApiKey(newKey);
    loadData(newKey);
  };

  const sorted = [...stocks].sort((a, b) => {
    if (sortBy === "score") return b.score - a.score;
    if (sortBy === "changePercent") return b.changePercent - a.changePercent;
    if (sortBy === "price") return b.price - a.price;
    if (sortBy === "volume") return b.volume - a.volume;
    return 0;
  });

  const filtered = sorted.filter(s => {
    if (filterBy === "buy") return s.recommendation === "KUPNO" || s.recommendation === "SILNE KUPNO";
    if (filterBy === "sell") return s.recommendation === "SPRZEDAJ";
    if (filterBy === "hold") return s.recommendation === "TRZYMAJ";
    return true;
  });

  const topThree = sorted.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Install banner (Android/Chrome) */}
      {!isStandalone && installPrompt && (
        <div className="bg-slate-950/80 border-b border-slate-700/60">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <p className="text-sm text-white font-semibold">Zainstaluj aplikację StockPicker AI</p>
              <p className="text-xs text-slate-400">
                Działa offline po pierwszym uruchomieniu i wygląda jak normalna aplikacja.
              </p>
            </div>
            <button
              className="bg-blue-600 hover:bg-blue-500 transition-colors text-white text-sm font-semibold px-4 py-2 rounded-lg"
              onClick={async () => {
                try {
                  await installPrompt.prompt();
                  await installPrompt.userChoice;
                } finally {
                  setInstallPrompt(null);
                }
              }}
            >
              Zainstaluj
            </button>
          </div>
        </div>
      )}

      <Header
        lastUpdated={lastUpdated}
        isLoading={isLoading}
        onRefresh={() => loadData(apiKey)}
        isDemo={isDemo}
        apiKey={apiKey}
        onApiKeyChange={handleApiKeyChange}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Market Summary */}
            <MarketSummary stocks={stocks} />

            {/* TOP 3 */}
            <div className="mb-8">
              <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                🏆 <span>Najlepsze Akcje Dnia</span>
                <span className="text-slate-500 text-sm font-normal">– rekomendacje AI</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topThree.map((stock, i) => (
                  <StockCard key={stock.symbol} stock={stock} rank={i + 1} isTop />
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-700/50 my-6" />

            {/* All stocks with sort/filter */}
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                📊 Wszystkie Analizowane Spółki
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filter */}
                <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-1 py-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
                  {(["all", "buy", "hold", "sell"] as FilterKey[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilterBy(f)}
                      className={`text-xs px-3 py-1.5 rounded-md transition-colors font-medium ${
                        filterBy === f
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {f === "all" ? "Wszystkie" : f === "buy" ? "Kupno" : f === "hold" ? "Trzymaj" : "Sprzedaj"}
                    </button>
                  ))}
                </div>

                {/* Sort */}
                <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-1 py-1">
                  <SortDesc className="w-3.5 h-3.5 text-slate-400 ml-1" />
                  {([
                    { key: "score", label: "Score" },
                    { key: "changePercent", label: "Zmiana%" },
                    { key: "price", label: "Cena" },
                    { key: "volume", label: "Wolumen" },
                  ] as { key: SortKey; label: string }[]).map(s => (
                    <button
                      key={s.key}
                      onClick={() => setSortBy(s.key)}
                      className={`text-xs px-3 py-1.5 rounded-md transition-colors font-medium ${
                        sortBy === s.key
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center text-slate-500 py-16">
                <p className="text-4xl mb-3">🔍</p>
                <p>Brak spółek spełniających kryteria filtra.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((stock, i) => (
                  <StockCard key={stock.symbol} stock={stock} rank={i + 1} isTop={false} />
                ))}
              </div>
            )}

            {/* GitHub / API Info */}
            <div className="mt-10 bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                📖 Jak zainstalować na GitHub?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-blue-400 font-semibold mb-3">🔑 Bezpłatny klucz API</h4>
                  <ol className="text-slate-300 text-sm space-y-2 list-none">
                    <li className="flex gap-2"><span className="text-blue-400 font-bold">1.</span> Wejdź na <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noreferrer" className="text-blue-400 underline">alphavantage.co</a></li>
                    <li className="flex gap-2"><span className="text-blue-400 font-bold">2.</span> Kliknij <strong>"Get Free API Key"</strong></li>
                    <li className="flex gap-2"><span className="text-blue-400 font-bold">3.</span> Wypełnij formularz (imię + e-mail)</li>
                    <li className="flex gap-2"><span className="text-blue-400 font-bold">4.</span> Skopiuj klucz API</li>
                    <li className="flex gap-2"><span className="text-blue-400 font-bold">5.</span> Wklej go w polu <strong>"Klucz API"</strong> u góry</li>
                  </ol>
                  <div className="mt-3 bg-slate-900 rounded-lg p-3 text-xs text-slate-400 font-mono">
                    Limit: 25 zapytań/dzień • 5 zapytań/min<br />
                    Opóźnienie danych: 15-20 min
                  </div>
                </div>
                <div>
                  <h4 className="text-green-400 font-semibold mb-3">🚀 Instalacja na GitHub Pages</h4>
                  <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-300 space-y-1">
                    <p><span className="text-green-400">#</span> 1. Klonuj repozytorium</p>
                    <p className="text-amber-300">git clone https://github.com/TwojLogin/stock-app</p>
                    <p className="mt-2"><span className="text-green-400">#</span> 2. Zainstaluj zależności</p>
                    <p className="text-amber-300">npm install</p>
                    <p className="mt-2"><span className="text-green-400">#</span> 3. Zbuduj projekt</p>
                    <p className="text-amber-300">npm run build</p>
                    <p className="mt-2"><span className="text-green-400">#</span> 4. Deploy na GitHub Pages</p>
                    <p className="text-amber-300">npm install -g gh-pages</p>
                    <p className="text-amber-300">gh-pages -d dist</p>
                  </div>
                  <p className="text-slate-500 text-xs mt-2">
                    W pliku <code className="text-blue-400">vite.config.ts</code> ustaw <code className="text-blue-400">base: '/nazwa-repo/'</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-4 text-slate-600 text-xs text-center">
              ⚠️ StockPicker AI służy wyłącznie celom edukacyjnym i informacyjnym. Nie jest poradą inwestycyjną.
              Zawsze konsultuj decyzje inwestycyjne z licencjonowanym doradcą finansowym.
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="bg-slate-800/60 rounded-xl h-32" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-slate-800/60 rounded-xl h-56" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-slate-800/60 rounded-xl h-44" />
        ))}
      </div>
    </div>
  );
}
