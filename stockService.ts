// ============================================================
// ALPHA VANTAGE – DARMOWY KLUCZ API
// Zarejestruj się na: https://www.alphavantage.co/support/#api-key
// Darmowy plan: 25 zapytań/dzień, 5 zapytań/minutę
// Wstaw swój klucz poniżej:
// ============================================================
export const API_KEY = "demo"; // ← zamień "demo" na swój klucz z alphavantage.co

const BASE_URL = "https://www.alphavantage.co/query";

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  score: number;
  recommendation: "SILNE KUPNO" | "KUPNO" | "TRZYMAJ" | "SPRZEDAJ";
  reason: string;
  sector: string;
}

export interface HistoricalPoint {
  date: string;
  close: number;
  volume: number;
}

// Top 20 polecanych spółek do analizy
export const WATCHLIST = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technologia" },
  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Technologia" },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technologia" },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "E-commerce" },
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Półprzewodniki" },
  { symbol: "META", name: "Meta Platforms", sector: "Social Media" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Motoryzacja/EV" },
  { symbol: "JPM", name: "JPMorgan Chase", sector: "Finanse" },
  { symbol: "V", name: "Visa Inc.", sector: "Finanse" },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Zdrowie" },
  { symbol: "WMT", name: "Walmart Inc.", sector: "Handel detaliczny" },
  { symbol: "PG", name: "Procter & Gamble", sector: "FMCG" },
];

// Algorytm scoringu akcji (RSI-like, momentum, volume surge)
function calculateScore(quote: Omit<StockQuote, "score" | "recommendation" | "reason">): {
  score: number;
  recommendation: StockQuote["recommendation"];
  reason: string;
} {
  let score = 50;
  const reasons: string[] = [];

  // 1. Momentum cenowy
  const priceChangeScore = quote.changePercent;
  if (priceChangeScore > 3) { score += 20; reasons.push("Silny wzrost ceny"); }
  else if (priceChangeScore > 1) { score += 10; reasons.push("Wzrost ceny"); }
  else if (priceChangeScore < -3) { score -= 20; reasons.push("Silny spadek ceny"); }
  else if (priceChangeScore < -1) { score -= 10; reasons.push("Spadek ceny"); }

  // 2. Zakres dzienny (volatility)
  const dailyRange = ((quote.high - quote.low) / quote.low) * 100;
  if (dailyRange > 5) { score += 10; reasons.push("Wysoka zmienność (okazja)"); }

  // 3. Pozycja ceny w zakresie dziennym (czy blisko dołka?)
  const positionInRange = (quote.price - quote.low) / (quote.high - quote.low || 1);
  if (positionInRange < 0.3) { score += 15; reasons.push("Cena blisko minimum dziennego"); }
  else if (positionInRange > 0.7) { score += 5; reasons.push("Cena blisko maksimum – silny trend"); }

  // 4. Gap opening (luka cenowa)
  const gapPercent = ((quote.open - quote.previousClose) / quote.previousClose) * 100;
  if (gapPercent > 2) { score += 10; reasons.push(`Luka wzrostowa +${gapPercent.toFixed(1)}%`); }
  else if (gapPercent < -2) { score -= 10; reasons.push(`Luka spadkowa ${gapPercent.toFixed(1)}%`); }

  score = Math.max(0, Math.min(100, score));

  let recommendation: StockQuote["recommendation"];
  if (score >= 75) recommendation = "SILNE KUPNO";
  else if (score >= 60) recommendation = "KUPNO";
  else if (score >= 40) recommendation = "TRZYMAJ";
  else recommendation = "SPRZEDAJ";

  return {
    score: Math.round(score),
    recommendation,
    reason: reasons.length > 0 ? reasons.join(" • ") : "Stabilna spółka",
  };
}

// Fetch pojedynczej akcji z Alpha Vantage
export async function fetchStockQuote(symbol: string, name: string, sector: string): Promise<StockQuote | null> {
  try {
    const res = await fetch(
      `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`
    );
    const data = await res.json();
    const q = data["Global Quote"];
    if (!q || !q["05. price"]) return null;

    const price = parseFloat(q["05. price"]);
    const change = parseFloat(q["09. change"]);
    const changePercent = parseFloat(q["10. change percent"].replace("%", ""));
    const volume = parseInt(q["06. volume"]);
    const high = parseFloat(q["03. high"]);
    const low = parseFloat(q["04. low"]);
    const open = parseFloat(q["02. open"]);
    const previousClose = parseFloat(q["08. previous close"]);

    const base = { symbol, name, price, change, changePercent, volume, high, low, open, previousClose, sector };
    const { score, recommendation, reason } = calculateScore(base);

    return { ...base, score, recommendation, reason };
  } catch {
    return null;
  }
}

