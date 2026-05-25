// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/ISolidlyRouter.sol";
import "./interfaces/IUniV3SwapRouter.sol";
import "./interfaces/IAlgebraSwapRouter.sol";
import "./interfaces/IMetropolisLBRouter.sol";
import "./interfaces/IWETH.sol";

/**
 * @title SonicAggregatorRouter
 * @notice Multi-protocol DEX aggregator for Sonic chain.
 *         Supports UniV2, Solidly (ve(3,3)), UniV3, Algebra, and Metropolis DLMM.
 *         For V3/Algebra/DLMM: the frontend computes quotes off-chain and passes
 *         the encoded route to the appropriate execute function.
 */
contract SonicAggregatorRouter is Ownable {
    using SafeERC20 for IERC20;

    enum DexType { UniV2, Solidly, UniV3, Algebra, MetropolisDLMM }

    struct DexInfo {
        address router;
        string name;
        DexType dexType;
        bool active;
    }

    // On-chain quotable route (UniV2 + Solidly only)
    struct RouteResult {
        uint256 amountOut;
        address[] path;
        bool[] stableFlags;   // Solidly: stable flag per hop; empty for UniV2
        uint256 dexIndex;
        string dexName;
    }

    address public immutable WS;
    DexInfo[] public dexList;

    // ─────────────────────────────────────────────────────────────────────────
    // Protocol fee state
    // ─────────────────────────────────────────────────────────────────────────

    uint256 public protocolFeeBps;   // default 5 = 0.05%
    address public feeRecipient;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event Swapped(
        address indexed sender,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        string dexUsed
    );
    event DexAdded(uint256 indexed index, address router, string name, DexType dexType);
    event DexUpdated(uint256 indexed index, bool active);
    event ProtocolFeeUpdated(uint256 feeBps, address recipient);

    constructor(address _ws, address initialOwner) Ownable(initialOwner) {
        require(_ws != address(0), "zero wS");
        WS = _ws;
        protocolFeeBps = 5;
        feeRecipient = 0xc8cb96be6C26552a49232AbD93A1f0d3D2a76762;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin
    // ─────────────────────────────────────────────────────────────────────────

    function addDex(address router, string calldata name, DexType dexType) external onlyOwner {
        require(router != address(0), "zero router");
        dexList.push(DexInfo({ router: router, name: name, dexType: dexType, active: true }));
        emit DexAdded(dexList.length - 1, router, name, dexType);
    }

    function setDexActive(uint256 index, bool active) external onlyOwner {
        require(index < dexList.length, "out of bounds");
        dexList[index].active = active;
        emit DexUpdated(index, active);
    }

    function getDexCount() external view returns (uint256) { return dexList.length; }

    /// @notice Update protocol fee. Max 50 bps (0.5%). Zero recipient resets to owner.
    function setProtocolFee(uint256 bps, address recipient) external onlyOwner {
        require(bps <= 50, "fee too high");
        protocolFeeBps = bps;
        feeRecipient = recipient == address(0) ? owner() : recipient;
        emit ProtocolFeeUpdated(protocolFeeBps, feeRecipient);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal fee helpers
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Deduct protocol fee from an ERC20 amountIn. Returns amountInAfterFee.
    function _deductERC20Fee(address token, uint256 amountIn) internal returns (uint256 amountInAfterFee) {
        if (protocolFeeBps == 0) return amountIn;
        uint256 feeAmount = (amountIn * protocolFeeBps) / 10000;
        amountInAfterFee = amountIn - feeAmount;
        if (feeAmount > 0 && feeRecipient != address(0)) {
            IERC20(token).safeTransfer(feeRecipient, feeAmount);
        }
    }

    /// @dev Deduct protocol fee from a native/wS amount. Returns amountInAfterFee.
    ///      Assumes the wS has already been deposited and sits in this contract.
    ///      The fee is sent to feeRecipient as wS (ERC20).
    function _deductWSFee(uint256 amountIn) internal returns (uint256 amountInAfterFee) {
        if (protocolFeeBps == 0) return amountIn;
        uint256 feeAmount = (amountIn * protocolFeeBps) / 10000;
        amountInAfterFee = amountIn - feeAmount;
        if (feeAmount > 0 && feeRecipient != address(0)) {
            IERC20(WS).safeTransfer(feeRecipient, feeAmount);
        }
    }

    /// @dev Deduct protocol fee from native S msg.value before any wrapping.
    ///      Fee is forwarded as native S via call. Returns amountInAfterFee (in wei).
    function _deductNativeFee(uint256 amountIn) internal returns (uint256 amountInAfterFee) {
        if (protocolFeeBps == 0) return amountIn;
        uint256 feeAmount = (amountIn * protocolFeeBps) / 10000;
        amountInAfterFee = amountIn - feeAmount;
        if (feeAmount > 0 && feeRecipient != address(0)) {
            (bool ok,) = feeRecipient.call{value: feeAmount}("");
            require(ok, "fee transfer failed");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // On-chain quoting (UniV2 + Solidly only)
    // ─────────────────────────────────────────────────────────────────────────

    function _quoteUniV2(uint256 amountIn, address[] memory path, address router)
        internal view returns (uint256)
    {
        try IUniswapV2Router02(router).getAmountsOut(amountIn, path) returns (uint256[] memory a) {
            return a[a.length - 1];
        } catch { return 0; }
    }

    function _quoteSolidly(uint256 amountIn, address tokenIn, address tokenOut, address router, bool stable)
        internal view returns (uint256)
    {
        ISolidlyRouter.Route[] memory routes = new ISolidlyRouter.Route[](1);
        routes[0] = ISolidlyRouter.Route({ from: tokenIn, to: tokenOut, stable: stable });
        try ISolidlyRouter(router).getAmountsOut(amountIn, routes) returns (uint256[] memory a) {
            return a[a.length - 1];
        } catch { return 0; }
    }

    function _quoteSolidlyHop(uint256 amountIn, address tokenIn, address hop, address tokenOut, address router)
        internal view returns (uint256)
    {
        ISolidlyRouter.Route[] memory routes = new ISolidlyRouter.Route[](2);
        routes[0] = ISolidlyRouter.Route({ from: tokenIn, to: hop, stable: false });
        routes[1] = ISolidlyRouter.Route({ from: hop, to: tokenOut, stable: false });
        try ISolidlyRouter(router).getAmountsOut(amountIn, routes) returns (uint256[] memory a) {
            return a[a.length - 1];
        } catch { return 0; }
    }

    /// @notice Returns best on-chain-quotable route (UniV2 + Solidly DEXes only).
    function getBestRoute(uint256 amountIn, address tokenIn, address tokenOut)
        external view returns (RouteResult memory best)
    {
        return _findBestRoute(amountIn, tokenIn, tokenOut);
    }

    /// @notice Returns quotes from every active DEX that supports on-chain quoting.
    function getAllRoutes(uint256 amountIn, address tokenIn, address tokenOut)
        external view returns (RouteResult[] memory results, uint256 count)
    {
        // Max possible results: 2 paths per UniV2 DEX + 2 paths (vol+stable) per Solidly + hop variants
        results = new RouteResult[](dexList.length * 4);
        count = 0;

        for (uint256 d = 0; d < dexList.length; d++) {
            if (!dexList[d].active) continue;
            DexType dt = dexList[d].dexType;
            if (dt != DexType.UniV2 && dt != DexType.Solidly) continue;

            address router = dexList[d].router;

            if (dt == DexType.UniV2) {
                address[] memory path = new address[](2);
                path[0] = tokenIn; path[1] = tokenOut;
                uint256 out = _quoteUniV2(amountIn, path, router);
                if (out > 0) {
                    results[count++] = RouteResult({ amountOut: out, path: path, stableFlags: new bool[](0), dexIndex: d, dexName: dexList[d].name });
                }
                // hop via WS
                if (tokenIn != WS && tokenOut != WS) {
                    address[] memory hopPath = new address[](3);
                    hopPath[0] = tokenIn; hopPath[1] = WS; hopPath[2] = tokenOut;
                    uint256 hopOut = _quoteUniV2(amountIn, hopPath, router);
                    if (hopOut > 0) {
                        results[count++] = RouteResult({ amountOut: hopOut, path: hopPath, stableFlags: new bool[](0), dexIndex: d, dexName: string(abi.encodePacked(dexList[d].name, " (via wS)")) });
                    }
                }
            } else {
                // Solidly: volatile + stable direct
                for (uint8 s = 0; s < 2; s++) {
                    bool stable = s == 1;
                    uint256 out = _quoteSolidly(amountIn, tokenIn, tokenOut, router, stable);
                    if (out > 0) {
                        address[] memory path = new address[](2);
                        path[0] = tokenIn; path[1] = tokenOut;
                        bool[] memory flags = new bool[](1);
                        flags[0] = stable;
                        results[count++] = RouteResult({ amountOut: out, path: path, stableFlags: flags, dexIndex: d, dexName: string(abi.encodePacked(dexList[d].name, stable ? " (stable)" : " (volatile)")) });
                    }
                }
                // hop via WS (volatile)
                if (tokenIn != WS && tokenOut != WS) {
                    uint256 hopOut = _quoteSolidlyHop(amountIn, tokenIn, WS, tokenOut, router);
                    if (hopOut > 0) {
                        address[] memory path = new address[](3);
                        path[0] = tokenIn; path[1] = WS; path[2] = tokenOut;
                        bool[] memory flags = new bool[](2);
                        results[count++] = RouteResult({ amountOut: hopOut, path: path, stableFlags: flags, dexIndex: d, dexName: string(abi.encodePacked(dexList[d].name, " (via wS)")) });
                    }
                }
            }
        }
    }

    function _findBestRoute(uint256 amountIn, address tokenIn, address tokenOut)
        internal view returns (RouteResult memory best)
    {
        for (uint256 d = 0; d < dexList.length; d++) {
            if (!dexList[d].active) continue;
            DexType dt = dexList[d].dexType;
            if (dt != DexType.UniV2 && dt != DexType.Solidly) continue;

            address router = dexList[d].router;

            if (dt == DexType.UniV2) {
                address[] memory path = new address[](2);
                path[0] = tokenIn; path[1] = tokenOut;
                uint256 out = _quoteUniV2(amountIn, path, router);
                if (out > best.amountOut) best = RouteResult({ amountOut: out, path: path, stableFlags: new bool[](0), dexIndex: d, dexName: dexList[d].name });

                if (tokenIn != WS && tokenOut != WS) {
                    address[] memory hopPath = new address[](3);
                    hopPath[0] = tokenIn; hopPath[1] = WS; hopPath[2] = tokenOut;
                    uint256 hopOut = _quoteUniV2(amountIn, hopPath, router);
                    if (hopOut > best.amountOut) best = RouteResult({ amountOut: hopOut, path: hopPath, stableFlags: new bool[](0), dexIndex: d, dexName: dexList[d].name });
                }
            } else {
                for (uint8 s = 0; s < 2; s++) {
                    bool stable = s == 1;
                    uint256 out = _quoteSolidly(amountIn, tokenIn, tokenOut, router, stable);
                    if (out > best.amountOut) {
                        address[] memory path = new address[](2);
                        path[0] = tokenIn; path[1] = tokenOut;
                        bool[] memory flags = new bool[](1);
                        flags[0] = stable;
                        best = RouteResult({ amountOut: out, path: path, stableFlags: flags, dexIndex: d, dexName: dexList[d].name });
                    }
                }
                if (tokenIn != WS && tokenOut != WS) {
                    uint256 hopOut = _quoteSolidlyHop(amountIn, tokenIn, WS, tokenOut, router);
                    if (hopOut > best.amountOut) {
                        address[] memory path = new address[](3);
                        path[0] = tokenIn; path[1] = WS; path[2] = tokenOut;
                        bool[] memory flags = new bool[](2);
                        best = RouteResult({ amountOut: hopOut, path: path, stableFlags: flags, dexIndex: d, dexName: dexList[d].name });
                    }
                }
            }
        }
        require(best.amountOut > 0, "SonicAggregatorRouter: no route found");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal swap execution
    // ─────────────────────────────────────────────────────────────────────────

    function _executeSwap(RouteResult memory route, uint256 amountIn, uint256 amountOutMin, address tokenIn, address to, uint256 deadline)
        internal returns (uint256 amountOut)
    {
        address chosenRouter = dexList[route.dexIndex].router;
        IERC20(tokenIn).approve(chosenRouter, amountIn);

        if (dexList[route.dexIndex].dexType == DexType.UniV2) {
            uint256[] memory amounts = IUniswapV2Router02(chosenRouter).swapExactTokensForTokens(
                amountIn, amountOutMin, route.path, to, deadline
            );
            amountOut = amounts[amounts.length - 1];
        } else {
            ISolidlyRouter.Route[] memory routes = new ISolidlyRouter.Route[](route.path.length - 1);
            for (uint256 i = 0; i < routes.length; i++) {
                routes[i] = ISolidlyRouter.Route({ from: route.path[i], to: route.path[i + 1], stable: route.stableFlags[i] });
            }
            uint256[] memory amounts = ISolidlyRouter(chosenRouter).swapExactTokensForTokens(
                amountIn, amountOutMin, routes, to, deadline
            );
            amountOut = amounts[amounts.length - 1];
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Swap: token → token (UniV2 / Solidly — best route chosen on-chain)
    // ─────────────────────────────────────────────────────────────────────────

    function swapExactTokensForTokens(
        uint256 amountIn, uint256 amountOutMin,
        address tokenIn, address tokenOut,
        address to, uint256 deadline
    ) external returns (uint256 amountOut) {
        require(deadline >= block.timestamp && amountIn > 0 && to != address(0), "bad args");
        RouteResult memory route = _findBestRoute(amountIn, tokenIn, tokenOut);
        require(route.amountOut >= amountOutMin, "insufficient output");
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        uint256 amountInAfterFee = _deductERC20Fee(tokenIn, amountIn);
        amountOut = _executeSwap(route, amountInAfterFee, amountOutMin, tokenIn, to, deadline);
        emit Swapped(msg.sender, tokenIn, tokenOut, amountIn, amountOut, route.dexName);
    }

    function swapExactSForTokens(
        uint256 amountOutMin, address tokenOut, address to, uint256 deadline
    ) external payable returns (uint256 amountOut) {
        require(deadline >= block.timestamp && msg.value > 0 && to != address(0), "bad args");
        IWETH(WS).deposit{value: msg.value}();
        uint256 amountInAfterFee = _deductWSFee(msg.value);
        RouteResult memory route = _findBestRoute(amountInAfterFee, WS, tokenOut);
        require(route.amountOut >= amountOutMin, "insufficient output");
        amountOut = _executeSwap(route, amountInAfterFee, amountOutMin, WS, to, deadline);
        emit Swapped(msg.sender, address(0), tokenOut, msg.value, amountOut, route.dexName);
    }

    function swapExactTokensForS(
        uint256 amountIn, uint256 amountOutMin,
        address tokenIn, address to, uint256 deadline
    ) external returns (uint256 amountOut) {
        require(deadline >= block.timestamp && amountIn > 0 && to != address(0), "bad args");
        RouteResult memory route = _findBestRoute(amountIn, tokenIn, WS);
        require(route.amountOut >= amountOutMin, "insufficient output");
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        uint256 amountInAfterFee = _deductERC20Fee(tokenIn, amountIn);
        uint256 wsOut = _executeSwap(route, amountInAfterFee, amountOutMin, tokenIn, address(this), deadline);
        IWETH(WS).withdraw(wsOut);
        (bool ok,) = to.call{value: wsOut}("");
        require(ok, "S transfer failed");
        amountOut = wsOut;
        emit Swapped(msg.sender, tokenIn, address(0), amountIn, wsOut, route.dexName);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Swap: V3 / Algebra / DLMM — route pre-computed off-chain by frontend
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Execute a UniV3-style exactInputSingle swap (SpookySwap V3).
    function swapV3ExactInputSingle(
        uint256 dexIndex, address tokenIn, address tokenOut,
        uint24 fee, uint256 amountIn, uint256 amountOutMin,
        address to, uint256 deadline
    ) external returns (uint256 amountOut) {
        require(deadline >= block.timestamp && amountIn > 0 && to != address(0), "bad args");
        require(dexIndex < dexList.length && dexList[dexIndex].active, "bad dex");
        require(dexList[dexIndex].dexType == DexType.UniV3, "not UniV3");
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        uint256 amountInAfterFee = _deductERC20Fee(tokenIn, amountIn);
        IERC20(tokenIn).approve(dexList[dexIndex].router, amountInAfterFee);
        amountOut = IUniV3SwapRouter(dexList[dexIndex].router).exactInputSingle(
            IUniV3SwapRouter.ExactInputSingleParams({
                tokenIn: tokenIn, tokenOut: tokenOut, fee: fee,
                recipient: to, deadline: deadline,
                amountIn: amountInAfterFee, amountOutMinimum: amountOutMin, sqrtPriceLimitX96: 0
            })
        );
        emit Swapped(msg.sender, tokenIn, tokenOut, amountIn, amountOut, dexList[dexIndex].name);
    }

    /// @notice Execute an Algebra (SwapX) exactInputSingle swap.
    function swapAlgebraExactInputSingle(
        uint256 dexIndex, address tokenIn, address tokenOut,
        uint256 amountIn, uint256 amountOutMin,
        address to, uint256 deadline
    ) external returns (uint256 amountOut) {
        require(deadline >= block.timestamp && amountIn > 0 && to != address(0), "bad args");
        require(dexIndex < dexList.length && dexList[dexIndex].active, "bad dex");
        require(dexList[dexIndex].dexType == DexType.Algebra, "not Algebra");
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        uint256 amountInAfterFee = _deductERC20Fee(tokenIn, amountIn);
        IERC20(tokenIn).approve(dexList[dexIndex].router, amountInAfterFee);
        amountOut = IAlgebraSwapRouter(dexList[dexIndex].router).exactInputSingle(
            IAlgebraSwapRouter.ExactInputSingleParams({
                tokenIn: tokenIn, tokenOut: tokenOut,
                recipient: to, deadline: deadline,
                amountIn: amountInAfterFee, amountOutMinimum: amountOutMin, limitSqrtPrice: 0
            })
        );
        emit Swapped(msg.sender, tokenIn, tokenOut, amountIn, amountOut, dexList[dexIndex].name);
    }

    /// @notice Execute a Metropolis DLMM swap with a pre-computed path.
    function swapMetropolisExactIn(
        uint256 dexIndex,
        address tokenIn, address tokenOut,
        uint256 amountIn, uint256 amountOutMin,
        uint256[] calldata binSteps, uint8[] calldata versions, address[] calldata tokenPath,
        address to, uint256 deadline
    ) external returns (uint256 amountOut) {
        require(deadline >= block.timestamp && amountIn > 0 && to != address(0), "bad args");
        require(dexIndex < dexList.length && dexList[dexIndex].active, "bad dex");
        require(dexList[dexIndex].dexType == DexType.MetropolisDLMM, "not DLMM");
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        uint256 amountInAfterFee = _deductERC20Fee(tokenIn, amountIn);
        IERC20(tokenIn).approve(dexList[dexIndex].router, amountInAfterFee);

        IMetropolisLBRouter.Version[] memory vers = new IMetropolisLBRouter.Version[](versions.length);
        for (uint256 i = 0; i < versions.length; i++) vers[i] = IMetropolisLBRouter.Version(versions[i]);

        amountOut = IMetropolisLBRouter(dexList[dexIndex].router).swapExactTokensForTokens(
            amountInAfterFee, amountOutMin,
            IMetropolisLBRouter.Path({ pairBinSteps: binSteps, versions: vers, tokenPath: tokenPath }),
            to, deadline
        );
        emit Swapped(msg.sender, tokenIn, tokenOut, amountIn, amountOut, dexList[dexIndex].name);
    }

    /// @notice Wrap native S and swap via Algebra (SwapX).
    function swapAlgebraExactInputSingleFromS(
        uint256 dexIndex, address tokenOut,
        uint256 amountOutMin,
        address to, uint256 deadline
    ) external payable returns (uint256 amountOut) {
        require(deadline >= block.timestamp && msg.value > 0 && to != address(0), "bad args");
        require(dexIndex < dexList.length && dexList[dexIndex].active, "bad dex");
        require(dexList[dexIndex].dexType == DexType.Algebra, "not Algebra");
        IWETH(WS).deposit{value: msg.value}();
        uint256 amountInAfterFee = _deductWSFee(msg.value);
        IERC20(WS).approve(dexList[dexIndex].router, amountInAfterFee);
        amountOut = IAlgebraSwapRouter(dexList[dexIndex].router).exactInputSingle(
            IAlgebraSwapRouter.ExactInputSingleParams({
                tokenIn: WS, tokenOut: tokenOut,
                recipient: to, deadline: deadline,
                amountIn: amountInAfterFee, amountOutMinimum: amountOutMin, limitSqrtPrice: 0
            })
        );
        emit Swapped(msg.sender, address(0), tokenOut, msg.value, amountOut, dexList[dexIndex].name);
    }

    /// @notice Metropolis DLMM swap with native S in.
    function swapMetropolisExactInFromS(
        uint256 dexIndex,
        uint256 amountOutMin,
        uint256[] calldata binSteps, uint8[] calldata versions, address[] calldata tokenPath,
        address to, uint256 deadline
    ) external payable returns (uint256 amountOut) {
        require(deadline >= block.timestamp && msg.value > 0 && to != address(0), "bad args");
        require(dexIndex < dexList.length && dexList[dexIndex].active, "bad dex");
        require(dexList[dexIndex].dexType == DexType.MetropolisDLMM, "not DLMM");

        uint256 amountInAfterFee = _deductNativeFee(msg.value);

        IMetropolisLBRouter.Version[] memory vers = new IMetropolisLBRouter.Version[](versions.length);
        for (uint256 i = 0; i < versions.length; i++) vers[i] = IMetropolisLBRouter.Version(versions[i]);

        amountOut = IMetropolisLBRouter(dexList[dexIndex].router).swapExactNATIVEForTokens{value: amountInAfterFee}(
            amountOutMin,
            IMetropolisLBRouter.Path({ pairBinSteps: binSteps, versions: vers, tokenPath: tokenPath }),
            to, deadline
        );
        emit Swapped(msg.sender, address(0), tokenPath[tokenPath.length - 1], msg.value, amountOut, dexList[dexIndex].name);
    }

    /// @notice Metropolis DLMM swap with native S out.
    function swapMetropolisExactInForS(
        uint256 dexIndex,
        address tokenIn,
        uint256 amountIn, uint256 amountOutMin,
        uint256[] calldata binSteps, uint8[] calldata versions, address[] calldata tokenPath,
        address to, uint256 deadline
    ) external returns (uint256 amountOut) {
        require(deadline >= block.timestamp && amountIn > 0 && to != address(0), "bad args");
        require(dexIndex < dexList.length && dexList[dexIndex].active, "bad dex");
        require(dexList[dexIndex].dexType == DexType.MetropolisDLMM, "not DLMM");
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        uint256 amountInAfterFee = _deductERC20Fee(tokenIn, amountIn);
        IERC20(tokenIn).approve(dexList[dexIndex].router, amountInAfterFee);

        IMetropolisLBRouter.Version[] memory vers = new IMetropolisLBRouter.Version[](versions.length);
        for (uint256 i = 0; i < versions.length; i++) vers[i] = IMetropolisLBRouter.Version(versions[i]);

        amountOut = IMetropolisLBRouter(dexList[dexIndex].router).swapExactTokensForNATIVE(
            amountInAfterFee, amountOutMin,
            IMetropolisLBRouter.Path({ pairBinSteps: binSteps, versions: vers, tokenPath: tokenPath }),
            payable(to), deadline
        );
        emit Swapped(msg.sender, tokenIn, address(0), amountIn, amountOut, dexList[dexIndex].name);
    }

    /// @notice Wrap native S and swap via V3 (SpookySwap V3).
    function swapV3ExactInputSingleFromS(
        uint256 dexIndex, address tokenOut,
        uint24 fee, uint256 amountOutMin,
        address to, uint256 deadline
    ) external payable returns (uint256 amountOut) {
        require(deadline >= block.timestamp && msg.value > 0 && to != address(0), "bad args");
        require(dexIndex < dexList.length && dexList[dexIndex].active, "bad dex");
        require(dexList[dexIndex].dexType == DexType.UniV3, "not UniV3");
        IWETH(WS).deposit{value: msg.value}();
        uint256 amountInAfterFee = _deductWSFee(msg.value);
        IERC20(WS).approve(dexList[dexIndex].router, amountInAfterFee);
        amountOut = IUniV3SwapRouter(dexList[dexIndex].router).exactInputSingle(
            IUniV3SwapRouter.ExactInputSingleParams({
                tokenIn: WS, tokenOut: tokenOut, fee: fee,
                recipient: to, deadline: deadline,
                amountIn: amountInAfterFee, amountOutMinimum: amountOutMin, sqrtPriceLimitX96: 0
            })
        );
        emit Swapped(msg.sender, address(0), tokenOut, msg.value, amountOut, dexList[dexIndex].name);
    }

    receive() external payable {
        require(msg.sender == WS, "only wS");
    }
}
