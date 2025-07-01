// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/CampusCoin.sol";
import "../src/MockUSDC.sol";
import "../src/SimpleDEX.sol";

contract SimpleDEXTest is Test {
    CampusCoin public campusCoin;
    MockUSDC public usdc;
    SimpleDEX public dex;
    
    address public owner;
    address public alice;
    address public bob;
    
    uint256 public constant CAMP_AMOUNT = 1000 * 10**18; // 1000 CAMP
    uint256 public constant USDC_AMOUNT = 2000 * 10**6;  // 2000 USDC
    
    function setUp() public {
        owner = address(this);
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        
        // Deploy contracts
        campusCoin = new CampusCoin();
        usdc = new MockUSDC();
        dex = new SimpleDEX(address(campusCoin), address(usdc));
        
        // Setup balances
        campusCoin.mint(alice, 10_000 * 10**18);
        campusCoin.mint(bob, 5_000 * 10**18);
        
        usdc.mint(alice, 20_000 * 10**6);
        usdc.mint(bob, 10_000 * 10**6);
        
        // Approve DEX
        vm.prank(alice);
        campusCoin.approve(address(dex), type(uint256).max);
        vm.prank(alice);
        usdc.approve(address(dex), type(uint256).max);
        
        vm.prank(bob);
        campusCoin.approve(address(dex), type(uint256).max);
        vm.prank(bob);
        usdc.approve(address(dex), type(uint256).max);
    }
    
    function test_AddLiquidity() public {
        vm.prank(alice);
        uint256 liquidity = dex.addLiquidity(CAMP_AMOUNT, USDC_AMOUNT);
        
        // Check LP tokens minted
        assertGt(liquidity, 0);
        assertEq(dex.balanceOf(alice), liquidity);
        
        // Check reserves updated
        assertEq(dex.reserveA(), CAMP_AMOUNT);
        assertEq(dex.reserveB(), USDC_AMOUNT);
        
        // Check tokens transferred
        assertEq(campusCoin.balanceOf(address(dex)), CAMP_AMOUNT);
        assertEq(usdc.balanceOf(address(dex)), USDC_AMOUNT);
    }
    
    function test_RemoveLiquidity() public {
        // Add liquidity first
        vm.prank(alice);
        uint256 liquidity = dex.addLiquidity(CAMP_AMOUNT, USDC_AMOUNT);
        
        // Remove half liquidity
        uint256 liquidityToRemove = liquidity / 2;
        
        uint256 aliceCampBefore = campusCoin.balanceOf(alice);
        uint256 aliceUsdcBefore = usdc.balanceOf(alice);
        
        vm.prank(alice);
        (uint256 amountA, uint256 amountB) = dex.removeLiquidity(liquidityToRemove);
        
        // Check tokens returned
        assertGt(amountA, 0);
        assertGt(amountB, 0);
        assertEq(campusCoin.balanceOf(alice), aliceCampBefore + amountA);
        assertEq(usdc.balanceOf(alice), aliceUsdcBefore + amountB);
        
        // Check LP tokens burned
        assertEq(dex.balanceOf(alice), liquidity - liquidityToRemove);
    }
    
    function test_SwapAforB() public {
        // Add liquidity first
        vm.prank(alice);
        dex.addLiquidity(CAMP_AMOUNT, USDC_AMOUNT);
        
        // Bob swaps CAMP for USDC
        uint256 swapAmount = 100 * 10**18; // 100 CAMP
        uint256 expectedOut = dex.getAmountOut(swapAmount, CAMP_AMOUNT, USDC_AMOUNT);
        
        uint256 bobUsdcBefore = usdc.balanceOf(bob);
        
        vm.prank(bob);
        dex.swapAforB(swapAmount, expectedOut);
        
        // Check USDC received
        assertEq(usdc.balanceOf(bob), bobUsdcBefore + expectedOut);
        
        // Check reserves updated
        assertEq(dex.reserveA(), CAMP_AMOUNT + swapAmount);
        assertEq(dex.reserveB(), USDC_AMOUNT - expectedOut);
    }
    
    function test_SwapBforA() public {
        // Add liquidity first
        vm.prank(alice);
        dex.addLiquidity(CAMP_AMOUNT, USDC_AMOUNT);
        
        // Bob swaps USDC for CAMP
        uint256 swapAmount = 200 * 10**6; // 200 USDC
        uint256 expectedOut = dex.getAmountOut(swapAmount, USDC_AMOUNT, CAMP_AMOUNT);
        
        uint256 bobCampBefore = campusCoin.balanceOf(bob);
        
        vm.prank(bob);
        dex.swapBforA(swapAmount, expectedOut);
        
        // Check CAMP received
        assertEq(campusCoin.balanceOf(bob), bobCampBefore + expectedOut);
        
        // Check reserves updated
        assertEq(dex.reserveB(), USDC_AMOUNT + swapAmount);
        assertEq(dex.reserveA(), CAMP_AMOUNT - expectedOut);
    }
    
    function test_GetPrice() public {
        vm.prank(alice);
        dex.addLiquidity(CAMP_AMOUNT, USDC_AMOUNT);
        
        uint256 price = dex.getPrice();
        // Price should be USDC/CAMP = 2000/1000 = 2 (dengan 18 decimals)
        uint256 expectedPrice = (USDC_AMOUNT * 1e18) / CAMP_AMOUNT;
        assertEq(price, expectedPrice);
    }
    
    function test_SlippageProtection() public {
        vm.prank(alice);
        dex.addLiquidity(CAMP_AMOUNT, USDC_AMOUNT);
        
        uint256 swapAmount = 100 * 10**18;
        uint256 expectedOut = dex.getAmountOut(swapAmount, CAMP_AMOUNT, USDC_AMOUNT);
        
        // Try with minimum output too high
        vm.prank(bob);
        vm.expectRevert("Slippage too high");
        dex.swapAforB(swapAmount, expectedOut + 1);
    }
    
    function test_GetPoolInfo() public {
        vm.prank(alice);
        uint256 liquidity = dex.addLiquidity(CAMP_AMOUNT, USDC_AMOUNT);
        
        (uint256 reserveA, uint256 reserveB, uint256 totalLiquidity, uint256 price) = dex.getPoolInfo();
        
        assertEq(reserveA, CAMP_AMOUNT);
        assertEq(reserveB, USDC_AMOUNT);
        assertEq(totalLiquidity, liquidity + dex.MINIMUM_LIQUIDITY());
        assertGt(price, 0);
    }
    
    function test_CompleteTradeScenario() public {
        console.log("=== Complete Trade Scenario Test ===");
        
        // Alice adds initial liquidity
        console.log("Alice adds liquidity: 1000 CAMP + 2000 USDC");
        vm.prank(alice);
        uint256 aliceLiquidity = dex.addLiquidity(CAMP_AMOUNT, USDC_AMOUNT);
        
        (uint256 reserveA1, uint256 reserveB1, , uint256 price1) = dex.getPoolInfo();
        console.log("Initial price (USDC per CAMP):", price1 / 1e18);
        console.log("Alice LP tokens:", aliceLiquidity);
        
        // Bob swaps CAMP for USDC
        uint256 bobSwapAmount = 50 * 10**18; // 50 CAMP
        uint256 expectedUsdc = dex.getAmountOut(bobSwapAmount, reserveA1, reserveB1);
        
        console.log("Bob swaps CAMP amount:", bobSwapAmount / 10**18);
        console.log("Expected USDC output:", expectedUsdc / 10**6);
        
        vm.prank(bob);
        dex.swapAforB(bobSwapAmount, expectedUsdc);
        
        (uint256 reserveA2, uint256 reserveB2, , uint256 price2) = dex.getPoolInfo();
        console.log("New price after swap:", price2 / 1e18);
        
        // When CAMP is sold for USDC, CAMP supply increases and USDC decreases
        // This makes CAMP cheaper (price should decrease), not more expensive
        console.log("Price change:", price2 < price1 ? "decreased" : "increased");
        
        // Bob swaps back USDC for CAMP
        uint256 usdcSwapAmount = 100 * 10**6; // 100 USDC
        uint256 expectedCamp = dex.getAmountOut(usdcSwapAmount, reserveB2, reserveA2);
        
        console.log("Bob swaps USDC amount:", usdcSwapAmount / 10**6);
        console.log("Expected CAMP output:", expectedCamp / 10**18);
        
        vm.prank(bob);
        dex.swapBforA(usdcSwapAmount, expectedCamp);
        
        (, , , uint256 price3) = dex.getPoolInfo();
        console.log("Final price:", price3 / 1e18);
        
        // Alice removes some liquidity
        uint256 liquidityToRemove = aliceLiquidity / 4; // 25%
        console.log("Alice removes 25% liquidity");
        
        vm.prank(alice);
        (uint256 campOut, uint256 usdcOut) = dex.removeLiquidity(liquidityToRemove);
        
        console.log("Alice receives CAMP:", campOut / 10**18);
        console.log("Alice receives USDC:", usdcOut / 10**6);
        
        assertGt(campOut, 0);
        assertGt(usdcOut, 0);
        
        console.log("=== Scenario completed successfully ===");
    }
    
    function testFuzz_SwapAmounts(uint256 swapAmount) public {
        // Add initial liquidity
        vm.prank(alice);
        dex.addLiquidity(CAMP_AMOUNT, USDC_AMOUNT);
        
        // Bound swap amount to reasonable range (1-100 CAMP)
        swapAmount = bound(swapAmount, 1 * 10**18, 100 * 10**18);
        
        uint256 expectedOut = dex.getAmountOut(swapAmount, CAMP_AMOUNT, USDC_AMOUNT);
        
        vm.prank(bob);
        dex.swapAforB(swapAmount, expectedOut);
        
        // Check that reserves are consistent
        assertGt(dex.reserveA(), CAMP_AMOUNT);
        assertLt(dex.reserveB(), USDC_AMOUNT);
    }
}