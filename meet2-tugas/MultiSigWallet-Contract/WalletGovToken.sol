// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WalletGovToken is ERC20 {
    address walletContract;

    constructor(
        uint256 _totalSupply,
        address toMint
    ) ERC20("WalletGovToken", "WGT") {
        walletContract = msg.sender;
        super._mint(toMint, _totalSupply);
    }

    function transfer(
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        require(
            to != walletContract,
            "Cannot send funds to the wallet contract"
        );
        require(to != address(0), "Cannot send funds to zero address");
        return super.transfer(to, amount);
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        require(
            to != walletContract,
            "Cannot send funds to the wallet contract"
        );
        require(to != address(0), "Cannot send funds to zero address");
        return super.transferFrom(from, to, amount);
    }
}
