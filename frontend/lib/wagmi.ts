import { http, createConfig } from "wagmi";
import { celo, celoAlfajores, celoSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/** wagmi config for Xikomu — Celo Mainnet + Alfajores + Celo Sepolia, injected (MiniPay). */
export const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores, celoSepolia],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [celo.id]: http("https://forno.celo.org"),
    [celoAlfajores.id]: http("https://alfajores-forno.celo-testnet.org"),
    [celoSepolia.id]: http("https://forno.celo-sepolia.celo-testnet.org"),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
