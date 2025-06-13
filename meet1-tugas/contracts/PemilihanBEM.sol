// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract PemilihanBEM {
    struct Kandidat {
        string nama;
        string visi;
        uint256 suara;
    }
    
    Kandidat[] public kandidat;
    mapping(address => bool) public sudahMemilih;
    mapping(address => bool) public pemilihTerdaftar;
    
    uint256 public waktuMulai;
    uint256 public waktuSelesai;
    address public admin;
    
    event VoteCasted(address indexed voter, uint256 kandidatIndex);
    event KandidatAdded(string nama);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Hanya admin yang bisa akses");
        _;
    }
    
    modifier onlyDuringVoting() {
        require(
            block.timestamp >= waktuMulai && 
            block.timestamp <= waktuSelesai, 
            "Voting belum dimulai atau sudah selesai"
        );
        _;
    }
    
    constructor(uint256 _durasiVoting) {
        admin = msg.sender;
        waktuMulai = block.timestamp;
        waktuSelesai = waktuMulai + _durasiVoting;
        pemilihTerdaftar[msg.sender] = true;
    }
    
    // TODO: Implementasikan add candidate function
    function addKandidat(string memory _nama, string memory _visi) public onlyAdmin {
        kandidat.push(Kandidat({
            nama: _nama,
            visi: _visi,
            suara: 0
        }));
        emit KandidatAdded(_nama);
    }
    
    // TODO: Implementasikan vote function
    function vote(uint256 _kandidatIndex) public onlyDuringVoting {
        require(pemilihTerdaftar[msg.sender], "Anda tidak terdaftar sebagai pemilih");
        require(!sudahMemilih[msg.sender], "Anda sudah memilih");
        require(_kandidatIndex < kandidat.length, "Kandidat tidak valid");
        
        kandidat[_kandidatIndex].suara++;
        sudahMemilih[msg.sender] = true;
        emit VoteCasted(msg.sender, _kandidatIndex);
    }
    
    // TODO: Implementasikan get results function
    function getResults() public view returns (Kandidat[] memory) {
        return kandidat;
    }
    
    function registerVoter(address _voter) public onlyAdmin {
        pemilihTerdaftar[_voter] = true;
    }
    
    function getTotalKandidat() public view returns (uint256) {
        return kandidat.length;
    }
    
    function getWinner() public view returns (string memory nama, string memory visi, uint256 suara) {
        require(block.timestamp > waktuSelesai, "Voting belum selesai");
        require(kandidat.length > 0, "Tidak ada kandidat");
        
        uint256 maxSuara = 0;
        uint256 winnerIndex = 0;
        
        for (uint256 i = 0; i < kandidat.length; i++) {
            if (kandidat[i].suara > maxSuara) {
                maxSuara = kandidat[i].suara;
                winnerIndex = i;
            }
        }
        
        return (kandidat[winnerIndex].nama, kandidat[winnerIndex].visi, kandidat[winnerIndex].suara);
    }
}