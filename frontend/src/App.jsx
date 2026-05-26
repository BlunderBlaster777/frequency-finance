import { useState } from "react";
import { Routes, Route, Link, NavLink, useNavigate } from "react-router-dom";
import { ConnectKitButton } from "connectkit";
import { useAccount, useChainId } from "wagmi";
import { Toaster } from "react-hot-toast";
import SwapCard from "./components/SwapCard";
import { SONIC_CHAIN_ID } from "./constants/tokens";

// ─── Wrong network banner ─────────────────────────────────────────────────────
function WrongNetworkBanner() {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  if (!isConnected || chainId === SONIC_CHAIN_ID) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-gray-900 text-center py-2 px-4 text-sm font-medium">
      Switch to Sonic Network (Chain ID 146) to continue.
    </div>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <Link to="/" className="flex items-center group flex-shrink-0">
      <img
        src="/logo.png"
        alt="Frequency Finance"
        className="w-auto transition-opacity group-hover:opacity-80"
        style={{ filter: "invert(1)", height: "44px", maxWidth: "260px", objectFit: "contain" }}
      />
    </Link>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [
    { to: "/app",  label: "Swap" },
    { to: "/docs", label: "Docs" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1e2d45] bg-[#0a0e1a]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex items-center gap-8">
        {/* Left: logo + nav links */}
        <Logo />
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-5 py-2.5 rounded-lg text-base font-medium transition-colors
                ${isActive ? "text-white bg-[#1e2d45]" : "text-[#8b98a5] hover:text-white hover:bg-[#1a2035]"}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: wallet + mobile toggle */}
        <div className="flex items-center gap-2">
          <ConnectKitButton />
          <button
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-[#1a2035] transition-colors"
            onClick={() => setMobileOpen(v => !v)}
          >
            <span className={`block h-px w-5 bg-[#8b98a5] transition-all duration-200 ${mobileOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
            <span className={`block h-px w-5 bg-[#8b98a5] transition-all duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block h-px w-5 bg-[#8b98a5] transition-all duration-200 ${mobileOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[#1e2d45] bg-[#0f1624] px-4 py-3 space-y-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block w-full text-left px-4 py-3 rounded-lg text-base font-medium transition-colors
                ${isActive ? "text-white bg-[#1e2d45]" : "text-[#8b98a5] hover:text-white hover:bg-[#1a2035]"}`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────
const DEXES = [
  { name: "Shadow Exchange",  type: "Solidly ve(3,3)",  color: "#b6509e" },
  { name: "SpookySwap V2",    type: "UniswapV2",         color: "#2ebac6" },
  { name: "SpookySwap V3",    type: "UniswapV3",         color: "#4dd9e6" },
  { name: "SwapX",            type: "Algebra V4",        color: "#9d5eb8" },
  { name: "Metropolis V2",    type: "UniswapV2",         color: "#38bdf8" },
  { name: "Metropolis DLMM",  type: "Liquidity Book",    color: "#67e8f9" },
];

const FEATURES = [
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    title: "Best-price routing",
    desc: "All 6 DEXes are quoted simultaneously. Your trade executes through whichever pool gives the highest output — automatically.",
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />,
    title: "Full transparency",
    desc: "Every available route is ranked and shown before you trade. See the exact DEX, pool type, fee tier, and price impact of every option.",
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
    title: "On-chain slippage guard",
    desc: "The contract enforces your minimum output on-chain. If the price moves past your tolerance the transaction reverts — funds never lost to slippage.",
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />,
    title: "Native S support",
    desc: "Swap native Sonic (S) directly in or out. The router wraps and unwraps automatically — no extra approval or transaction needed.",
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    title: "Tiny protocol fee",
    desc: "0.05% of input funds development. Everything else goes to the DEX pool. No hidden markups.",
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />,
    title: "Open source",
    desc: "The router contract and frontend are fully public. Read the code, verify the logic, or fork and build on top.",
  },
];

function FeatureIcon({ d }) {
  return (
    <div className="w-12 h-12 rounded-xl bg-[#0a0e1a] border border-[#1e2d45] flex items-center justify-center text-[#2ebac6] mb-5 flex-shrink-0">
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">{d}</svg>
    </div>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="max-w-6xl mx-auto w-full px-4 md:px-6 pt-20 pb-24">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6">
            The smarter way<br />to swap.
          </h1>
          <p className="text-[#8b98a5] text-xl leading-relaxed mb-10 max-w-lg">
            Frequency Finance aggregates every DEX on Sonic chain, routes your trade through the best available pool, and shows you exactly what you're getting before you sign.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => navigate("/app")}
              className="gradient-brand text-white font-semibold px-8 py-4 rounded-xl text-base shadow-lg transition-opacity hover:opacity-90 active:opacity-80"
            >
              Launch App
            </button>
            <Link
              to="/docs"
              className="border border-[#1e2d45] bg-[#131929] hover:bg-[#1a2035] text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors"
            >
              Read Docs
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[#1e2d45] bg-[#0f1624]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "DEXes aggregated", value: "6"     },
              { label: "Protocol types",   value: "5"     },
              { label: "Protocol fee",     value: "0.05%" },
              { label: "Tx deadline",      value: "20 min" },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-4xl font-bold text-white mb-2">{value}</div>
                <div className="text-base text-[#8b98a5]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto w-full px-4 md:px-6 py-20">
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Built for traders.</h2>
          <p className="text-[#8b98a5] text-lg max-w-md">Every decision in Frequency Finance was made with one goal: give you the best execution on Sonic chain.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className="bg-[#0f1624] border border-[#1e2d45] rounded-2xl p-6 hover:border-[#2a3f5c] transition-colors">
              <FeatureIcon d={icon} />
              <h3 className="font-semibold text-white mb-3 text-lg">{title}</h3>
              <p className="text-base text-[#8b98a5] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DEX grid */}
      <section className="border-t border-[#1e2d45] bg-[#0f1624]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16">
          <h2 className="text-2xl font-bold text-white mb-3">Supported protocols</h2>
          <p className="text-base text-[#8b98a5] mb-8">Frequency routes across all major Sonic DEXes in a single transaction.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {DEXES.map(({ name, type, color }) => (
              <div key={name} className="flex items-center gap-3 bg-[#0a0e1a] border border-[#1e2d45] rounded-xl p-4 hover:border-[#2a3f5c] transition-colors">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <div>
                  <div className="text-base font-medium text-white leading-tight">{name}</div>
                  <div className="text-sm text-[#8b98a5] mt-0.5">{type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto w-full px-4 md:px-6 py-20">
        <div className="bg-[#0f1624] border border-[#1e2d45] rounded-3xl p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Ready to swap?</h2>
            <p className="text-[#8b98a5] text-lg">Connect your wallet and trade with the best rates on Sonic.</p>
          </div>
          <button
            onClick={() => navigate("/app")}
            className="gradient-brand text-white font-semibold px-8 py-4 rounded-xl text-base flex-shrink-0 hover:opacity-90 transition-opacity shadow-lg"
          >
            Launch App →
          </button>
        </div>
      </section>
    </div>
  );
}

// ─── Swap page ────────────────────────────────────────────────────────────────
function SwapPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-start px-4 pt-10 pb-16">
      {/* Page heading */}
      <div className="w-full max-w-lg mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Swap</h1>
        <p className="text-[#8b98a5] text-base">Best price across 6 DEXes on Sonic — in one transaction.</p>
      </div>

      {/* The card */}
      <SwapCard />

      {/* Subtle trust strip below the card */}
      <div className="mt-6 flex items-center gap-6 flex-wrap justify-center">
        {DEXES.map(({ name, color }) => (
          <div key={name} className="flex items-center gap-1.5 text-xs text-[#4a5568]">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            {name}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-[#2a3f5c]">0.05% protocol fee · 20-min deadline · Slippage protected on-chain</p>
    </main>
  );
}

// ─── Docs page ────────────────────────────────────────────────────────────────
const DOC_SECTIONS = [
  {
    id: "introduction",
    title: "Introduction",
    content: [
      {
        heading: "What is Frequency Finance?",
        body: "Frequency Finance is a DEX aggregator deployed on Sonic chain (EVM, chain ID 146). Instead of routing your trade through a single exchange, Frequency queries every major DEX on the network simultaneously and executes through the pool that offers you the highest output for your exact input amount.\n\nYou interact with a single on-chain contract — SonicAggregatorRouter — which handles quoting, routing selection, token transfers, and swap execution in one transaction.",
      },
      {
        heading: "Why use an aggregator?",
        body: "On any DEX, the available liquidity for a given token pair is finite. Large trades push the price along the bonding curve, costing you through slippage. Because each DEX has its own liquidity pools, the same trade can produce meaningfully different output amounts depending on which exchange you use.\n\nAn aggregator like Frequency checks all of them at once and directs your order to wherever it gets the best fill. For most trades, you get measurably more output than you would by picking a DEX manually.",
      },
      {
        heading: "Fees",
        body: "Frequency Finance charges a 0.05% protocol fee on the input amount of every swap. This fee is deducted from your input before it reaches the DEX, and is sent to the protocol treasury to fund development and operations.\n\nIn addition to the protocol fee, you pay the underlying DEX pool fee (typically 0.01%–1% depending on the pool type). There are no hidden fees beyond these two.",
      },
    ],
  },
  {
    id: "how-it-works",
    title: "How it works",
    content: [
      {
        heading: "Step 1 — Quoting",
        body: "When you enter a swap amount, the frontend fires quote requests to every supported DEX in parallel:\n\n• UniV2 and Solidly pools: quoted on-chain by calling getAllRoutes() on SonicAggregatorRouter. This function iterates the DEX registry and calls getAmountsOut() on each active pool, including two-hop routes via wS.\n\n• UniswapV3 (SpookySwap V3): quoted off-chain by calling quoteExactInputSingle() on the SpookySwap V3 QuoterV2 contract. Fee tiers 500 (0.05%) and 3000 (0.3%) are both tried.\n\n• Algebra V4 (SwapX): quoted off-chain via AlgebraQuoter.quoteExactInputSingle() with limitSqrtPrice = 0.\n\n• Metropolis DLMM: quoted off-chain via findBestPathFromAmountIn(), which returns the optimal bin steps and version flags needed for execution.",
      },
      {
        heading: "Step 2 — Route selection",
        body: "All quote results — on-chain and off-chain — are merged into a single list and sorted by amountOut descending. The best route is pre-selected and highlighted in the UI. You can expand the panel to see every available route ranked in order.",
      },
      {
        heading: "Step 3 — Execution",
        body: "When you confirm the swap, the frontend builds a transaction to SonicAggregatorRouter using the function appropriate for the selected route's protocol type:\n\n• UniV2/Solidly: swapExactTokensForTokens / swapExactSForTokens / swapExactTokensForS\n• UniswapV3: swapV3ExactInputSingle / swapV3ExactInputSingleFromS\n• Algebra: swapAlgebraExactInputSingle / swapAlgebraExactInputSingleFromS\n• DLMM: swapMetropolisExactIn / swapMetropolisExactInFromS / swapMetropolisExactInForS\n\nThe router deducts the 0.05% protocol fee, approves the remaining input to the DEX, and calls the DEX's swap function. The output lands directly in your wallet.",
      },
      {
        heading: "Native S handling",
        body: "Sonic's native token (S) is not an ERC-20, so it cannot be transferred in the same way as other tokens. The router handles this automatically:\n\n• S → token: You send native S with the transaction (msg.value). The router wraps it to wS via IWETH(WS).deposit(), deducts the fee, then swaps wS for your target token.\n\n• token → S: The router accepts your ERC-20 token, swaps it for wS through the DEX, then unwraps wS to native S and sends it to your address.\n\nYou don't need to hold or approve wS manually.",
      },
    ],
  },
  {
    id: "contracts",
    title: "Contract addresses",
    content: [
      {
        heading: "Sonic Mainnet (chain ID 146)",
        body: "All contracts are deployed on Sonic mainnet. Verify addresses on Sonicscan before interacting.",
      },
      {
        heading: "SonicAggregatorRouter",
        body: "0xf68bA721Ff5ec057957cFd5F0278BC85A3841b00\n\nThis is the single entry point for all swaps. It holds the DEX registry and handles quoting, fee deduction, and execution.",
      },
      {
        heading: "Wrapped Sonic (wS)",
        body: "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38\n\nThe canonical ERC-20 wrapper for native S. The router uses this for all internal accounting on native S paths.",
      },
      {
        heading: "Off-chain quoters",
        body: "SpookySwap V3 QuoterV2:    0x3F2026Cae76b987C4002e62B9dF70988b4388234\nSwapX Algebra Quoter:      0xd74a9Bd1C98B2CbaB5823107eb2BE9C474bEe09A\nMetropolis LB Quoter:      0x56eaa884F29620fD6914827AaAE9Ee6a5C383149\n\nThese contracts are read-only and are only called by the frontend during the quoting phase. They are never called during execution.",
      },
      {
        heading: "DEX routers",
        body: "Shadow Exchange (Solidly):  0x1D368773735ee1E678950B7A97bcA2CafB330CDc\nSpookySwap V2:              0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30\nSpookySwap V3:              0xaA54D4d80e92fB98Ebb5c1c5d2a1E7e9B87A3f5c\nSwapX:                      0xcC6169aA1E879d3a4227536671F85afdb2d23fAD\nMetropolis V2:              0x23d6b0A0A4E66571E4CA9B0DC5e31B9b7Cf75df6\nMetropolis DLMM:            0x8798ADEd8A4Dd7D9dc601336D0766E3F4Df27Cd8",
      },
    ],
  },
  {
    id: "protocols",
    title: "Supported protocols",
    content: [
      {
        heading: "UniswapV2 forks",
        body: "SpookySwap V2 and Metropolis V2 use the standard Uniswap V2 constant-product AMM (x·y=k). Every pool charges a fixed fee (typically 0.25%–0.3%) distributed to liquidity providers.\n\nQuoting: getAmountsOut() called on-chain during getAllRoutes().\nExecution: swapExactTokensForTokens() with the path [tokenIn, tokenOut] or a two-hop path [tokenIn, wS, tokenOut].",
      },
      {
        heading: "Solidly ve(3,3) — Shadow Exchange",
        body: "Shadow is a fork of Solidly (Andre Cronje's ve(3,3) model). It supports two pool types per pair:\n\n• Volatile pools (stable=false): standard x·y=k curve, optimized for uncorrelated assets.\n• Stable pools (stable=true): low-slippage curve (x³y + y³x = k), optimized for pegged assets like stablecoin pairs.\n\nBoth pool types are quoted and both are available as routes. The UI labels them as 'volatile' or 'stable' in the route list.",
      },
      {
        heading: "UniswapV3 — SpookySwap V3",
        body: "SpookySwap V3 is a concentrated liquidity AMM where liquidity providers choose the price ranges their capital covers. This produces much tighter spreads than V2 for in-range trades.\n\nFee tiers available: 0.05% (500 bps) and 0.3% (3000 bps). Both are quoted independently — the UI shows whichever returns a higher output.\n\nQuoting: off-chain via QuoterV2.quoteExactInputSingle() (read-only, no gas).\nExecution: exactInputSingle() on the V3 SwapRouter.",
      },
      {
        heading: "Algebra V4 — SwapX",
        body: "SwapX uses Algebra V4, a concentrated liquidity AMM with a dynamic fee model — the pool fee adjusts continuously based on volatility and volume. There are no fixed fee tiers.\n\nQuoting: off-chain via AlgebraQuoter.quoteExactInputSingle() with limitSqrtPrice = 0.\nExecution: exactInputSingle() on the Algebra SwapRouter.",
      },
      {
        heading: "Metropolis DLMM (Liquidity Book)",
        body: "Metropolis DLMM implements Joe V2.2's Liquidity Book model. Liquidity is organized into discrete price bins. Each bin has a fixed price and a fee that compounds with volatility.\n\nKey difference from V3: liquidity within a bin is completely flat (zero slippage inside a single bin). LPs can place one-sided liquidity.\n\nQuoting: off-chain via findBestPathFromAmountIn(), which returns the optimal bin sequence plus the binSteps and version arrays required for execution.\nExecution: swapExactTokensForTokens() or swapExactNATIVEForTokens() on the LB Router.",
      },
    ],
  },
  {
    id: "slippage",
    title: "Slippage & safety",
    content: [
      {
        heading: "What slippage tolerance means",
        body: "Between when you get a quote and when your transaction confirms, the price can move. Slippage tolerance is the maximum price movement you're willing to accept.\n\nYour tolerance is applied to the quoted output: amountOutMin = quotedAmountOut × (1 − tolerance). The contract enforces this check on-chain — if the actual output at execution time is less than amountOutMin, the transaction reverts and you pay only the gas cost. Your input tokens are never taken.",
      },
      {
        heading: "Recommended settings",
        body: "Stablecoins (USDC, USDT, etc.): 0.1%\nMajor tokens (S, WETH, WBTC): 0.5%\nMid-cap tokens: 1%\nLow-liquidity or long-tail tokens: 2%+\n\nSetting tolerance too low causes transactions to revert frequently in volatile markets. Setting it too high exposes you to front-running — a searcher can sandwich your transaction and extract value up to your tolerance limit.",
      },
      {
        heading: "Front-running and MEV",
        body: "Like all DEX trades, swaps via Frequency Finance can in principle be front-run by MEV bots. The main mitigations are:\n\n1. Keep slippage tolerance as low as your trade can tolerate.\n2. For large trades, break them into smaller amounts.\n3. Use a private mempool or MEV-protected RPC if available on Sonic.",
      },
      {
        heading: "Transaction deadline",
        body: "Every transaction submitted by the frontend includes a 20-minute deadline. If your transaction sits in the mempool for longer than 20 minutes without confirming, it will revert on execution rather than fill at a stale price.",
      },
    ],
  },
  {
    id: "security",
    title: "Security",
    content: [
      {
        heading: "Disclaimer",
        body: "SonicAggregatorRouter is unaudited software. Use at your own risk. Nothing on this site constitutes financial advice. Always verify contract addresses independently before approving token spend.",
      },
      {
        heading: "Token approvals",
        body: "The Frequency Finance frontend requests an exact-amount approval for each swap — you approve precisely the input amount and nothing more. The router contract does not hold standing approvals; each swap is self-contained.\n\nYou can revoke approvals at any time via revoke.cash or your wallet's approval management interface.",
      },
      {
        heading: "Contract properties",
        body: "• No proxy, no upgrade mechanism — the deployed bytecode is immutable.\n• The owner can add new DEXes to the registry or mark existing ones inactive. The owner cannot access, move, freeze, or redirect user funds.\n• receive() only accepts native S from the wS contract address, preventing accidental deposits.\n• All ERC-20 transfers use OpenZeppelin's SafeERC20 to protect against non-standard token behaviors.",
      },
      {
        heading: "Protocol fee transparency",
        body: "The 0.05% protocol fee is enforced on-chain in the contract. The fee recipient address and fee rate are public state variables readable by anyone on Sonicscan. The owner can adjust the fee up to a maximum of 0.5% (hard-capped in the contract) and can change the recipient address. Any change emits a ProtocolFeeUpdated event.",
      },
    ],
  },
];

function DocsPage() {
  const [active, setActive] = useState("introduction");
  const section = DOC_SECTIONS.find(s => s.id === active);
  const idx     = DOC_SECTIONS.findIndex(s => s.id === active);

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-6 py-12 flex gap-8 min-h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="hidden md:block w-52 flex-shrink-0">
        <p className="text-xs text-[#4a5568] uppercase tracking-widest font-medium mb-4 px-3">Documentation</p>
        <nav className="flex flex-col gap-0.5">
          {DOC_SECTIONS.map(({ id, title }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`text-left px-4 py-3 rounded-lg text-base transition-colors
                ${active === id ? "bg-[#1e2d45] text-white font-medium" : "text-[#8b98a5] hover:text-white hover:bg-[#131929]"}`}
            >
              {title}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile select */}
      <div className="md:hidden w-full">
        <select
          value={active}
          onChange={e => setActive(e.target.value)}
          className="w-full bg-[#0f1624] border border-[#1e2d45] text-white rounded-xl px-4 py-3 text-sm focus:outline-none mb-6"
        >
          {DOC_SECTIONS.map(({ id, title }) => (
            <option key={id} value={id}>{title}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-[#0f1624] border border-[#1e2d45] rounded-2xl p-7 md:p-9">
          <h1 className="text-2xl font-bold text-white mb-8 pb-6 border-b border-[#1e2d45]">{section?.title}</h1>
          <div className="space-y-8">
            {section?.content.map(({ heading, body }, i) => (
              <div key={i}>
                {heading && <h3 className="text-lg font-semibold text-white mb-3">{heading}</h3>}
                {body && body.split("\n\n").map((para, j) => (
                  <div key={j} className="mb-3">
                    {para.split("\n").map((line, k) => {
                      const isMono = line.startsWith("•") || /^[A-Za-z ]+:\s+(https?|0x)/.test(line) || /^\d\./.test(line);
                      return (
                        <p key={k} className={`leading-relaxed ${isMono ? "font-mono text-sm text-[#8b98a5] py-0.5" : "text-base text-[#8b98a5]"}`}>
                          {line}
                        </p>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-between mt-5">
          {idx > 0 ? (
            <button onClick={() => setActive(DOC_SECTIONS[idx - 1].id)} className="flex items-center gap-2 text-base text-[#8b98a5] hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              {DOC_SECTIONS[idx - 1].title}
            </button>
          ) : <div />}
          {idx < DOC_SECTIONS.length - 1 ? (
            <button onClick={() => setActive(DOC_SECTIONS[idx + 1].id)} className="flex items-center gap-2 text-base text-[#8b98a5] hover:text-white transition-colors">
              {DOC_SECTIONS[idx + 1].title}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          ) : <div />}
        </div>
      </div>
    </main>
  );
}

// ─── 404 page ─────────────────────────────────────────────────────────────────
function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-24">
      <div className="text-center max-w-md">
        <div className="text-[120px] font-bold leading-none text-gradient select-none mb-2">404</div>
        <h1 className="text-2xl font-semibold text-white mb-3">Page not found</h1>
        <p className="text-lg text-[#8b98a5] leading-relaxed mb-10">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="border border-[#1e2d45] bg-[#131929] hover:bg-[#1a2035] text-white font-semibold px-7 py-3.5 rounded-xl text-base transition-colors"
          >
            ← Go back
          </button>
          <Link to="/" className="gradient-brand text-white font-semibold px-7 py-3.5 rounded-xl text-base hover:opacity-90 transition-opacity">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-[#1e2d45] mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <Logo />
        <div className="flex items-center gap-6 text-sm text-[#4a5568]">
          <Link to="/app"  className="hover:text-[#8b98a5] transition-colors">App</Link>
          <Link to="/docs" className="hover:text-[#8b98a5] transition-colors">Docs</Link>
          <span>Not financial advice · Use at your own risk</span>
        </div>
      </div>
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col">
      <WrongNetworkBanner />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#0f1624", color: "#e8ecf0",
            border: "1px solid #1e2d45", borderRadius: "12px",
            fontSize: "13px", boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          },
          success: { iconTheme: { primary: "#2ebac6", secondary: "#0f1624" }, duration: 5000 },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#0f1624" }, duration: 6000 },
          loading: { iconTheme: { primary: "#2ebac6", secondary: "#0f1624" } },
        }}
      />
      <Header />
      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/"     element={<LandingPage />} />
          <Route path="/app"  element={<SwapPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="*"     element={<NotFoundPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
