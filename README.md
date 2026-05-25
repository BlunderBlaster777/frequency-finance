# SonicSwap Aggregator

DEX aggregator router DApp for the Sonic chain (Chain ID 146). Finds the best swap price across multiple UniswapV2-compatible DEXes and routes atomically in a single transaction.

## Architecture

```
sonicrouterv1/
├── contracts/
│   ├── SonicAggregatorRouter.sol   # Main aggregator router
│   ├── interfaces/                  # IUniswapV2Factory/Pair/Router02, IWETH
│   └── mocks/                       # Test doubles
├── scripts/deploy.js
├── test/SonicAggregatorRouter.test.js
├── hardhat.config.js
├── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── wagmiConfig.js            # Sonic chain + ConnectKit config
    │   ├── components/
    │   │   ├── SwapCard.jsx
    │   │   ├── TokenSelector.jsx
    │   │   ├── RouteDisplay.jsx
    │   │   └── SlippageSettings.jsx
    │   ├── hooks/
    │   │   ├── useQuote.js           # Debounced best-route query
    │   │   └── useSwap.js            # Approval + swap flow
    │   └── constants/tokens.js       # Token list, ABIs, addresses
    └── package.json
```

## Quick start

### 1. Install & compile contracts

```bash
npm install
npx hardhat compile
npx hardhat test
```

### 2. Deploy to Sonic mainnet

```bash
cp .env.example .env
# fill in PRIVATE_KEY in .env

npm run deploy:sonic
# saves deployment info to deployments/sonic.json
```

### 3. Run the frontend

```bash
cd frontend
npm install

# create frontend/.env
echo "VITE_WALLETCONNECT_PROJECT_ID=your_id_here" > .env
echo "VITE_ROUTER_ADDRESS=0xYourDeployedAddress" >> .env

npm run dev
```

## Contract: SonicAggregatorRouter

### Key functions

| Function | Description |
|---|---|
| `getBestRoute(amountIn, tokenIn, tokenOut)` | View — finds best DEX + path |
| `getAmountsOut(amountIn, path, dexIndex)` | View — amounts for a specific DEX |
| `swapExactTokensForTokens(...)` | Token → token, auto-picks best DEX |
| `swapExactSForTokens(...)` | Native S → token (wraps S → wS internally) |
| `swapExactTokensForS(...)` | Token → native S (unwraps wS internally) |
| `swapExactTokensForTokensSupportingFeeOnTransferTokens(...)` | Fee-on-transfer token support |
| `addDex(factory, router, name)` | Owner: register a new DEX |
| `removeDex(index)` | Owner: deactivate a DEX |
| `setMinLiquidityThreshold(threshold)` | Owner: set minimum reserve threshold |

### Routing logic

1. Checks direct path (tokenIn → tokenOut) on every active DEX
2. Checks 1-hop path via wS (tokenIn → wS → tokenOut) on every active DEX
3. Skips pools where the input-side reserve is below `minLiquidityThreshold` (default 10,000 × 10^18)
4. Returns the DEX + path that yields the highest output amount

### Known DEXes (Sonic mainnet)

| Name | Factory | Router |
|---|---|---|
| SwapX V2 | `0xeC46B1C2Ba28827Be61Aa1B4CAc2e9088fEdd0eb` | `0x76aCF069AF3d6E39cCDB6A21498e76B78dFC85bb` |
| Shadow Exchange | `0x2dA25E7446A70D7be65fd4c053948BEcAA6374c8` | `0x1D368773735ee1E678950B7A97bcA2CafB330CDc` |

### Chain constants

| | |
|---|---|
| Chain ID | 146 |
| RPC | https://rpc.soniclabs.com |
| Native token | S |
| wS address | `0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38` |
| Explorer | https://sonicscan.org |

## Frontend features

- Token selector with balance display (native S + ERC-20)
- Debounced quote fetching via `getBestRoute` on-chain read
- Route display: which DEX is used, swap path, price impact
- Slippage settings: 0.1% / 0.5% / 1% presets + custom
- Full approval flow before first swap
- ConnectKit wallet modal with custom dark theme
- Wrong network banner if not on Sonic
- Toast notifications for all transaction states
- MAX button with gas buffer for native S

## Notes

- The router contract does NOT hold funds — all swaps are atomic
- After deploying, set `VITE_ROUTER_ADDRESS` in `frontend/.env`
- Get a WalletConnect project ID at https://cloud.walletconnect.com
- Router addresses in `deploy.js` are best-effort — verify against official DEX docs before mainnet use
