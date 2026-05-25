import { useState, useEffect, useRef } from "react";
import { useReadContract, usePublicClient } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import {
  AGGREGATOR_ROUTER_ADDRESS,
  AGGREGATOR_ROUTER_ABI,
  QUOTERS,
  SPOOKY_V3_QUOTER_ABI,
  SWAPX_ALGEBRA_QUOTER_ABI,
  METROPOLIS_LB_QUOTER_ABI,
  WS_ADDRESS,
  DEX_INDEX,
} from "../constants/tokens";

const DEBOUNCE_MS = 500;
const V3_FEES = [500, 3000]; // fee tiers to try for SpookySwap V3

// ─────────────────────────────────────────────────────────────────────────────
// useQuote
// Returns: { bestQuote, allRoutes, loading, error }
// bestQuote: the highest-output route across all DEXes
// allRoutes: array of every route found (on-chain + off-chain), sorted by amountOut desc
// ─────────────────────────────────────────────────────────────────────────────
export function useQuote({ tokenIn, tokenOut, amountIn }) {
  const [debouncedAmount, setDebouncedAmount] = useState("");
  const [parsedAmountIn, setParsedAmountIn] = useState(null);
  const [offChainRoutes, setOffChainRoutes] = useState([]);
  const [offChainLoading, setOffChainLoading] = useState(false);
  const timerRef = useRef(null);

  const publicClient = usePublicClient();

  // Debounce input
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedAmount(amountIn), DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [amountIn]);

  // Parse amount
  useEffect(() => {
    if (!debouncedAmount || !tokenIn || isNaN(Number(debouncedAmount)) || Number(debouncedAmount) <= 0) {
      setParsedAmountIn(null);
      return;
    }
    try {
      setParsedAmountIn(parseUnits(debouncedAmount, tokenIn.decimals));
    } catch {
      setParsedAmountIn(null);
    }
  }, [debouncedAmount, tokenIn]);

  // Native S maps to wS for contract calls
  const tokenInAddr  = tokenIn?.isNative  ? WS_ADDRESS : tokenIn?.address;
  const tokenOutAddr = tokenOut?.isNative ? WS_ADDRESS : tokenOut?.address;

  const enabled =
    Boolean(parsedAmountIn) &&
    Boolean(tokenInAddr) &&
    Boolean(tokenOutAddr) &&
    tokenInAddr !== tokenOutAddr &&
    AGGREGATOR_ROUTER_ADDRESS !== "0x0000000000000000000000000000000000000000";

  // ── On-chain: getAllRoutes (UniV2 + Solidly) ──────────────────────────────
  const { data: onChainData, isLoading: onChainLoading, isError: onChainError, error: onChainErr } =
    useReadContract({
      address: AGGREGATOR_ROUTER_ADDRESS,
      abi: AGGREGATOR_ROUTER_ABI,
      functionName: "getAllRoutes",
      args: enabled ? [parsedAmountIn, tokenInAddr, tokenOutAddr] : undefined,
      query: { enabled, retry: 1, staleTime: 10_000 },
    });

  // ── Off-chain: V3 / Algebra / DLMM quoters ───────────────────────────────
  useEffect(() => {
    if (!enabled || !publicClient) {
      setOffChainRoutes([]);
      return;
    }

    let cancelled = false;
    setOffChainLoading(true);

    async function fetchOffChain() {
      const routes = [];

      // SpookySwap V3 — try multiple fee tiers
      for (const fee of V3_FEES) {
        try {
          const result = await publicClient.simulateContract({
            address: QUOTERS.spookySwapV3,
            abi: SPOOKY_V3_QUOTER_ABI,
            functionName: "quoteExactInputSingle",
            args: [{ tokenIn: tokenInAddr, tokenOut: tokenOutAddr, amountIn: parsedAmountIn, fee, sqrtPriceLimitX96: 0n }],
          });
          if (result?.result?.[0] > 0n) {
            routes.push({
              amountOut: result.result[0],
              dexName: "SpookySwap V3",
              dexIndex: DEX_INDEX.SPOOKY_V3,
              path: [tokenInAddr, tokenOutAddr],
              stableFlags: [],
              meta: { type: "UniV3", fee },
            });
            break; // take the first working fee tier
          }
        } catch { /* pool doesn't exist at this fee tier */ }
      }

      // SwapX (Algebra)
      try {
        const result = await publicClient.simulateContract({
          address: QUOTERS.swapXAlgebra,
          abi: SWAPX_ALGEBRA_QUOTER_ABI,
          functionName: "quoteExactInputSingle",
          args: [{ tokenIn: tokenInAddr, tokenOut: tokenOutAddr, amountIn: parsedAmountIn, limitSqrtPrice: 0n }],
        });
        if (result?.result?.[0] > 0n) {
          routes.push({
            amountOut: result.result[0],
            dexName: "SwapX",
            dexIndex: DEX_INDEX.SWAPX,
            path: [tokenInAddr, tokenOutAddr],
            stableFlags: [],
            meta: { type: "Algebra" },
          });
        }
      } catch { /* no pool */ }

      // Metropolis DLMM
      try {
        const result = await publicClient.readContract({
          address: QUOTERS.metropolisLB,
          abi: METROPOLIS_LB_QUOTER_ABI,
          functionName: "findBestPathFromAmountIn",
          args: [[tokenInAddr, tokenOutAddr], parsedAmountIn],
        });
        const amounts = result?.amounts ?? [];
        const lastAmt = amounts[amounts.length - 1] ?? 0n;
        if (lastAmt > 0n) {
          routes.push({
            amountOut: BigInt(lastAmt),
            dexName: "Metropolis DLMM",
            dexIndex: DEX_INDEX.METROPOLIS_DLMM,
            path: [tokenInAddr, tokenOutAddr],
            stableFlags: [],
            meta: {
              type: "DLMM",
              binSteps: result.binSteps.map(b => BigInt(b)),
              versions: result.versions.map(v => Number(v)),
              tokenPath: result.route,
            },
          });
        }
      } catch { /* no pool */ }

      if (!cancelled) {
        setOffChainRoutes(routes);
        setOffChainLoading(false);
      }
    }

    fetchOffChain().catch(() => {
      if (!cancelled) setOffChainLoading(false);
    });

    return () => { cancelled = true; };
  }, [enabled, parsedAmountIn, tokenInAddr, tokenOutAddr, publicClient]);

  // ── Combine and sort all routes ───────────────────────────────────────────
  const onChainRoutes = (() => {
    if (!onChainData) return [];
    const [results, count] = onChainData;
    return Array.from({ length: Number(count) }, (_, i) => ({
      amountOut:   results[i].amountOut,
      dexName:     results[i].dexName,
      dexIndex:    Number(results[i].dexIndex),
      path:        results[i].path,
      stableFlags: results[i].stableFlags,
      meta:        { type: results[i].stableFlags?.length > 0 ? "Solidly" : "UniV2" },
    }));
  })();

  const allRoutes = [...onChainRoutes, ...offChainRoutes]
    .filter(r => r.amountOut > 0n)
    .sort((a, b) => (b.amountOut > a.amountOut ? 1 : b.amountOut < a.amountOut ? -1 : 0));

  const bestRoute = allRoutes[0] ?? null;

  const bestQuote = bestRoute
    ? {
        amountOut:          bestRoute.amountOut,
        amountOutFormatted: formatUnits(bestRoute.amountOut, tokenOut?.decimals ?? 18),
        dexName:            bestRoute.dexName,
        dexIndex:           bestRoute.dexIndex,
        path:               bestRoute.path,
        stableFlags:        bestRoute.stableFlags,
        meta:               bestRoute.meta,
        priceImpactBps:     0n,
        priceImpactPercent: "0.00",
      }
    : null;

  const loading = (onChainLoading || offChainLoading) && enabled;
  const error   = !loading && enabled && parsedAmountIn && allRoutes.length === 0
    ? (onChainErr?.shortMessage || onChainErr?.message || "No route found")
    : null;

  return { bestQuote, allRoutes, loading, error, parsedAmountIn };
}
