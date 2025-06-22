// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CampusCredit
 * @dev ERC-20 token untuk transaksi dalam kampus
 * Use cases:
 * - Pembayaran di kafetaria
 * - Biaya printing dan fotokopi
 * - Laundry service
 * - Peminjaman equipment
 */
contract CampusCredit is ERC20, ERC20Burnable, AccessControl {
    // Role definitions
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // Additional features untuk kampus
    mapping(address => uint256) public dailySpendingLimit;
    mapping(address => uint256) public spentToday;
    mapping(address => uint256) public lastSpendingReset;
    
    // Merchant whitelist
    mapping(address => bool) public isMerchant;
    mapping(address => string) public merchantName;
    
    // Cashback settings
    uint256 public cashbackPercentage = 2; // 2%
    
    // Events
    event MerchantRegistered(address indexed merchant, string name);
    event DailyLimitSet(address indexed student, uint256 limit);
    event CashbackPaid(address indexed student, uint256 amount);
    event SpendingLimitExceeded(address indexed student, uint256 attempted, uint256 remaining);

    constructor() ERC20("Campus Credit", "CREDIT") {
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        
        // Initial mint untuk treasury (1,000,000 tokens)
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    /**
     * @dev Mint new tokens
     * Use case: Top-up saldo mahasiswa
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @dev Register merchant
     * Use case: Kafetaria, toko buku, laundry
     */
    function registerMerchant(address merchant, string memory name) 
        public onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        isMerchant[merchant] = true;
        merchantName[merchant] = name;
        emit MerchantRegistered(merchant, name);
    }

    /**
     * @dev Set daily spending limit untuk mahasiswa
     * Use case: Parental control atau self-control
     */
    function setDailyLimit(address student, uint256 limit) 
        public onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        dailySpendingLimit[student] = limit;
        emit DailyLimitSet(student, limit);
    }

    /**
     * @dev Check and reset daily spending if new day
     */
    function _checkAndResetDaily(address user) internal {
        if (block.timestamp >= lastSpendingReset[user] + 1 days) {
            spentToday[user] = 0;
            lastSpendingReset[user] = block.timestamp;
        }
    }

    /**
     * @dev Transfer dengan spending limit check
     */
    function transferWithLimit(address to, uint256 amount) public returns (bool) {
        _checkAndResetDaily(msg.sender);
        
        uint256 limit = dailySpendingLimit[msg.sender];
        if (limit > 0) {
            require(spentToday[msg.sender] + amount <= limit, "Daily spending limit exceeded");
            spentToday[msg.sender] += amount;
        }
        
        return transfer(to, amount);
    }

    /**
     * @dev Transfer dengan cashback untuk merchant
     */
    function transferWithCashback(address merchant, uint256 amount) public returns (bool) {
        require(isMerchant[merchant], "Not a registered merchant");
        
        // Transfer to merchant
        _transfer(msg.sender, merchant, amount);
        
        // Calculate and mint cashback
        uint256 cashback = (amount * cashbackPercentage) / 100;
        if (cashback > 0) {
            _mint(msg.sender, cashback);
            emit CashbackPaid(msg.sender, cashback);
        }
        
        return true;
    }

    /**
     * @dev Get merchant info
     */
    function getMerchantInfo(address merchant) public view returns (bool isRegistered, string memory name) {
        return (isMerchant[merchant], merchantName[merchant]);
    }

    /**
     * @dev Get daily spending info
     */
    function getDailySpendingInfo(address user) public view returns (
        uint256 limit,
        uint256 spent,
        uint256 remaining,
        uint256 lastReset
    ) {
        limit = dailySpendingLimit[user];
        spent = spentToday[user];
        remaining = limit > spent ? limit - spent : 0;
        lastReset = lastSpendingReset[user];
    }
}