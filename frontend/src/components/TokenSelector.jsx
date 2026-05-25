import { useState } from "react";
import TokenModal from "./TokenModal";

export default function TokenSelector({ selected, onChange, excludeToken }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 text-lg font-bold transition-all flex-shrink-0
          ${selected
            ? "bg-[#1e2d45] hover:bg-[#263552] border border-[#2a3f5c] hover:border-[#3a4f6c] text-white"
            : "gradient-brand text-white hover:opacity-90"
          }`}
      >
        {selected ? (
          <>
            <img
              src={selected.logoURI}
              alt={selected.symbol}
              className="w-8 h-8 rounded-full bg-[#0a0e1a] flex-shrink-0"
              onError={e => { e.target.style.display = "none"; }}
            />
            <span>{selected.symbol}</span>
            <svg className="w-4 h-4 text-[#8b98a5] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        ) : (
          <>
            <span>Select token</span>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      <TokenModal
        open={open}
        onClose={() => setOpen(false)}
        onSelect={onChange}
        excludeToken={excludeToken}
      />
    </>
  );
}