// Fetch danych historycznych (weekly)
export async function fetchHistoricalData(symbol: string): Promise<HistoricalPoint[]> {
  try {
    const res = await fetch(
      `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${API_KEY}`
    );
    const data = await res.json();
    const ts = data["Time Series (Daily)"];
    if (!ts) return [];

    return Object.entries(ts)
      .slice(0, 30)
      .map(([date, vals]: [string, any]) => ({
        date,
        close: parseFloat(vals["4. close"]),
        volume: parseInt(vals["5. volume"]),
      }))
      .reverse();
  } catch {
    return [];
  }
}

// Dane demonstracyjne (gdy brak klucza / limit API)
export function generateDemoData(): StockQuote[] {
  const demoRaw = [
    { symbol: "NVDA", name: "NVIDIA Corp.", price: 875.4, change: 28.5, changePercent: 3.37, volume: 52000000, high: 889.0, low: 851.2, open: 860.0, previousClose: 846.9, sector: "Półprzewodniki" },
    { symbol: "AAPL", name: "Apple Inc.", price: 189.3, change: 2.1, changePercent: 1.12, volume: 61000000, high: 191.0, low: 186.5, open: 187.5, previousClose: 187.2, sector: "Technologia" },
    { symbol: "MSFT", name: "Microsoft Corp.", price: 415.2, change: 5.8, changePercent: 1.42, volume: 24000000, high: 417.0, low: 408.3, open: 410.0, previousClose: 409.4, sector: "Technologia" },
    { symbol: "TSLA", name: "Tesla Inc.", price: 172.8, change: -4.2, changePercent: -2.37, volume: 95000000, high: 180.0, low: 170.1, open: 177.0, previousClose: 177.0, sector: "Motoryzacja/EV" },
    { symbol: "META", name: "Meta Platforms", price: 502.1, change: 8.9, changePercent: 1.81, volume: 18000000, high: 508.0, low: 493.0, open: 495.0, previousClose: 493.2, sector: "Social Media" },
    { symbol: "AMZN", name: "Amazon.com Inc.", price: 185.6, change: 3.4, changePercent: 1.87, volume: 38000000, high: 187.0, low: 182.0, open: 183.0, previousClose: 182.2, sector: "E-commerce" },
    { symbol: "GOOGL", name: "Alphabet Inc.", price: 174.9, change: 1.2, changePercent: 0.69, volume: 22000000, high: 176.0, low: 173.0, open: 174.0, previousClose: 173.7, sector: "Technologia" },
    { symbol: "JPM", name: "JPMorgan Chase", price: 198.4, change: -1.1, changePercent: -0.55, volume: 9000000, high: 200.5, low: 197.0, open: 199.5, previousClose: 199.5, sector: "Finanse" },
    { symbol: "V", name: "Visa Inc.", price: 275.3, change: 2.8, changePercent: 1.03, volume: 7500000, high: 277.0, low: 272.0, open: 273.0, previousClose: 272.5, sector: "Finanse" },
    { symbol: "WMT", name: "Walmart Inc.", price: 68.2, change: 0.9, changePercent: 1.34, volume: 14000000, high: 68.8, low: 67.4, open: 67.6, previousClose: 67.3, sector: "Handel detaliczny" },
  ];

  return demoRaw.map(s => {
    const { score, recommendation, reason } = calculateScore(s);
    return { ...s, score, recommendation, reason };
  }).sort((a, b) => b.score - a.score);
}

export function generateDemoHistory(symbol: string): HistoricalPoint[] {
  const basePrice: Record<string, number> = {
    NVDA: 820, AAPL: 183, MSFT: 405, TSLA: 180, META: 488,
    AMZN: 178, GOOGL: 170, JPM: 197, V: 268, WMT: 66,
  };
  const base = basePrice[symbol] || 100;
  const points: HistoricalPoint[] = [];
  let price = base;
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    price = price * (1 + (Math.random() - 0.47) * 0.025);
    points.push({
      date: d.toISOString().split("T")[0],
      close: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 50000000 + 10000000),
    });
  }
  return points;
}
