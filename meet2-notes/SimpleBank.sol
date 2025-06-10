// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library SafeMath {
    function add(uint a, uint b) internal pure returns(uint) {
        uint c = a + b;

        require(c >= a, "Overflow!!");

        return c;
    }
}

// interface

interface IBank {
    function getBalances(address user) external view returns(uint);
    function getTotalDeposit() external view returns(uint);
}

// inheritance

contract Ownable {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(owner == msg.sender, "Only Owner!");
        _;
    }
}

// main contract 

contract SimpleBank is Ownable {
    using SafeMath for uint;

    // storage
    mapping(address => uint) public balances;
    uint public totalDeposits;
    uint public lastSyncTotalOther;

    // events
    event Deposit(address indexed user, uint amount);
    event Withdraw(address indexed user, uint amount);


    // deposit (external payable)
    function deposit() external payable {
        require(msg.value > 0, "Balance must be not zero");

        balances[msg.sender] = balances[msg.sender].add(msg.value);
        totalDeposits = totalDeposits.add(msg.value);

        emit Deposit(msg.sender, msg.value);
    }


    // withdraw 
    function withdraw(uint _amount) external  {
        require(balances[msg.sender] >= _amount, "Insufficient Balances");

        balances[msg.sender] -= _amount;
        totalDeposits -= _amount;

        _sendMoney(msg.sender, _amount);
    }

    // _sendMoney (internal)
    function _sendMoney(address _to, uint _amount) internal {
        (bool success,) = _to.call{value: _amount}("");

        require(success, "Transfer Fail");
    }

    function showSelector() external pure returns(bytes4) {
        return bytes4(keccak256("_sendMoney(address,uint)"));
    }

    

    // getTotalDeposits
    function getTotalDeposit() external view returns(uint) {
        return totalDeposits;
    }
 

    // lastSyncFrom
    function lastSyncFrom(address _from) external onlyOwner {
        lastSyncTotalOther += IBank(_from).getTotalDeposit();
    }



    function testEncode() external pure returns(bytes memory){
        return abi.encodeWithSignature("_sendMoney(address,uint)", 0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db, 200);
    }

}