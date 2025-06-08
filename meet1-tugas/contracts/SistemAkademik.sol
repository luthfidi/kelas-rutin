// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract SistemAkademik {
    struct Mahasiswa {
        string nama;
        uint256 nim;
        string jurusan;
        uint256[] nilai;
        bool isActive;
    }
    
    mapping(uint256 => Mahasiswa) public mahasiswa;
    mapping(address => bool) public authorized;
    uint256[] public daftarNIM;
    
    event MahasiswaEnrolled(uint256 nim, string nama);
    event NilaiAdded(uint256 nim, uint256 nilai);
    
    modifier onlyAuthorized() {
        require(authorized[msg.sender], "Tidak memiliki akses");
        _;
    }
    
    constructor() {
        authorized[msg.sender] = true;
    }
    
    // TODO: Implementasikan enrollment function
    function enrollMahasiswa(
        uint256 _nim,
        string memory _nama,
        string memory _jurusan
    ) public onlyAuthorized {
        require(_nim > 0, "NIM harus valid");
        require(bytes(_nama).length > 0, "Nama tidak boleh kosong");
        require(!mahasiswa[_nim].isActive, "Mahasiswa sudah terdaftar");
        
        mahasiswa[_nim] = Mahasiswa({
            nama: _nama,
            nim: _nim,
            jurusan: _jurusan,
            nilai: new uint256[](0),
            isActive: true
        });
        
        daftarNIM.push(_nim);
        emit MahasiswaEnrolled(_nim, _nama);
    }
    
    // TODO: Implementasikan add grade function
    function addGrade(uint256 _nim, uint256 _nilai) public onlyAuthorized {
        require(mahasiswa[_nim].isActive, "Mahasiswa tidak ditemukan");
        require(_nilai >= 0 && _nilai <= 100, "Nilai harus antara 0-100");
        
        mahasiswa[_nim].nilai.push(_nilai);
        emit NilaiAdded(_nim, _nilai);
    }
    
    // TODO: Implementasikan get student info function
    function getStudentInfo(uint256 _nim) public view returns (
        string memory nama,
        uint256 nim,
        string memory jurusan,
        uint256[] memory nilai,
        bool isActive
    ) {
        require(mahasiswa[_nim].isActive, "Mahasiswa tidak ditemukan");
        
        Mahasiswa memory mhs = mahasiswa[_nim];
        return (mhs.nama, mhs.nim, mhs.jurusan, mhs.nilai, mhs.isActive);
    }
    
    function getStudentGrades(uint256 _nim) public view returns (uint256[] memory) {
        require(mahasiswa[_nim].isActive, "Mahasiswa tidak ditemukan");
        return mahasiswa[_nim].nilai;
    }
    
    function calculateGPA(uint256 _nim) public view returns (uint256) {
        require(mahasiswa[_nim].isActive, "Mahasiswa tidak ditemukan");
        uint256[] memory grades = mahasiswa[_nim].nilai;
        require(grades.length > 0, "Belum ada nilai");
        
        uint256 total = 0;
        for (uint256 i = 0; i < grades.length; i++) {
            total += grades[i];
        }
        return total / grades.length;
    }
    
    function addAuthorizedUser(address _user) public onlyAuthorized {
        authorized[_user] = true;
    }
    
    function removeAuthorizedUser(address _user) public onlyAuthorized {
        require(_user != msg.sender, "Tidak bisa menghapus diri sendiri");
        authorized[_user] = false;
    }
    
    function getTotalStudents() public view returns (uint256) {
        return daftarNIM.length;
    }
    
    function getAllNIM() public view returns (uint256[] memory) {
        return daftarNIM;
    }
    
    function deactivateStudent(uint256 _nim) public onlyAuthorized {
        require(mahasiswa[_nim].isActive, "Mahasiswa tidak ditemukan");
        mahasiswa[_nim].isActive = false;
    }
}