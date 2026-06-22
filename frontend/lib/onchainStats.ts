// Real on-chain snapshot of XikomuFlip on Celo Mainnet.
// Source of truth: update/stats.json — refresh with `cd update && npm run report`
// (that script rewrites this file). Every number is verifiable on Celoscan.
// Used as the SSR/no-JS fallback; the live /api/stats route refreshes these on
// the client (see components/Landing.tsx).
export const ONCHAIN_STATS = {
  flips: 2294,
  uniquePlayers: 609,
  winRatePct: 51.5,
  totalWageredCELO: "130.6232",
  block: 70165981,
  contract: "0x7e36d266a721aB82379E1bc73EbCd16C3cef40cd",
  explorer: "https://celoscan.io/address/0x7e36d266a721aB82379E1bc73EbCd16C3cef40cd",
};
