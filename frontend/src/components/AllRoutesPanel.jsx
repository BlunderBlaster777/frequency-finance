import { formatUnits } from "viem";
import { DEX_INFO } from "../constants/tokens";

const TYPE_BADGE = {
  UniV2:   { label: "v2",   cls: "text-[#8b98a5] bg-[#1e2d45]"     },
  Solidly: { label: "ve33", cls: "text-[#b6509e] bg-[#b6509e]/10"   },
  UniV3:   { label: "v3",   cls: "text-[#2ebac6] bg-[#2ebac6]/10"   },
  Algebra: { label: "alg",  cls: "text-[#9d5eb8] bg-[#9d5eb8]/10"   },
  DLMM:    { label: "dlmm", cls: "text-[#67e8f9] bg-[#67e8f9]/10"   },
};

function RouteRow({ route, tokenOut, isBest, rank }) {
  const info    = DEX_INFO[route.dexName] ?? { color: "#2a3f5c" };
  const typeKey = route.meta?.type ?? "UniV2";
  const badge   = TYPE_BADGE[typeKey] ?? TYPE_BADGE.UniV2;
  const amount  = parseFloat(formatUnits(route.amountOut, tokenOut?.decimals ?? 18));
  const fee     = route.meta?.fee;
  const stable  = route.stableFlags?.[0] === true;

  return (
    <div className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors
      ${isBest
        ? "bg-[#2ebac6]/5 border-[#2ebac6]/20"
        : "bg-[#0a0e1a] border-[#1e2d45] hover:border-[#2a3f5c]"
      }`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className={`text-sm font-bold w-6 text-center flex-shrink-0 ${isBest ? "text-[#2ebac6]" : "text-[#4a5568]"}`}>
          {isBest ? "★" : `${rank}`}
        </span>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: info.color }} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold truncate ${isBest ? "text-white" : "text-[#8b98a5]"}`}>
              {route.dexName}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${badge.cls}`}>
              {badge.label}
            </span>
            {fee && (
              <span className="text-xs text-[#4a5568] bg-[#131929] border border-[#1e2d45] px-2 py-0.5 rounded">
                {fee / 10000}%
              </span>
            )}
            {stable && (
              <span className="text-xs text-[#2ebac6] bg-[#2ebac6]/10 px-2 py-0.5 rounded">
                stable
              </span>
            )}
          </div>
          {route.path?.length > 2 && (
            <div className="text-xs text-[#4a5568] mt-0.5">{route.path.length - 1} hops</div>
          )}
        </div>
      </div>

      <div className="text-right flex-shrink-0 ml-4">
        <div className={`text-sm font-semibold tabular-nums ${isBest ? "text-white" : "text-[#8b98a5]"}`}>
          {amount < 0.000001 && amount > 0
            ? amount.toExponential(3)
            : amount.toFixed(Math.min(6, tokenOut?.decimals ?? 6))}
        </div>
        <div className="text-xs text-[#4a5568]">{tokenOut?.symbol}</div>
      </div>
    </div>
  );
}

export default function AllRoutesPanel({ allRoutes, tokenIn, tokenOut, loading }) {
  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-14 bg-[#0a0e1a] border border-[#1e2d45] rounded-xl" />
        ))}
      </div>
    );
  }

  if (!allRoutes || allRoutes.length === 0) {
    return (
      <p className="text-center text-sm text-[#4a5568] py-6">No routes found for this pair</p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1 px-1">
        <span className="text-sm text-[#4a5568]">{allRoutes.length} route{allRoutes.length !== 1 ? "s" : ""}</span>
        <span className="text-sm text-[#2ebac6]">Best highlighted</span>
      </div>
      {allRoutes.map((route, i) => (
        <RouteRow
          key={`${route.dexName}-${i}`}
          route={route}
          tokenOut={tokenOut}
          isBest={i === 0}
          rank={i + 1}
        />
      ))}
    </div>
  );
}
