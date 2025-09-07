// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@aave/core-v3/contracts/interfaces/IPool.sol";
import "@aave/core-v3/contracts/flashloan/interfaces/IFlashLoanSimpleReceiver.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IUniswapV2Pair {
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
}
interface IDEXRouter {
    function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts);
    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
}
contract FlashArbitrage is IFlashLoanSimpleReceiver {
    address constant AAVE_POOL = 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951;
    address constant USDT = 0x58Eb19eF91e8A6327FEd391b51aE1887b833cc91;
    address constant ETH = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
    address constant UNI_PAIR = 0x937B8c32E190FB69ca9FFAE6e6d8b083d3dE53A4;
    address constant DEX_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address owner;
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    constructor() {
        owner = msg.sender;
    }
    function ADDRESSES_PROVIDER() external pure returns (IPoolAddressesProvider) {
        return IPoolAddressesProvider(0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e);
    }
    function POOL() external pure returns (IPool) {
        return IPool(AAVE_POOL);
    }
    function execute(uint256 amount) external onlyOwner {
        IPool(AAVE_POOL).flashLoanSimple(
            address(this),
            USDT,
            amount,
            "",
            0
        );
    }
    function executeOperation(address asset, uint256 amount, uint256 premium, address initiator, bytes calldata params) external returns (bool) {
        require(msg.sender == AAVE_POOL);
        IERC20(USDT).transfer(UNI_PAIR, amount);
        (uint112 reserve0, uint112 reserve1,) = IUniswapV2Pair(UNI_PAIR).getReserves();
        uint256 amountOut = reserve0 - (reserve0 * reserve1) / (reserve1 + amount * 997/1000);
        IUniswapV2Pair(UNI_PAIR).swap(amountOut, 0, address(this), "");
        IERC20(ETH).transfer(DEX_ROUTER, amountOut);
        address[] memory path = new address[](2);
        path[0] = ETH;
        path[1] = USDT;
        IDEXRouter(DEX_ROUTER).swapExactTokensForTokens(amountOut, 0, path, address(this), block.timestamp);
        require(_getBalance(USDT) >= amount + premium);
        IERC20(USDT).transfer(AAVE_POOL, amount + premium);
        return true;
    }
    function _getBalance(address token) internal view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
    function withdraw(address token) external onlyOwner {
        uint256 balance = _getBalance(token);
        IERC20(token).transfer(owner, balance);
    }
}
