import { TOKENS, DEX_INFO } from "../constants/tokens";

function resolveToken(address) {
  if (!address) return null;
  return TOKENS.find(t => t.address.toLowerCase() === address.toLowerCase()) || {
    symbol: address.slice(0, 6) + "…",
    address,
  };
}

const TYPE_BADGE = {
  UniV2:   "v2",
  Solidly: "ve33",
  UniV3:   "v3",
  Algebra: "alg",
  DLMM:    "dlmm",
};

export default function RouteDisplay({ quote, tokenIn, tokenOut, loading }) {
  if (loading) {
    return (
      <div className="rounded-xl bg-[#0a0e1a] border border-[#1e2d45] p-4 animate-pulse">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#1e2d45]" />
          <div className="h-3 bg-[#1e2d45] rounded w-36" />
          <div className="h-3 bg-[#1e2d45] rounded w-20 ml-auto" />
        </div>
        <div className="mt-3 flex items-center gap-2">
          {[1,2,3].map(i => <div key={i} className="h-6 bg-[#1e2d45] rounded w-14" />)}
        </div>
      </div>
    );
  }

  if (!quote) return null;

  const info    = { color: "#2ebac6", ...(DEX_INFO[quote.dexName] || {}) };
  const type    = TYPE_BADGE[quote.meta?.type] ?? "v2";
  const path    = quote.path.map(resolveToken);
  const isMulti = quote.path.length > 2;

  return (
    <div className="rounded-xl bg-[#0a0e1a] border border-[#1e2d45] p-4 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: info.color }} />
          <span className="text-sm text-[#8b98a5]">
            Best via <span className="text-white font-medium">{quote.dexName}</span>
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-[#1e2d45] text-[#8b98a5] font-medium">
            {type}
          </span>
        </div>
        <span className="text-sm text-[#4a5568]">
          {isMulti ? `${quote.path.length - 1} hops` : "Direct"}
        </span>
      </div>

      <div className="flex items-center flex-wrap gap-1.5">
        {path.map((token, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <svg className="w-3 h-3 text-[#2a3f5c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            <span className="text-sm text-[#8b98a5] bg-[#131929] border border-[#1e2d45] rounded px-2.5 py-1">
              {token?.symbol ?? "?"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
