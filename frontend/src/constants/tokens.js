// ─────────────────────────────────────────────────────────────────────────────
// Chain constants
// ─────────────────────────────────────────────────────────────────────────────
export const SONIC_CHAIN_ID = 146;

export const WS_ADDRESS = "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38";

export const AGGREGATOR_ROUTER_ADDRESS =
  import.meta.env.VITE_ROUTER_ADDRESS || "0xf68bA721Ff5ec057957cFd5F0278BC85A3841b00";

// Off-chain quoter addresses (called directly by frontend, not the contract)
export const QUOTERS = {
  spookySwapV3:  "0x3F2026Cae76b987C4002e62B9dF70988b4388234",
  swapXAlgebra:  "0xd74a9Bd1C98B2CbaB5823107eb2BE9C474bEe09A",
  metropolisLB:  "0x56eaa884F29620fD6914827AaAE9Ee6a5C383149",
};

// DEX indices (match deploy order)
export const DEX_INDEX = {
  SPOOKY_V2:       0,
  METROPOLIS_V2:   1,
  SHADOW:          2,
  SPOOKY_V3:       3,
  SWAPX:           4,
  METROPOLIS_DLMM: 5,
};

// ─────────────────────────────────────────────────────────────────────────────
// Token list — all verified Sonic mainnet tokens with local icons
// Local icons served from /public/tokens/{address}.png
// ─────────────────────────────────────────────────────────────────────────────
const T = (address) => `/tokens/${address}.png`;

export const NATIVE_S = {
  address: "NATIVE", symbol: "S", name: "Sonic",
  decimals: 18, logoURI: "/tokens/native.png", isNative: true,
};

