// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @dev Mock UniswapV2 router that simulates swaps using constant-product AMM math.
contract MockUniswapV2Router {
    using SafeERC20 for IERC20;

    address public immutable factoryAddr;
    address public immutable wsAddr;

    constructor(address _factory, address _ws) {
        factoryAddr = _factory;
        wsAddr = _ws;
    }

    function factory() external view returns (address) {
        return factoryAddr;
    }

    function WETH() external view returns (address) {
        return wsAddr;
    }

    /// @dev Simple mock swap: pull amountIn, send ~amountIn (1:1 for test simplicity).
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 /*deadline*/
    ) external returns (uint256[] memory amounts) {
        require(path.length >= 2, "MockRouter: invalid path");

        // Pull input token
        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn);

        // Compute simple 0.3% fee output (simulate UniswapV2)
        uint256 amountOut = (amountIn * 997) / 1000;
        require(amountOut >= amountOutMin, "MockRouter: insufficient output");

        // Send output token
        IERC20(path[path.length - 1]).safeTransfer(to, amountOut);

        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint256 i = 1; i < path.length; i++) {
            amounts[i] = amountOut;
        }
    }

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 /*deadline*/
    ) external {
        require(path.length >= 2, "MockRouter: invalid path");

        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn);

        uint256 amountOut = (amountIn * 997) / 1000;
        require(amountOut >= amountOutMin, "MockRouter: insufficient output");

        IERC20(path[path.length - 1]).safeTransfer(to, amountOut);
    }

    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external
        pure
        returns (uint256[] memory amounts)
    {
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint256 i = 1; i < path.length; i++) {
            amounts[i] = (amounts[i - 1] * 997) / 1000;
        }
    }
}
