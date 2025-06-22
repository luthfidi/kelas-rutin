// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract PendaftaranSederhana {

    // struct
    struct Pendaftar {
        uint256 nomor;
        string nama;
        bool hadir;
        uint256 waktuDaftar;
        string jenisAcara;
    }

    // storage , Memory, Call Data
    address public owner;
    uint256 public jumlahPendaftar;
    uint256 public maxPendaftar;

    // mapping
    mapping(address => bool) public sudahDaftar;
    mapping(uint256 => Pendaftar) public dataPendaftaran;

    // array
    string[2] public jenisAcara = ["online", "offline"];

    // events
    event PendaftarBaru(address indexed pendaftar, string nama, uint256 nomor);
    event StatusKehadiran(uint256 indexed nomor, string nama, bool hadir);

    // modifier
    modifier onlyOwner(){
        require(owner == msg.sender, "Hanya owner yang bisa absen");
        _;
    }

    constructor(uint256 _maxPendaftar) {
        owner = msg.sender;
        maxPendaftar = _maxPendaftar;
    }

    // daftar
    function daftar(string memory _nama, uint256 _jenisAcara) public {
        require(bytes(_nama).length > 0, "Nama tidak boleh kosong");
        require(!sudahDaftar[msg.sender], "Peserta ini sudah daftar");

        if(jumlahPendaftar >= maxPendaftar){
            revert("Pendaftaran sudah penuh");
        } else {
            sudahDaftar[msg.sender] = true;
            jumlahPendaftar++; // 

            dataPendaftaran[jumlahPendaftar] = Pendaftar({
                nomor: jumlahPendaftar,
                nama: _nama,
                hadir: false,
                jenisAcara: jenisAcara[_jenisAcara],
                waktuDaftar: block.timestamp
            });

            emit PendaftarBaru(msg.sender, _nama, jumlahPendaftar);
        }
    }


    // hitung kehadiran (loop)
    function hitungKehadiran() public view returns(uint256) {
        uint256 hadir = 0;

        for(uint256 i = 1; i <= jumlahPendaftar; i++){
            continue ;
            if(dataPendaftaran[i].hadir == true){
                hadir++;
            }
        }

        return hadir;
    }

    // absen 

    function absenKehadiran(uint256 _nomor) public onlyOwner {
        require(_nomor > 0 && _nomor <= jumlahPendaftar, "Nomor tidak valid");

        dataPendaftaran[_nomor].hadir = true;

        emit StatusKehadiran(_nomor, dataPendaftaran[_nomor].nama, true);

    }
  
} 