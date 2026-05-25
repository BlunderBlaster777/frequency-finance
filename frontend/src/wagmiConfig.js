import { createConfig, http } from "wagmi";
import { getDefaultConfig } from "connectkit";

export const sonicChain = {
  id: 146,
  name: "Sonic",
  nativeCurrency: { decimals: 18, name: "Sonic", symbol: "S" },
  rpcUrls: {
    default: { http: ["https://rpc.soniclabs.com"] },
    public:  { http: ["https://rpc.soniclabs.com"] },
  },
  blockExplorers: {
    default: { name: "Sonicscan", url: "https://sonicscan.org" },
  },
  contracts: {},
};

const appUrl =
  typeof window !== "undefined"
    ? window.location.origin
    : import.meta.env.VITE_APP_URL || "http://localhost:3000";

export function buildWagmiConfig(rpcUrl = "https://rpc.soniclabs.com") {
  return createConfig(
    getDefaultConfig({
      chains: [sonicChain],
      transports: { [sonicChain.id]: http(rpcUrl) },
      walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo",
      appName: "Frequency Finance",
      appDescription: "Best-price DEX aggregator on Sonic chain",
      appUrl,
      appIcon: "/logo.png",
    })
  );
}

export const wagmiConfig = buildWagmiConfig();
