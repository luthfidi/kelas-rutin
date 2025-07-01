// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleDEX
 * @dev Mini DEX sederhana dengan AMM (Automated Market Maker)
 * Menggunakan formula x * y = k (constant product)
 */
contract SimpleDEX is ERC20, ReentrancyGuard, Ownable {
    // Token yang diperdagangkan
    IERC20 public immutable tokenA; // Campus Coin
    IERC20 public immutable tokenB; // Mock USDC
    
    // Reserves (cadangan token di pool)
    uint256 public reserveA;
    uint256 public reserveB;
    
    // Fee untuk setiap swap (0.3%)
    uint256 public constant FEE_PERCENT = 3;      // 0.3%
    uint256 public constant FEE_DENOMINATOR = 1000; // 100%
    
    // Minimum liquidity untuk mencegah division by zero
    uint256 public constant MINIMUM_LIQUIDITY = 10**3;
    
    // Events
    event LiquidityAdded(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    
    event LiquidityRemoved(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    
    event Swap(
        address indexed user,
        uint256 amountAIn,
        uint256 amountBIn,
        uint256 amountAOut,
        uint256 amountBOut
    );
    
    constructor(address _tokenA, address _tokenB) 
        ERC20("SimpleDEX LP", "SDEX-LP") 
        Ownable(msg.sender)
    {
        require(_tokenA != _tokenB, "Identical tokens");
        require(_tokenA != address(0) && _tokenB != address(0), "Zero address");
        
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }
    
    /**
     * @dev Tambah likuiditas ke pool
     * @param amountA Jumlah token A yang ingin ditambahkan
     * @param amountB Jumlah token B yang ingin ditambahkan
     * @return liquidity Jumlah LP token yang diterima
     */
    function addLiquidity(uint256 amountA, uint256 amountB) 
        external 
        nonReentrant 
        returns (uint256 liquidity) 
    {
        require(amountA > 0 && amountB > 0, "Amounts must be greater than 0");
        
        // Transfer token dari user
        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);
        
        uint256 totalLiquidity = totalSupply();
        
        if (totalLiquidity == 0) {
            // Pool pertama kali - set initial price
            liquidity = sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
            _mint(address(0xdead), MINIMUM_LIQUIDITY); // Lock minimum liquidity to dead address
        } else {
            // Pool sudah ada - maintain price ratio
            liquidity = min(
                (amountA * totalLiquidity) / reserveA,
                (amountB * totalLiquidity) / reserveB
            );
        }
        
        require(liquidity > 0, "Insufficient liquidity minted");
        
        // Mint LP token ke user
        _mint(msg.sender, liquidity);
        
        // Update reserves
        reserveA += amountA;
        reserveB += amountB;
        
        emit LiquidityAdded(msg.sender, amountA, amountB, liquidity);
    }
    
    /**
     * @dev Hapus likuiditas dari pool
     * @param liquidity Jumlah LP token yang ingin diburn
     * @return amountA Jumlah token A yang diterima
     * @return amountB Jumlah token B yang diterima
     */
    function removeLiquidity(uint256 liquidity) 
        external 
        nonReentrant 
        returns (uint256 amountA, uint256 amountB) 
    {
        require(liquidity > 0, "Liquidity must be greater than 0");
        require(balanceOf(msg.sender) >= liquidity, "Insufficient LP tokens");
        
        uint256 totalLiquidity = totalSupply();
        
        // Calculate token amounts berdasarkan proporsi
        amountA = (liquidity * reserveA) / totalLiquidity;
        amountB = (liquidity * reserveB) / totalLiquidity;
        
        require(amountA > 0 && amountB > 0, "Insufficient liquidity burned");
        
        // Burn LP tokens
        _burn(msg.sender, liquidity);
        
        // Transfer tokens ke user
        tokenA.transfer(msg.sender, amountA);
        tokenB.transfer(msg.sender, amountB);
        
        // Update reserves
        reserveA -= amountA;
        reserveB -= amountB;
        
        emit LiquidityRemoved(msg.sender, amountA, amountB, liquidity);
    }
    
    /**
     * @dev Swap token A untuk token B
     * @param amountAIn Jumlah token A yang diswap
     * @param minAmountBOut Minimum token B yang diharapkan (slippage protection)
     */
    function swapAforB(uint256 amountAIn, uint256 minAmountBOut) 
        external 
        nonReentrant 
    {
        require(amountAIn > 0, "Amount must be greater than 0");
        require(reserveA > 0 && reserveB > 0, "Insufficient liquidity");
        
        // Calculate output amount menggunakan formula AMM
        uint256 amountBOut = getAmountOut(amountAIn, reserveA, reserveB);
        require(amountBOut >= minAmountBOut, "Slippage too high");
        
        // Transfer input token dari user
        tokenA.transferFrom(msg.sender, address(this), amountAIn);
        
        // Transfer output token ke user
        tokenB.transfer(msg.sender, amountBOut);
        
        // Update reserves
        reserveA += amountAIn;
        reserveB -= amountBOut;
        
        emit Swap(msg.sender, amountAIn, 0, 0, amountBOut);
    }
    
    /**
     * @dev Swap token B untuk token A
     * @param amountBIn Jumlah token B yang diswap
     * @param minAmountAOut Minimum token A yang diharapkan
     */
    function swapBforA(uint256 amountBIn, uint256 minAmountAOut) 
        external 
        nonReentrant 
    {
        require(amountBIn > 0, "Amount must be greater than 0");
        require(reserveA > 0 && reserveB > 0, "Insufficient liquidity");
        
        // Calculate output amount
        uint256 amountAOut = getAmountOut(amountBIn, reserveB, reserveA);
        require(amountAOut >= minAmountAOut, "Slippage too high");
        
        // Transfer input token dari user
        tokenB.transferFrom(msg.sender, address(this), amountBIn);
        
        // Transfer output token ke user
        tokenA.transfer(msg.sender, amountAOut);
        
        // Update reserves
        reserveB += amountBIn;
        reserveA -= amountAOut;
        
        emit Swap(msg.sender, 0, amountBIn, amountAOut, 0);
    }
    
    /**
     * @dev Calculate output amount untuk swap (dengan fee)
     * @param amountIn Jumlah token input
     * @param reserveIn Reserve token input
     * @param reserveOut Reserve token output
     * @return amountOut Jumlah token output setelah fee
     */
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be greater than 0");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        // Apply fee (0.3%)
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_PERCENT);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;
        
        amountOut = numerator / denominator;
    }
    
    /**
     * @dev Get current price (token B per token A)
     */
    function getPrice() external view returns (uint256) {
        require(reserveA > 0, "No liquidity");
        // Price dengan 18 decimals untuk precision
        return (reserveB * 1e18) / reserveA;
    }
    
    /**
     * @dev Get pool info untuk UI
     */
    function getPoolInfo() external view returns (
        uint256 _reserveA,
        uint256 _reserveB,
        uint256 _totalLiquidity,
        uint256 _price
    ) {
        _reserveA = reserveA;
        _reserveB = reserveB;
        _totalLiquidity = totalSupply();
        _price = reserveA > 0 ? (reserveB * 1e18) / reserveA : 0;
    }
    
    // === UTILITY FUNCTIONS ===
    
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
    
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}