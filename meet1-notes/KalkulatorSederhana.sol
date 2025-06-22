// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract KalkulatorSederhana {
    // storage , Memory, Call Data
    address public owner;
    uint256 public hasil;
    uint256 public operationCount;

    constructor() {
        owner = msg.sender;
    }

    event test(uint256 indexed angka);

    modifier onlyOwner(uint256 angka){
        _; // continue  

        emit test(angka);
        require(owner == msg.sender, "Hanya owner yang menggunakan function ini");
    }

    function tambahPure(uint256 angka1, uint256 angka2) public pure returns(uint256) {
        return angka1 + angka2;
    }

    function lihatHasil() public view returns(uint256){
        return hasil;
    }

    function tambahDanSimpan(uint256 angka1, uint256 angka2) public onlyOwner(angka1) {
        hasil = angka1 + angka2;
        operationCount++;
    }

}