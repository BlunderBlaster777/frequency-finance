import { createContext, useContext, useState, useMemo } from "react";

const DEFAULT_RPC = "https://rpc.soniclabs.com";

export const RpcContext = createContext({ rpcUrl: DEFAULT_RPC, setRpcUrl: () => {} });

export function RpcProvider({ children }) {
  const [rpcUrl, setRpcUrl] = useState(DEFAULT_RPC);
  const value = useMemo(() => ({ rpcUrl, setRpcUrl, defaultRpc: DEFAULT_RPC }), [rpcUrl]);
  return <RpcContext.Provider value={value}>{children}</RpcContext.Provider>;
}

export function useRpc() { return useContext(RpcContext); }
