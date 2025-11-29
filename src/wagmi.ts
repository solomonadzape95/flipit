import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { type Chain } from "viem";
import { injected, walletConnect } from "wagmi/connectors";

// Celo Sepolia testnet chain definition
// Chain ID: 11142220 (from https://docs.celo.org/tooling/overview/network-overview)
const celoSepolia: Chain = {
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "CELO",
    symbol: "CELO",
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC ?? "https://forno.celo-sepolia.celo-testnet.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://celo-sepolia.blockscout.com",
    },
  },
  testnet: true,
} as const;

export function getConfig() {
  // Use Celo Sepolia testnet by default for Minipay
  const chain = process.env.NEXT_PUBLIC_CELO_NETWORK === "mainnet" 
    ? celo 
    : process.env.NEXT_PUBLIC_CELO_NETWORK === "alfajores"
    ? celoAlfajores
    : celoSepolia;
  
  return createConfig({
    chains: [chain],
    connectors: [
      // Injected connector works with Minipay (Minipay exposes window.ethereum as MetaMask-compatible)
      injected(),
      // WalletConnect as additional fallback (optional - requires project ID)
      ...(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
        ? [
            walletConnect({
              projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
              showQrModal: true,
              metadata: {
                name: "flipit",
                description: "Memory card game on Celo",
                url: typeof window !== "undefined" ? window.location.origin : "",
                icons: typeof window !== "undefined" ? [`${window.location.origin}/favicon.ico`] : [],
        },
      }),
          ]
        : []),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [chain.id]: http(chain.rpcUrls.default.http[0]),
    } as Record<number, ReturnType<typeof http>>,
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