export const TOKENS = [
  // ── Native & wrapped ──────────────────────────────────────────────────────
  { address: "NATIVE",                                        symbol: "S",       name: "Sonic",                          decimals: 18, logoURI: "/tokens/native.png",                                   isNative: true  },
  { address: "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38",   symbol: "wS",      name: "Wrapped Sonic",                  decimals: 18, logoURI: T("0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38"),       isNative: false },

  // ── Stablecoins ───────────────────────────────────────────────────────────
  { address: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",   symbol: "USDC.e",  name: "Bridged USDC (Sonic Labs)",      decimals: 6,  logoURI: T("0x29219dd400f2Bf60E5a23d13Be72B486D4038894"),       isNative: false },
  { address: "0x6047828dc181963ba44974801FF68e538dA5eaF9",   symbol: "USDT",    name: "Bridged USDT",                   decimals: 6,  logoURI: T("0x6047828dc181963ba44974801FF68e538dA5eaF9"),       isNative: false },
  { address: "0xd3DCe716f3eF535C5Ff8d041c1A41C3bd89b97aE",   symbol: "scUSD",   name: "Sonic USD",                      decimals: 6,  logoURI: T("0xd3DCe716f3eF535C5Ff8d041c1A41C3bd89b97aE"),       isNative: false },
  { address: "0x80Eede496655FB9047dd39d9f418d5483ED600df",   symbol: "frxUSD",  name: "Frax USD",                       decimals: 18, logoURI: T("0x80Eede496655FB9047dd39d9f418d5483ED600df"),       isNative: false },
  { address: "0x7FFf4C4a827C84E32c5E175052834111B2ccd270",   symbol: "crvUSD",  name: "Curve.Finance USD",              decimals: 18, logoURI: T("0x7FFf4C4a827C84E32c5E175052834111B2ccd270"),       isNative: false },
  { address: "0xe715cbA7B5cCb33790ceBFF1436809d36cb17E57",   symbol: "EURC.e",  name: "Bridged EURC (Sonic Labs)",      decimals: 6,  logoURI: T("0xe715cbA7B5cCb33790ceBFF1436809d36cb17E57"),       isNative: false },

  // ── Major bridged assets ──────────────────────────────────────────────────
  { address: "0x50c42dEAcD8Fc9773493ED674b675bE577f2634b",   symbol: "WETH",    name: "Wrapped Ether on Sonic",         decimals: 18, logoURI: T("0x50c42dEAcD8Fc9773493ED674b675bE577f2634b"),       isNative: false },
  { address: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",   symbol: "WBTC",    name: "Wrapped BTC",                    decimals: 8,  logoURI: T("0x0555E30da8f98308EdB960aa94C0Db47230d2B9c"),       isNative: false },
  { address: "0xecAc9C5F704e954931349Da37F60E39f515c11c1",   symbol: "LBTC",    name: "Lombard Staked BTC",             decimals: 8,  logoURI: T("0xecAc9C5F704e954931349Da37F60E39f515c11c1"),       isNative: false },

  // ── Sonic DeFi ecosystem ──────────────────────────────────────────────────
  { address: "0x2D0E0814E62D80056181F5cd932274405966e4f0",   symbol: "BEETS",   name: "Beets",                          decimals: 18, logoURI: T("0x2D0E0814E62D80056181F5cd932274405966e4f0"),       isNative: false },
  { address: "0x3333b97138D4b086720b5aE8A7844b1345a33333",   symbol: "SHADOW",  name: "Shadow",                         decimals: 18, logoURI: T("0x3333b97138D4b086720b5aE8A7844b1345a33333"),       isNative: false },
  { address: "0x3333111A391cC08fa51353E9195526A70b333333",   symbol: "x33",     name: "Shadow Liquid Staking",          decimals: 18, logoURI: T("0x3333111A391cC08fa51353E9195526A70b333333"),       isNative: false },
  { address: "0x0e0Ce4D450c705F8a0B6Dd9d5123e3df2787D16B",   symbol: "WAGMI",   name: "Wagmi",                          decimals: 18, logoURI: T("0x0e0Ce4D450c705F8a0B6Dd9d5123e3df2787D16B"),       isNative: false },
  { address: "0x71E99522EaD5E21CF57F1f542Dc4ad2E841F7321",   symbol: "METRO",   name: "Metropolis",                     decimals: 18, logoURI: T("0x71E99522EaD5E21CF57F1f542Dc4ad2E841F7321"),       isNative: false },
  { address: "0xA04BC7140c26fc9BB1F36B1A604C7A5a88fb0E70",   symbol: "SWPx",    name: "SwapX",                          decimals: 18, logoURI: T("0xA04BC7140c26fc9BB1F36B1A604C7A5a88fb0E70"),       isNative: false },
  { address: "0xb1e25689D55734FD3ffFc939c4C3Eb52DFf8A794",   symbol: "OS",      name: "Origin Sonic",                   decimals: 18, logoURI: T("0xb1e25689D55734FD3ffFc939c4C3Eb52DFf8A794"),       isNative: false },
  { address: "0x005851f943ee2957B1748957F26319e4f9EdeBC1",   symbol: "AG",      name: "Silver",                         decimals: 18, logoURI: T("0x005851f943ee2957B1748957F26319e4f9EdeBC1"),       isNative: false },
  { address: "0x486B6Fa0419b33a0c7A6e4698c231D7E2f2D5299",   symbol: "MOON",    name: "Moon Bay",                       decimals: 18, logoURI: T("0x486B6Fa0419b33a0c7A6e4698c231D7E2f2D5299"),       isNative: false },
  { address: "0x949185D3BE66775Ea648F4a306740EA9eFF9C567",   symbol: "YEL",     name: "YELToken",                       decimals: 18, logoURI: T("0x949185D3BE66775Ea648F4a306740EA9eFF9C567"),       isNative: false },
  { address: "0xBC0d0650412EF353D672c0Bbd12eFFF90591B251",   symbol: "FS",      name: "FutureStarter",                  decimals: 18, logoURI: T("0xBC0d0650412EF353D672c0Bbd12eFFF90591B251"),       isNative: false },
  { address: "0x6881B80ea7C858E4aEEf63893e18a8A36f3682f3",   symbol: "NAVI",    name: "NAVI",                           decimals: 18, logoURI: T("0x6881B80ea7C858E4aEEf63893e18a8A36f3682f3"),       isNative: false },
  { address: "0xE51EE9868C1f0d6cd968A8B8C8376Dc2991BFE44",   symbol: "BRUSH",   name: "PaintSwap Brush",                decimals: 18, logoURI: T("0xE51EE9868C1f0d6cd968A8B8C8376Dc2991BFE44"),       isNative: false },
  { address: "0xc55E93C62874D8100dBd2DfE307EDc1036ad5434",   symbol: "mooBIFI", name: "Moo BIFI",                       decimals: 18, logoURI: T("0xc55E93C62874D8100dBd2DfE307EDc1036ad5434"),       isNative: false },
  { address: "0x7AD5935EA295c4E743e4f2f5B4CDA951f41223c2",   symbol: "SACRA",   name: "Sacra",                          decimals: 18, logoURI: T("0x7AD5935EA295c4E743e4f2f5B4CDA951f41223c2"),       isNative: false },

  // ── DeFi protocols on Sonic ───────────────────────────────────────────────
  { address: "0x5Af79133999f7908953E94b7A5CF367740Ebee35",   symbol: "CRV",     name: "Curve DAO Token",                decimals: 18, logoURI: T("0x5Af79133999f7908953E94b7A5CF367740Ebee35"),       isNative: false },
  { address: "0x2fb960611bdC322A9a4A994252658Cae9fe2eeA1",   symbol: "UNI",     name: "Uniswap",                        decimals: 18, logoURI: T("0x2fb960611bdC322A9a4A994252658Cae9fe2eeA1"),       isNative: false },
  { address: "0xf1eF7d2D4C0c881cd634481e0586ed5d2871A74B",   symbol: "PENDLE",  name: "Pendle",                         decimals: 18, logoURI: T("0xf1eF7d2D4C0c881cd634481e0586ed5d2871A74B"),       isNative: false },
  { address: "0x0fDbce271bea0d9819034cd09021e0bBE94be3Fd",   symbol: "GEAR",    name: "Gearbox Protocol",               decimals: 18, logoURI: T("0x0fDbce271bea0d9819034cd09021e0bBE94be3Fd"),       isNative: false },
  { address: "0xf26Ff70573ddc8a90Bd7865AF8d7d70B8Ff019bC",   symbol: "EGGS",    name: "Eggs Finance",                   decimals: 18, logoURI: T("0xf26Ff70573ddc8a90Bd7865AF8d7d70B8Ff019bC"),       isNative: false },
  { address: "0x6c9B3A74ae4779da5Ca999371eE8950e8DB3407f",   symbol: "FLY",     name: "fly.trade",                      decimals: 18, logoURI: T("0x6c9B3A74ae4779da5Ca999371eE8950e8DB3407f"),       isNative: false },
  { address: "0x79bbF4508B1391af3A0F4B30bb5FC4aa9ab0E07C",   symbol: "Anon",    name: "HeyAnon",                        decimals: 18, logoURI: T("0x79bbF4508B1391af3A0F4B30bb5FC4aa9ab0E07C"),       isNative: false },

  // ── Meme / community ──────────────────────────────────────────────────────
  { address: "0x70e7f1d907E30efb18FE1DD8A1d75c09A98177d3",   symbol: "JEFE",    name: "JEFE TOKEN",                     decimals: 9,  logoURI: T("0x70e7f1d907E30efb18FE1DD8A1d75c09A98177d3"),       isNative: false },
  { address: "0x17Af1Df44444AB9091622e4Aa66dB5BB34E51aD5",   symbol: "THC",     name: "Tin Hat Cat",                    decimals: 18, logoURI: T("0x17Af1Df44444AB9091622e4Aa66dB5BB34E51aD5"),       isNative: false },
  { address: "0x63A522f6E7D5B96F7aeBB74d2648545E9e14078D",   symbol: "CONK",    name: "ShibaPoconk",                    decimals: 18, logoURI: T("0x63A522f6E7D5B96F7aeBB74d2648545E9e14078D"),       isNative: false },
  { address: "0xe6cc4D855B4fD4A9D02F46B9adae4C5EfB1764B5",   symbol: "LUDWIG",  name: "LUDWIG",                         decimals: 18, logoURI: T("0xe6cc4D855B4fD4A9D02F46B9adae4C5EfB1764B5"),       isNative: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// DEX metadata for display
// ─────────────────────────────────────────────────────────────────────────────
export const DEX_INFO = {
  "SpookySwap V2":    { color: "#2ebac6", tag: "v2",   logo: null,                          url: "https://spooky.fi"           },
  "Metropolis V2":    { color: "#38bdf8", tag: "v2",   logo: null,                          url: "https://metropolis.exchange" },
  "Shadow Exchange":  { color: "#b6509e", tag: "ve33", logo: null,                          url: "https://shadow.so"           },
  "SpookySwap V3":    { color: "#4dd9e6", tag: "v3",   logo: null,                          url: "https://spooky.fi"           },
  "SwapX":            { color: "#9d5eb8", tag: "alg",  logo: "/dapps/swapx.launchzone.org.png", url: "https://swapx.fi"        },
  "Metropolis DLMM":  { color: "#67e8f9", tag: "dlmm", logo: null,                          url: "https://metropolis.exchange" },
};

// ─────────────────────────────────────────────────────────────────────────────
// ABIs
// ─────────────────────────────────────────────────────────────────────────────
export const AGGREGATOR_ROUTER_ABI = [
  {
    type: "function", name: "getBestRoute", stateMutability: "view",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "tokenIn",  type: "address" },
      { name: "tokenOut", type: "address" },
    ],
    outputs: [{
      name: "best", type: "tuple",
      components: [
        { name: "amountOut",    type: "uint256"   },
        { name: "path",         type: "address[]" },
        { name: "stableFlags",  type: "bool[]"    },
        { name: "dexIndex",     type: "uint256"   },
        { name: "dexName",      type: "string"    },
      ],
    }],
  },
  {
    type: "function", name: "getAllRoutes", stateMutability: "view",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "tokenIn",  type: "address" },
      { name: "tokenOut", type: "address" },
    ],
    outputs: [
      {
        name: "results", type: "tuple[]",
        components: [
          { name: "amountOut",   type: "uint256"   },
          { name: "path",        type: "address[]" },
          { name: "stableFlags", type: "bool[]"    },
          { name: "dexIndex",    type: "uint256"   },
          { name: "dexName",     type: "string"    },
        ],
      },
      { name: "count", type: "uint256" },
    ],
  },
  {
    type: "function", name: "swapExactTokensForTokens", stateMutability: "nonpayable",
    inputs: [
      { name: "amountIn",     type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
      { name: "tokenIn",      type: "address" },
      { name: "tokenOut",     type: "address" },
      { name: "to",           type: "address" },
      { name: "deadline",     type: "uint256" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
  {
    type: "function", name: "swapExactSForTokens", stateMutability: "payable",
    inputs: [
      { name: "amountOutMin", type: "uint256" },
      { name: "tokenOut",     type: "address" },
      { name: "to",           type: "address" },
      { name: "deadline",     type: "uint256" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
  {
    type: "function", name: "swapExactTokensForS", stateMutability: "nonpayable",
    inputs: [
      { name: "amountIn",     type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
      { name: "tokenIn",      type: "address" },
      { name: "to",           type: "address" },
      { name: "deadline",     type: "uint256" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
  {
    type: "function", name: "swapV3ExactInputSingle", stateMutability: "nonpayable",
    inputs: [
      { name: "dexIndex",     type: "uint256" },
      { name: "tokenIn",      type: "address" },
      { name: "tokenOut",     type: "address" },
      { name: "fee",          type: "uint24"  },
      { name: "amountIn",     type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
      { name: "to",           type: "address" },
      { name: "deadline",     type: "uint256" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
  {
    type: "function", name: "swapV3ExactInputSingleFromS", stateMutability: "payable",
    inputs: [
      { name: "dexIndex",     type: "uint256" },
      { name: "tokenOut",     type: "address" },
      { name: "fee",          type: "uint24"  },
      { name: "amountOutMin", type: "uint256" },
      { name: "to",           type: "address" },
      { name: "deadline",     type: "uint256" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
  {
    type: "function", name: "swapAlgebraExactInputSingle", stateMutability: "nonpayable",
    inputs: [
      { name: "dexIndex",     type: "uint256" },
      { name: "tokenIn",      type: "address" },
      { name: "tokenOut",     type: "address" },
      { name: "amountIn",     type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
      { name: "to",           type: "address" },
      { name: "deadline",     type: "uint256" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
  {
    type: "function", name: "swapMetropolisExactIn", stateMutability: "nonpayable",
    inputs: [
      { name: "dexIndex",     type: "uint256"   },
      { name: "tokenIn",      type: "address"   },
      { name: "tokenOut",     type: "address"   },
      { name: "amountIn",     type: "uint256"   },
      { name: "amountOutMin", type: "uint256"   },
      { name: "binSteps",     type: "uint256[]" },
      { name: "versions",     type: "uint8[]"   },
      { name: "tokenPath",    type: "address[]" },
      { name: "to",           type: "address"   },
      { name: "deadline",     type: "uint256"   },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
  {
    type: "function", name: "swapAlgebraExactInputSingleFromS", stateMutability: "payable",
    inputs: [
      { name: "dexIndex",     type: "uint256" },
      { name: "tokenOut",     type: "address" },
      { name: "amountOutMin", type: "uint256" },
      { name: "to",           type: "address" },
      { name: "deadline",     type: "uint256" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
  {
    type: "function", name: "swapMetropolisExactInFromS", stateMutability: "payable",
    inputs: [
      { name: "dexIndex",     type: "uint256"   },
      { name: "amountOutMin", type: "uint256"   },
      { name: "binSteps",     type: "uint256[]" },
      { name: "versions",     type: "uint8[]"   },
      { name: "tokenPath",    type: "address[]" },
      { name: "to",           type: "address"   },
      { name: "deadline",     type: "uint256"   },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
  {
    type: "function", name: "swapMetropolisExactInForS", stateMutability: "nonpayable",
    inputs: [
      { name: "dexIndex",     type: "uint256"   },
      { name: "tokenIn",      type: "address"   },
      { name: "amountIn",     type: "uint256"   },
      { name: "amountOutMin", type: "uint256"   },
      { name: "binSteps",     type: "uint256[]" },
      { name: "versions",     type: "uint8[]"   },
      { name: "tokenPath",    type: "address[]" },
      { name: "to",           type: "address"   },
      { name: "deadline",     type: "uint256"   },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
  {
    type: "event", name: "Swapped",
    inputs: [
      { indexed: true,  name: "sender",    type: "address" },
      { indexed: true,  name: "tokenIn",   type: "address" },
      { indexed: true,  name: "tokenOut",  type: "address" },
      { indexed: false, name: "amountIn",  type: "uint256" },
      { indexed: false, name: "amountOut", type: "uint256" },
      { indexed: false, name: "dexUsed",   type: "string"  },
    ],
  },
];

// Quoter ABIs (called off-chain by the frontend)
export const SPOOKY_V3_QUOTER_ABI = [{
  type: "function", name: "quoteExactInputSingle", stateMutability: "nonpayable",
  inputs: [{
    name: "params", type: "tuple",
    components: [
      { name: "tokenIn",           type: "address" },
      { name: "tokenOut",          type: "address" },
      { name: "amountIn",          type: "uint256" },
      { name: "fee",               type: "uint24"  },
      { name: "sqrtPriceLimitX96", type: "uint160" },
    ],
  }],
  outputs: [
    { name: "amountOut",                  type: "uint256" },
    { name: "sqrtPriceX96After",          type: "uint160" },
    { name: "initializedTicksCrossed",    type: "uint32"  },
    { name: "gasEstimate",                type: "uint256" },
  ],
}];

export const SWAPX_ALGEBRA_QUOTER_ABI = [{
  type: "function", name: "quoteExactInputSingle", stateMutability: "nonpayable",
  inputs: [{
    name: "params", type: "tuple",
    components: [
      { name: "tokenIn",        type: "address" },
      { name: "tokenOut",       type: "address" },
      { name: "amountIn",       type: "uint256" },
      { name: "limitSqrtPrice", type: "uint160" },
    ],
  }],
  outputs: [
    { name: "amountOut",                 type: "uint256" },
    { name: "fee",                       type: "uint16"  },
    { name: "sqrtPriceX96After",         type: "uint160" },
    { name: "initializedTicksCrossed",   type: "int32"   },
    { name: "gasEstimate",               type: "uint256" },
  ],
}];

export const METROPOLIS_LB_QUOTER_ABI = [{
  type: "function", name: "findBestPathFromAmountIn", stateMutability: "view",
  inputs: [
    { name: "route",     type: "address[]" },
    { name: "amountIn",  type: "uint128"   },
  ],
  outputs: [{
    name: "quote", type: "tuple",
    components: [
      { name: "route",                          type: "address[]" },
      { name: "pairs",                          type: "address[]" },
      { name: "binSteps",                       type: "uint256[]" },
      { name: "versions",                       type: "uint8[]"   },
      { name: "amounts",                        type: "uint128[]" },
      { name: "virtualAmountsWithoutSlippage",  type: "uint128[]" },
      { name: "fees",                           type: "uint256[]" },
    ],
  }],
}];

export const ERC20_ABI = [
  { type: "function", name: "allowance", stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "balanceOf", stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "decimals", stateMutability: "view",
    inputs: [], outputs: [{ name: "", type: "uint8" }] },
];
