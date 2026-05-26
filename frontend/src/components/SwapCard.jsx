import { useState } from "react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { formatUnits } from "viem";
import TokenSelector from "./TokenSelector";
import SlippageSettings from "./SlippageSettings";
import RouteDisplay from "./RouteDisplay";
import AllRoutesPanel from "./AllRoutesPanel";
import { useQuote } from "../hooks/useQuote";
import { useSwap } from "../hooks/useSwap";
import { TOKENS, ERC20_ABI } from "../constants/tokens";

const DEFAULT_SLIPPAGE_BPS = 50;

export default function SwapCard() {
  const { address: userAddress, isConnected } = useAccount();
  const [tokenIn,     setTokenIn]     = useState(TOKENS[0]);
  const [tokenOut,    setTokenOut]    = useState(TOKENS[2]);
  const [amountIn,    setAmountIn]    = useState("");
  const [slippageBps, setSlippageBps] = useState(DEFAULT_SLIPPAGE_BPS);
  const [showRoutes,  setShowRoutes]  = useState(false);

  const [selectedRoute, setSelectedRoute] = useState(null);

  const { bestQuote, allRoutes, loading: quoteLoading, error: quoteError } =
    useQuote({ tokenIn, tokenOut, amountIn });

  // Resolve the active quote: prefer user-selected route if it's still in results, else best
  const activeRoute = (() => {
    if (!allRoutes.length) return null;
    if (selectedRoute) {
      const still = allRoutes.find(r =>
        r.dexName === selectedRoute.dexName &&
        r.meta?.type === selectedRoute.meta?.type &&
        r.meta?.fee === selectedRoute.meta?.fee
      );
      if (still) return still;
    }
    return allRoutes[0] ?? null;
  })();

  const quote = activeRoute
    ? {
        amountOut:          activeRoute.amountOut,
        amountOutFormatted: formatUnits(activeRoute.amountOut, tokenOut?.decimals ?? 18),
        dexName:            activeRoute.dexName,
        dexIndex:           activeRoute.dexIndex,
        path:               activeRoute.path,
        stableFlags:        activeRoute.stableFlags,
        meta:               activeRoute.meta,
        priceImpactBps:     0n,
        priceImpactPercent: "0.00",
      }
    : null;

  const { swap, needsApproval, step, isLoading: swapLoading } = useSwap({
    tokenIn, tokenOut, amountIn, quote, slippageBps,
  });

  const { data: nativeBalance } = useBalance({
    address: userAddress,
    query: { enabled: Boolean(userAddress) && tokenIn?.isNative },
  });
  const { data: erc20BalIn } = useReadContract({
    address: tokenIn?.isNative ? undefined : tokenIn?.address,
    abi: ERC20_ABI, functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: Boolean(userAddress) && !tokenIn?.isNative },
  });
  const { data: erc20BalOut } = useReadContract({
    address: tokenOut?.isNative ? undefined : tokenOut?.address,
    abi: ERC20_ABI, functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: Boolean(userAddress) && !tokenOut?.isNative },
  });

  const balanceIn = (() => {
    if (!userAddress) return null;
    if (tokenIn?.isNative && nativeBalance) return parseFloat(formatUnits(nativeBalance.value, 18)).toFixed(4);
    if (!tokenIn?.isNative && erc20BalIn != null) return parseFloat(formatUnits(erc20BalIn, tokenIn.decimals)).toFixed(4);
    return null;
  })();

  const balanceOut = (() => {
    if (!userAddress) return null;
    if (tokenOut?.isNative && nativeBalance) return parseFloat(formatUnits(nativeBalance.value, 18)).toFixed(4);
    if (!tokenOut?.isNative && erc20BalOut != null) return parseFloat(formatUnits(erc20BalOut, tokenOut.decimals)).toFixed(4);
    return null;
  })();

  function handleMax() {
    if (!userAddress || !tokenIn) return;
    if (tokenIn.isNative && nativeBalance) {
      const buf = 1_000_000_000_000_000n;
      const max = nativeBalance.value > buf ? nativeBalance.value - buf : 0n;
      setAmountIn(formatUnits(max, 18));
    } else if (!tokenIn.isNative && erc20BalIn != null) {
      setAmountIn(formatUnits(erc20BalIn, tokenIn.decimals));
    }
  }

  function flipTokens() {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn(quote ? quote.amountOutFormatted : "");
    setSelectedRoute(null);
  }

  function getButtonState() {
    if (!isConnected)                        return { label: "Connect Wallet",             disabled: false, variant: "primary"  };
    if (!tokenIn || !tokenOut)               return { label: "Select tokens",              disabled: true,  variant: "disabled" };
    if (!amountIn || Number(amountIn) <= 0)  return { label: "Enter an amount",            disabled: true,  variant: "disabled" };
    if (quoteLoading)                        return { label: "Fetching quote…",            disabled: true,  variant: "loading"  };
    if (quoteError)                          return { label: "No route found",             disabled: true,  variant: "error"    };
    if (!quote)                              return { label: "Enter an amount",            disabled: true,  variant: "disabled" };
    if (swapLoading && step === "approving") return { label: "Approving…",                disabled: true,  variant: "loading"  };
    if (swapLoading && step === "swapping")  return { label: "Swapping…",                 disabled: true,  variant: "loading"  };
    if (needsApproval)                       return { label: `Approve ${tokenIn.symbol}`,  disabled: false, variant: "primary"  };
    return                                          { label: "Swap",                       disabled: false, variant: "primary"  };
  }

  const btnState = getButtonState();
  const btnClass = {
    primary:  "gradient-brand text-white hover:opacity-90 shadow-lg",
    loading:  "bg-[#1a2035] text-[#4a5568] cursor-not-allowed",
    disabled: "bg-[#131929] text-[#4a5568] cursor-not-allowed border border-[#1e2d45]",
    error:    "bg-red-950/40 text-red-400 cursor-not-allowed border border-red-900/40",
  };

  const outputDisplay = quote
    ? parseFloat(quote.amountOutFormatted).toFixed(6)
    : quoteLoading ? "…" : "";

  const hasRoutes   = allRoutes.length > 0;
  const showDetails = Boolean(amountIn) && Number(amountIn) > 0;

  return (
    <div className="w-full max-w-lg">
      <div className="bg-[#0f1624] border border-[#1e2d45] rounded-2xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e2d45]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#2ebac6]" />
            <span className="text-sm text-[#8b98a5] font-medium">Sonic · Chain 146</span>
          </div>
          <SlippageSettings slippageBps={slippageBps} onChange={setSlippageBps} />
        </div>

        <div className="p-5 space-y-2.5">

          {/* Input panel */}
          <div className="bg-[#0a0e1a] border border-[#1e2d45] hover:border-[#2a3f5c] rounded-2xl p-5 transition-colors group">
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-medium text-[#4a5568] uppercase tracking-wide">You pay</span>
              {balanceIn !== null && (
                <button onClick={handleMax} className="flex items-center gap-2 text-sm text-[#8b98a5] hover:text-white transition-colors">
                  <span>Balance: <span className="font-semibold text-white">{balanceIn}</span></span>
                  <span className="text-xs text-[#2ebac6] font-bold uppercase tracking-wide bg-[#2ebac6]/10 border border-[#2ebac6]/20 px-2 py-0.5 rounded-md">MAX</span>
                </button>
              )}
            </div>
            <div className="flex items-end gap-3">
              <input
                type="number" min="0" step="any" placeholder="0"
                value={amountIn}
                onChange={e => { setAmountIn(e.target.value); setSelectedRoute(null); }}
                className="flex-1 bg-transparent text-5xl font-bold text-white placeholder-[#1e2d45] focus:outline-none min-w-0 w-0 pb-1"
              />
              <div className="flex-shrink-0 pb-1">
                <TokenSelector selected={tokenIn} onChange={t => { setTokenIn(t); setSelectedRoute(null); }} excludeToken={tokenOut} />
              </div>
            </div>
          </div>

          {/* Flip */}
          <div className="flex justify-center relative h-0 z-10">
            <button
              onClick={flipTokens}
              className="absolute -translate-y-1/2 w-11 h-11 bg-[#0f1624] hover:bg-[#1e2d45] border-2 border-[#1e2d45] hover:border-[#2a3f5c] rounded-xl flex items-center justify-center text-[#4a5568] hover:text-[#2ebac6] transition-all duration-200 hover:rotate-180 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* Output panel */}
          <div className="bg-[#0a0e1a] border border-[#1e2d45] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-medium text-[#4a5568] uppercase tracking-wide">You receive</span>
              {balanceOut !== null && (
                <span className="text-sm text-[#8b98a5]">
                  Balance: <span className="font-semibold text-white">{balanceOut}</span>
                </span>
              )}
            </div>
            <div className="flex items-end gap-3">
              <div className={`flex-1 text-5xl font-bold min-w-0 truncate transition-all pb-1
                ${quoteLoading ? "text-[#1e2d45] animate-pulse" : outputDisplay ? "text-white" : "text-[#1e2d45]"}`}>
                {outputDisplay || "0"}
              </div>
              <div className="flex-shrink-0 pb-1">
                <TokenSelector selected={tokenOut} onChange={t => { setTokenOut(t); setSelectedRoute(null); }} excludeToken={tokenIn} />
              </div>
            </div>
          </div>

          {/* Quote detail row */}
          {quote && !quoteLoading && showDetails && (
            <div className="px-2 pt-1 space-y-2 animate-fade-in">
              <div className="flex justify-between text-sm">
                <span className="text-[#4a5568]">Minimum received</span>
                <span className="text-[#8b98a5] font-medium tabular-nums">
                  {parseFloat(formatUnits((quote.amountOut * BigInt(10_000 - slippageBps)) / 10_000n, tokenOut?.decimals ?? 18)).toFixed(6)} {tokenOut?.symbol}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#4a5568]">Slippage tolerance</span>
                <span className="text-[#8b98a5] font-medium">{(slippageBps / 100).toFixed(2)}%</span>
              </div>
            </div>
          )}

          {/* Best route */}
          <RouteDisplay
            quote={quote}
            tokenIn={tokenIn}
            tokenOut={tokenOut}
            loading={quoteLoading && showDetails}
          />

          {/* All routes toggle */}
          {(hasRoutes || quoteLoading) && showDetails && (
            <div>
              <button
                onClick={() => setShowRoutes(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#0a0e1a] border border-[#1e2d45] hover:border-[#2a3f5c] text-sm text-[#4a5568] hover:text-[#8b98a5] transition-all"
              >
                <span className="font-medium">
                  {showRoutes ? "Hide routes" : `All routes${hasRoutes ? ` (${allRoutes.length})` : ""}`}
                </span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${showRoutes ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showRoutes && (
                <div className="mt-2 animate-fade-in">
                  <AllRoutesPanel
                    allRoutes={allRoutes}
                    tokenIn={tokenIn}
                    tokenOut={tokenOut}
                    loading={quoteLoading}
                    selectedRoute={activeRoute}
                    onSelectRoute={r => { setSelectedRoute(r); setShowRoutes(false); }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {quoteError && showDetails && (
            <div className="flex items-center gap-2.5 text-sm text-red-400 bg-red-950/30 rounded-xl p-4 border border-red-900/30">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {quoteError}
            </div>
          )}

          {/* Action button */}
          <div className="pt-1.5">
            {!isConnected ? (
              <ConnectKitButton.Custom>
                {({ show }) => (
                  <button onClick={show}
                    className={`w-full py-5 rounded-2xl font-bold text-xl tracking-tight transition-all ${btnClass.primary}`}>
                    Connect Wallet
                  </button>
                )}
              </ConnectKitButton.Custom>
            ) : (
              <button onClick={swap} disabled={btnState.disabled}
                className={`w-full py-5 rounded-2xl font-bold text-xl tracking-tight transition-all ${btnClass[btnState.variant]}`}>
                {swapLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {btnState.label}
                  </span>
                ) : btnState.label}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
