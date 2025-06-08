// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract DigitalWalletKampus {
    mapping(address => uint256) public balances;
    address public admin;
    
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event Transfer(address indexed from, address indexed to, uint256 amount);
    
    constructor() {
        admin = msg.sender;
    }
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Hanya admin yang bisa mengakses");
        _;
    }
    
    function deposit() public payable {
        require(msg.value > 0, "Amount harus lebih dari 0");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
    
    // TODO: Implementasikan withdraw function
    function withdraw(uint256 _amount) public {
        require(_amount > 0, "Amount harus lebih dari 0");
        require(balances[msg.sender] >= _amount, "Saldo tidak mencukupi");
        
        balances[msg.sender] -= _amount;
        payable(msg.sender).transfer(_amount);
        emit Withdrawal(msg.sender, _amount);
    }
    
    // TODO: Implementasikan transfer function
    function transfer(address _to, uint256 _amount) public {
        require(_amount > 0, "Amount harus lebih dari 0");
        require(balances[msg.sender] >= _amount, "Saldo tidak mencukupi");
        require(_to != address(0), "Alamat tidak valid");
        
        balances[msg.sender] -= _amount;
        balances[_to] += _amount;
        emit Transfer(msg.sender, _to, _amount);
    }
    
    // TODO: Tambahkan access control
    function approveWithdrawal(address _user, uint256 _amount) public onlyAdmin {
        require(_amount > 0, "Amount harus lebih dari 0");
        require(balances[_user] >= _amount, "Saldo user tidak mencukupi");
        
        balances[_user] -= _amount;
        payable(_user).transfer(_amount);
        emit Withdrawal(_user, _amount);
    }
    
    function getBalance(address _user) public view returns (uint256) {
        return balances[_user];
    }
    
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}