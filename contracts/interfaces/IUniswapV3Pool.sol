// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IUniswapV3Pool {
    function initialize(uint160 sqrtPriceX96) external;
}