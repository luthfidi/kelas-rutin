// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../src/CampusCoin.sol";

contract CampusCoinTest is Test {
    CampusCoin public campusCoin;
    address public owner;
    address public user1;
    address public user2;
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        campusCoin = new CampusCoin();
    }
    
    function test_InitialState() public view {
        // Check basic properties
        assertEq(campusCoin.name(), "Campus Coin");
        assertEq(campusCoin.symbol(), "CAMP");
        assertEq(campusCoin.decimals(), 18);
        
        // Check initial supply
        uint256 expectedInitial = 100_000 * 10**18;
        assertEq(campusCoin.totalSupply(), expectedInitial);
        assertEq(campusCoin.balanceOf(owner), expectedInitial);
    }
    
    function test_Mint() public {
        uint256 mintAmount = 1000 * 10**18;
        
        campusCoin.mint(user1, mintAmount);
        
        assertEq(campusCoin.balanceOf(user1), mintAmount);
        assertEq(campusCoin.totalSupply(), 100_000 * 10**18 + mintAmount);
    }
    
    function test_MintFailsWhenNotOwner() public {
        vm.prank(user1);
        // Use the new custom error format from OpenZeppelin v5
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user1));
        campusCoin.mint(user2, 1000 * 10**18);
    }
    
    function test_MintFailsWhenExceedsMaxSupply() public {
        uint256 excessAmount = campusCoin.MAX_SUPPLY() - campusCoin.totalSupply() + 1;
        
        vm.expectRevert("Exceeds max supply");
        campusCoin.mint(user1, excessAmount);
    }
    
    function test_Burn() public {
        uint256 burnAmount = 1000 * 10**18;
        
        campusCoin.burn(burnAmount);
        
        assertEq(campusCoin.balanceOf(owner), 100_000 * 10**18 - burnAmount);
    }
    
    function test_RemainingSupply() public {
        uint256 expected = campusCoin.MAX_SUPPLY() - campusCoin.totalSupply();
        assertEq(campusCoin.remainingSupply(), expected);
        
        // After minting
        campusCoin.mint(user1, 1000 * 10**18);
        assertEq(campusCoin.remainingSupply(), expected - 1000 * 10**18);
    }
}