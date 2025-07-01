// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CampusCoin
 * @dev Token sederhana untuk ekosistem kampus
 */
contract CampusCoin is ERC20, Ownable {
    // Total supply maksimum
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10**18; // 1 juta token
    
    // Event untuk tracking mint
    event TokensMinted(address indexed to, uint256 amount);
    
    constructor() ERC20("Campus Coin", "CAMP") Ownable(msg.sender) {
        // Mint initial supply ke deployer
        uint256 initialSupply = 100_000 * 10**18; // 100 ribu token
        _mint(msg.sender, initialSupply);
        
        emit TokensMinted(msg.sender, initialSupply);
    }
    
    /**
     * @dev Mint token baru (hanya owner)
     * @param to Address yang menerima token
     * @param amount Jumlah token yang dimint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev Burn token dari caller
     * @param amount Jumlah token yang diburn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    /**
     * @dev Cek sisa supply yang bisa dimint
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
}