import { http, createConfig } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/** wagmi config for Xikomu — Celo Mainnet + Alfajores, injected (MiniPay) connector. */
export const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [celo.id]: http("https://forno.celo.org"),
    [celoAlfajores.id]: http("https://alfajores-forno.celo-testnet.org"),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
