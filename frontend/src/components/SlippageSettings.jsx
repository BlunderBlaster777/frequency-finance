import { useState } from "react";

const PRESETS = [
  { label: "0.1%", bps: 10 },
  { label: "0.5%", bps: 50 },
  { label: "1%",   bps: 100 },
];

export default function SlippageSettings({ slippageBps, onChange }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const preset = PRESETS.find(p => p.bps === slippageBps);
  const label = preset ? preset.label : `${(slippageBps / 100).toFixed(2)}%`;

  function submitCustom() {
    const v = parseFloat(custom);
    if (isNaN(v) || v <= 0 || v > 50) return;
    onChange(Math.round(v * 100));
    setShowCustom(false);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-[#8b98a5] hover:text-white transition-colors bg-[#0a0e1a] hover:bg-[#131929] border border-[#1e2d45] hover:border-[#2a3f5c] rounded-lg px-4 py-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {label}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-[#0f1624] border border-[#1e2d45] rounded-xl shadow-2xl p-5 w-72 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <span className="text-base font-semibold text-white">Slippage tolerance</span>
            <button onClick={() => setOpen(false)} className="text-[#4a5568] hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {PRESETS.map(p => (
              <button
                key={p.bps}
                onClick={() => { onChange(p.bps); setShowCustom(false); setCustom(""); }}
                className={`py-2.5 rounded-lg text-sm font-semibold transition-all
                  ${slippageBps === p.bps
                    ? "bg-[#2ebac6]/10 text-[#2ebac6] border border-[#2ebac6]/30"
                    : "bg-[#0a0e1a] text-[#8b98a5] hover:text-white border border-[#1e2d45] hover:border-[#2a3f5c]"
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCustom(!showCustom)}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all border
              ${showCustom || !preset
                ? "bg-[#2ebac6]/5 text-[#2ebac6] border-[#2ebac6]/20"
                : "bg-[#0a0e1a] text-[#8b98a5] hover:text-white border-[#1e2d45] hover:border-[#2a3f5c]"
              }`}
          >
            Custom
          </button>

          {showCustom && (
            <div className="mt-3 flex gap-2 animate-fade-in">
              <div className="relative flex-1">
                <input
                  autoFocus type="number" min="0.01" max="50" step="0.01" placeholder="0.50"
                  value={custom}
                  onChange={e => setCustom(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submitCustom()}
                  className="w-full bg-[#0a0e1a] border border-[#1e2d45] focus:border-[#2ebac6]/40 rounded-lg pl-3 pr-8 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a5568] text-sm">%</span>
              </div>
              <button
                onClick={submitCustom}
                className="gradient-brand text-white rounded-lg px-4 text-sm font-semibold hover:opacity-90"
              >
                Set
              </button>
            </div>
          )}

          {slippageBps > 500 && (
            <p className="mt-4 flex items-center gap-2 text-sm text-amber-400">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              High slippage — risk of front-running
            </p>
          )}
        </div>
      )}
    </div>
  );
}
