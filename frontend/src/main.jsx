import React, { useMemo } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import App from "./App";
import { RpcProvider, useRpc } from "./context/RpcContext";
import { buildWagmiConfig } from "./wagmiConfig";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1_000 * 60 * 5,
      staleTime: 1_000 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const connectKitTheme = {
  "--ck-font-family": "'Inter', ui-sans-serif, system-ui, sans-serif",
  "--ck-border-radius": "12px",
  "--ck-overlay-background": "rgba(0, 0, 0, 0.65)",
  "--ck-body-background": "#0f1624",
  "--ck-body-background-secondary": "#131929",
  "--ck-body-background-tertiary": "#1e2d45",
  "--ck-body-color": "#e8ecf0",
  "--ck-body-color-muted": "#8b98a5",
  "--ck-body-color-muted-hover": "#c5cdd6",
  "--ck-primary-button-background": "linear-gradient(90deg, #2ebac6, #b6509e)",
  "--ck-primary-button-hover-background": "linear-gradient(90deg, #3dcdd9, #c960ae)",
  "--ck-primary-button-color": "#ffffff",
  "--ck-secondary-button-background": "#131929",
  "--ck-secondary-button-hover-background": "#1e2d45",
  "--ck-focus-color": "#2ebac6",
  "--ck-modal-box-shadow": "0 25px 60px rgba(0,0,0,0.8)",
  "--ck-body-border": "1px solid #1e2d45",
};

function WagmiWrapper({ children }) {
  const { rpcUrl } = useRpc();
  const config = useMemo(() => buildWagmiConfig(rpcUrl), [rpcUrl]);
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider customTheme={connectKitTheme} mode="dark">
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <RpcProvider>
        <WagmiWrapper>
          <App />
        </WagmiWrapper>
      </RpcProvider>
    </BrowserRouter>
  </React.StrictMode>
);
