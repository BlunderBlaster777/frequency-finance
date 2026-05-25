import { useState, useEffect, useRef } from "react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { TOKENS, ERC20_ABI } from "../constants/tokens";
import { createPortal } from "react-dom";

const POPULAR = ["S", "USDC", "WETH", "wS", "USDT", "WBTC"];

function TokenBalance({ token, userAddress }) {
  const { data: nativeBal } = useBalance({
    address: userAddress,
    query: { enabled: Boolean(userAddress) && token?.isNative },
  });
  const { data: erc20Bal } = useReadContract({
    address: token?.isNative ? undefined : token?.address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: Boolean(userAddress) && !token?.isNative },
  });

  if (!userAddress) return null;

  let bal = null;
  if (token?.isNative && nativeBal)
    bal = parseFloat(formatUnits(nativeBal.value, 18)).toFixed(4);
  else if (!token?.isNative && erc20Bal != null)
    bal = parseFloat(formatUnits(erc20Bal, token.decimals)).toFixed(4);

  if (bal === null) return null;
  return <span className="text-xs text-[#8b98a5] tabular-nums">{bal}</span>;
}

function TokenRow({ token, onSelect, isExcluded, userAddress }) {
  return (
    <button
      onClick={() => !isExcluded && onSelect(token)}
      disabled={isExcluded}
      className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-lg transition-colors text-left
        ${isExcluded
          ? "opacity-30 cursor-not-allowed"
          : "hover:bg-[#1a2035] cursor-pointer"
        }`}
    >
      <img
        src={token.logoURI}
        alt={token.symbol}
        className="w-9 h-9 rounded-full bg-[#1e2d45] flex-shrink-0"
        onError={e => { e.target.src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><circle cx='16' cy='16' r='16' fill='%231e2d45'/><text x='16' y='21' text-anchor='middle' font-size='12' fill='%238b98a5' font-family='sans-serif'>${token.symbol[0]}</text></svg>`; }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-base font-semibold text-white leading-tight">{token.symbol}</div>
        <div className="text-sm text-[#4a5568] truncate">{token.name}</div>
      </div>
      <TokenBalance token={token} userAddress={userAddress} />
    </button>
  );
}

export default function TokenModal({ open, onClose, onSelect, excludeToken }) {
  const { address: userAddress } = useAccount();
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) { setSearch(""); setTimeout(() => inputRef.current?.focus(), 60); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const excluded = excludeToken?.address?.toLowerCase();

  const filtered = TOKENS.filter(t => {
    if (excluded && t.address.toLowerCase() === excluded) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.symbol.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      (!t.isNative && t.address.toLowerCase().includes(q))
    );
  });

  const popular = TOKENS.filter(t =>
    POPULAR.includes(t.symbol) &&
    (!excluded || t.address.toLowerCase() !== excluded)
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0f1624] border border-[#1e2d45] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in"
        style={{ maxHeight: "min(640px, 90vh)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d45]">
          <h2 className="text-lg font-semibold text-white">Select a token</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#4a5568] hover:text-white hover:bg-[#1e2d45] transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-[#1e2d45]">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a5568]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search name or paste address"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0a0e1a] border border-[#1e2d45] focus:border-[#2ebac6]/40 rounded-lg pl-10 pr-4 py-3 text-base text-white placeholder-[#4a5568] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Popular */}
        {!search && popular.length > 0 && (
          <div className="px-4 py-3 border-b border-[#1e2d45]">
            <p className="text-xs text-[#4a5568] uppercase tracking-widest font-medium mb-3">Common tokens</p>
            <div className="flex flex-wrap gap-2">
              {popular.map(t => (
                <button
                  key={t.address}
                  onClick={() => { onSelect(t); onClose(); }}
                  className="flex items-center gap-2 bg-[#0a0e1a] hover:bg-[#1e2d45] border border-[#1e2d45] hover:border-[#2a3f5c] rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition-all"
                >
                  <img
                    src={t.logoURI} alt={t.symbol}
                    className="w-5 h-5 rounded-full"
                    onError={e => { e.target.style.display = "none"; }}
                  />
                  {t.symbol}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Token list */}
        <div className="overflow-y-auto flex-1 py-2">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-[#4a5568] py-12">No tokens found</p>
          ) : (
            filtered.map(t => (
              <TokenRow
                key={t.address}
                token={t}
                onSelect={tok => { onSelect(tok); onClose(); }}
                isExcluded={excluded === t.address.toLowerCase()}
                userAddress={userAddress}
              />
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
