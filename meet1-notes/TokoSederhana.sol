// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract TokoSederhana {

    // storage , Memory, Call Data
    address public owner;
    uint256 public hargaBarang = 0;
    string public namaToko;
    bool public bukaToko;

    constructor() {
        owner = msg.sender;
        hargaBarang = 3000;
        namaToko = "Toko Blockdev";
        bukaToko = true;
    }

    function ubahHarga(uint256 _hargaBaru) public {
        hargaBarang = _hargaBaru;
    }

    function tutupTokoSelamanya() public {
        bukaToko = false;
    }
} 