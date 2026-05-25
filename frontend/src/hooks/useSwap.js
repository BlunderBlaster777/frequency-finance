import { useState, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseUnits, maxUint256 } from "viem";
import toast from "react-hot-toast";
import {
  AGGREGATOR_ROUTER_ADDRESS,
  AGGREGATOR_ROUTER_ABI,
  ERC20_ABI,
  WS_ADDRESS,
} from "../constants/tokens";

const DEADLINE_SECONDS = 20 * 60;

function applySlippage(amountOut, slippageBps) {
  if (!amountOut) return 0n;
  return (amountOut * BigInt(10_000 - slippageBps)) / 10_000n;
}

export function useSwap({ tokenIn, tokenOut, amountIn, quote, slippageBps }) {
  const { address: userAddress } = useAccount();

  const [approvalTxHash, setApprovalTxHash] = useState(null);
  const [swapTxHash, setSwapTxHash] = useState(null);
  const [step, setStep] = useState("idle");

  const tokenInAddress = tokenIn?.isNative ? null : tokenIn?.address;

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenInAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: tokenInAddress && userAddress
      ? [userAddress, AGGREGATOR_ROUTER_ADDRESS]
      : undefined,
    query: { enabled: Boolean(tokenInAddress && userAddress) },
  });

  const { writeContractAsync: writeApprove } = useWriteContract();
  const { writeContractAsync: writeSwap } = useWriteContract();

  const { isLoading: waitingApproval } = useWaitForTransactionReceipt({
    hash: approvalTxHash,
    query: { enabled: Boolean(approvalTxHash) },
  });

  const { isLoading: waitingSwap } = useWaitForTransactionReceipt({
    hash: swapTxHash,
    query: { enabled: Boolean(swapTxHash) },
  });

  function getParsedAmountIn() {
    if (!amountIn || !tokenIn || isNaN(Number(amountIn)) || Number(amountIn) <= 0) return null;
    try { return parseUnits(amountIn, tokenIn.decimals); } catch { return null; }
  }

  function needsApproval() {
    if (tokenIn?.isNative) return false;
    const parsed = getParsedAmountIn();
    if (!parsed) return false;
    return !allowance || allowance < parsed;
  }

  const approve = useCallback(async () => {
    if (!tokenInAddress) return;
    setStep("approving");
    const toastId = toast.loading("Approving token...");
    try {
      const hash = await writeApprove({
        address: tokenInAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [AGGREGATOR_ROUTER_ADDRESS, maxUint256],
      });
      setApprovalTxHash(hash);
      toast.loading("Waiting for approval...", { id: toastId });
      await new Promise(r => setTimeout(r, 3000));
      await refetchAllowance();
      setStep("idle");
      toast.success("Token approved!", { id: toastId });
    } catch (err) {
      setStep("error");
      toast.error(err?.shortMessage || err?.message || "Approval failed", { id: toastId });
      throw err;
    }
  }, [tokenInAddress, writeApprove, refetchAllowance]);

  const executeSwap = useCallback(async () => {
    if (!quote || !userAddress || !tokenIn || !tokenOut) {
      toast.error("Missing swap parameters");
      return;
    }

    const parsed = getParsedAmountIn();
    if (!parsed) { toast.error("Invalid input amount"); return; }

    const amountOutMin = applySlippage(quote.amountOut, slippageBps);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_SECONDS);
    const metaType = quote.meta?.type ?? "UniV2";

    setStep("swapping");
    const toastId = toast.loading("Submitting swap...");

    try {
      let hash;

      if (metaType === "UniV3") {
        // SpookySwap V3
        const fee = quote.meta.fee;
        if (tokenIn.isNative) {
          hash = await writeSwap({
            address: AGGREGATOR_ROUTER_ADDRESS,
            abi: AGGREGATOR_ROUTER_ABI,
            functionName: "swapV3ExactInputSingleFromS",
            args: [BigInt(quote.dexIndex), tokenOut.isNative ? WS_ADDRESS : tokenOut.address, fee, amountOutMin, userAddress, deadline],
            value: parsed,
          });
        } else {
          hash = await writeSwap({
            address: AGGREGATOR_ROUTER_ADDRESS,
            abi: AGGREGATOR_ROUTER_ABI,
            functionName: "swapV3ExactInputSingle",
            args: [BigInt(quote.dexIndex), tokenIn.address, tokenOut.isNative ? WS_ADDRESS : tokenOut.address, fee, parsed, amountOutMin, userAddress, deadline],
          });
        }
      } else if (metaType === "Algebra") {
        // SwapX
        if (tokenIn.isNative) {
          hash = await writeSwap({
            address: AGGREGATOR_ROUTER_ADDRESS,
            abi: AGGREGATOR_ROUTER_ABI,
            functionName: "swapAlgebraExactInputSingleFromS",
            args: [BigInt(quote.dexIndex), tokenOut.isNative ? WS_ADDRESS : tokenOut.address, amountOutMin, userAddress, deadline],
            value: parsed,
          });
        } else {
          hash = await writeSwap({
            address: AGGREGATOR_ROUTER_ADDRESS,
            abi: AGGREGATOR_ROUTER_ABI,
            functionName: "swapAlgebraExactInputSingle",
            args: [BigInt(quote.dexIndex), tokenIn.address, tokenOut.isNative ? WS_ADDRESS : tokenOut.address, parsed, amountOutMin, userAddress, deadline],
          });
        }
      } else if (metaType === "DLMM") {
        // Metropolis DLMM
        const { binSteps, versions, tokenPath } = quote.meta;
        if (tokenIn.isNative) {
          hash = await writeSwap({
            address: AGGREGATOR_ROUTER_ADDRESS,
            abi: AGGREGATOR_ROUTER_ABI,
            functionName: "swapMetropolisExactInFromS",
            args: [BigInt(quote.dexIndex), amountOutMin, binSteps, versions, tokenPath, userAddress, deadline],
            value: parsed,
          });
        } else if (tokenOut.isNative) {
          hash = await writeSwap({
            address: AGGREGATOR_ROUTER_ADDRESS,
            abi: AGGREGATOR_ROUTER_ABI,
            functionName: "swapMetropolisExactInForS",
            args: [BigInt(quote.dexIndex), tokenIn.address, parsed, amountOutMin, binSteps, versions, tokenPath, userAddress, deadline],
          });
        } else {
          hash = await writeSwap({
            address: AGGREGATOR_ROUTER_ADDRESS,
            abi: AGGREGATOR_ROUTER_ABI,
            functionName: "swapMetropolisExactIn",
            args: [BigInt(quote.dexIndex), tokenIn.address, tokenOut.address, parsed, amountOutMin, binSteps, versions, tokenPath, userAddress, deadline],
          });
        }
      } else {
        // UniV2 / Solidly
        if (tokenIn.isNative) {
          hash = await writeSwap({
            address: AGGREGATOR_ROUTER_ADDRESS,
            abi: AGGREGATOR_ROUTER_ABI,
            functionName: "swapExactSForTokens",
            args: [amountOutMin, tokenOut.isNative ? WS_ADDRESS : tokenOut.address, userAddress, deadline],
            value: parsed,
          });
        } else if (tokenOut.isNative) {
          hash = await writeSwap({
            address: AGGREGATOR_ROUTER_ADDRESS,
            abi: AGGREGATOR_ROUTER_ABI,
            functionName: "swapExactTokensForS",
            args: [parsed, amountOutMin, tokenIn.address, userAddress, deadline],
          });
        } else {
          hash = await writeSwap({
            address: AGGREGATOR_ROUTER_ADDRESS,
            abi: AGGREGATOR_ROUTER_ABI,
            functionName: "swapExactTokensForTokens",
            args: [parsed, amountOutMin, tokenIn.address, tokenOut.address, userAddress, deadline],
          });
        }
      }

      setSwapTxHash(hash);
      toast.loading("Waiting for confirmation...", { id: toastId });
      await new Promise(r => setTimeout(r, 3000));
      setStep("done");
      toast.success(`Swapped ${amountIn} ${tokenIn.symbol} for ${tokenOut.symbol}!`, { id: toastId, duration: 6000 });
    } catch (err) {
      setStep("error");
      toast.error(err?.shortMessage || err?.message || "Swap failed", { id: toastId });
      throw err;
    }
  }, [quote, userAddress, tokenIn, tokenOut, amountIn, slippageBps, writeSwap]);

  const swap = useCallback(async () => {
    try {
      if (needsApproval()) await approve();
      await executeSwap();
    } catch {
      // errors already toasted
    }
  }, [needsApproval, approve, executeSwap]);

  return {
    swap,
    approve,
    executeSwap,
    needsApproval: needsApproval(),
    step,
    approvalTxHash,
    swapTxHash,
    isLoading: step === "approving" || step === "swapping" || waitingApproval || waitingSwap,
  };
}
