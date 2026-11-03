/** TradingView-style FX + metals list used across Terminal, Charts, Backtest */
export const FOREX_PAIRS = [
  "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD",
  "EURGBP", "EURJPY", "EURCHF", "EURAUD", "EURCAD", "EURNZD",
  "GBPJPY", "GBPCHF", "GBPAUD", "GBPCAD", "GBPNZD",
  "AUDJPY", "AUDNZD", "AUDCAD", "AUDCHF",
  "NZDJPY", "NZDCAD", "NZDCHF",
  "CADJPY", "CADCHF", "CHFJPY",
  "XAUUSD", "XAGUSD",
]

export const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"]

export function isSelectableStrategy(s) {
  return s && s.status !== "draft" && s.status !== "archived"
}
