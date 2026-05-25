// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @dev Mock UniswapV2 factory that returns a pre-configured pair address.
contract MockUniswapV2Factory {
    // mapping tokenA => tokenB => pair (order-independent)
    mapping(address => mapping(address => address)) private pairs;

    constructor(address tokenA, address tokenB, address pair) {
        pairs[tokenA][tokenB] = pair;
        pairs[tokenB][tokenA] = pair;
    }

    function getPair(address tokenA, address tokenB) external view returns (address) {
        return pairs[tokenA][tokenB];
    }

    function setPair(address tokenA, address tokenB, address pair) external {
        pairs[tokenA][tokenB] = pair;
        pairs[tokenB][tokenA] = pair;
    }
}
