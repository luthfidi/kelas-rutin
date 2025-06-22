// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StudentID
 * @dev NFT-based student identity card
 * Features:
 * - Auto-expiry after 4 years
 * - Renewable untuk active students
 * - Contains student metadata
 * - Non-transferable (soulbound)
 */
contract StudentID is ERC721, ERC721URIStorage, ERC721Burnable, Ownable {
    uint256 private _nextTokenId = 1;
    
    struct StudentData {
        string nim;
        string name;
        string major;
        uint256 enrollmentYear;
        uint256 expiryDate;
        bool isActive;
        uint8 semester;
    }
    
    // Mappings for student data
    mapping(uint256 => StudentData) public studentData;
    mapping(string => uint256) public nimToTokenId; // Prevent duplicate NIM
    mapping(address => uint256) public addressToTokenId; // One ID per address
    
    // Events
    event StudentIDIssued(
        uint256 indexed tokenId, 
        string nim, 
        address student,
        uint256 expiryDate
    );
    event StudentIDRenewed(uint256 indexed tokenId, uint256 newExpiryDate);
    event StudentStatusUpdated(uint256 indexed tokenId, bool isActive);
    event ExpiredIDBurned(uint256 indexed tokenId);

    constructor() ERC721("Student Identity Card", "SID") Ownable(msg.sender) {}

    /**
     * @dev Issue new student ID
     * Use case: New student enrollment
     */
    function issueStudentID(
        address to,
        string memory nim,
        string memory name,
        string memory major,
        string memory uri
    ) public onlyOwner {
        // Check NIM tidak duplicate
        require(nimToTokenId[nim] == 0, "NIM already exists");
        
        // Check address belum punya ID
        require(addressToTokenId[to] == 0, "Address already has an ID");
        
        uint256 tokenId = _nextTokenId++;
        
        // Calculate expiry (4 years from now)
        uint256 expiryDate = block.timestamp + (4 * 365 * 24 * 60 * 60);
        
        // Mint NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        // Store student data
        studentData[tokenId] = StudentData({
            nim: nim,
            name: name,
            major: major,
            enrollmentYear: block.timestamp,
            expiryDate: expiryDate,
            isActive: true,
            semester: 1
        });
        
        // Update mappings
        nimToTokenId[nim] = tokenId;
        addressToTokenId[to] = tokenId;
        
        emit StudentIDIssued(tokenId, nim, to, expiryDate);
    }
    
    /**
     * @dev Renew student ID untuk semester baru
     */
    function renewStudentID(uint256 tokenId) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(studentData[tokenId].isActive, "Student is not active");
        
        // Add 6 months to expiry
        studentData[tokenId].expiryDate += (6 * 30 * 24 * 60 * 60);
        studentData[tokenId].semester += 1;
        
        emit StudentIDRenewed(tokenId, studentData[tokenId].expiryDate);
    }
    
    /**
     * @dev Update student status (active/inactive)
     * Use case: Cuti, DO, atau lulus
     */
    function updateStudentStatus(uint256 tokenId, bool isActive) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        studentData[tokenId].isActive = isActive;
        emit StudentStatusUpdated(tokenId, isActive);
    }
    
    /**
     * @dev Burn expired IDs
     * Use case: Cleanup expired cards
     */
    function burnExpired(uint256 tokenId) public {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(block.timestamp > studentData[tokenId].expiryDate, "ID not expired yet");
        
        // Get data before burning
        string memory nim = studentData[tokenId].nim;
        address owner = ownerOf(tokenId);
        
        // Burn token first (this will also clear URI in ERC721URIStorage)
        _burn(tokenId);
        
        // Clean up our custom mappings after burning
        delete nimToTokenId[nim];
        delete addressToTokenId[owner];
        delete studentData[tokenId];
        
        emit ExpiredIDBurned(tokenId);
    }
    
    /**
     * @dev Check if ID is expired
     */
    function isExpired(uint256 tokenId) public view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return block.timestamp > studentData[tokenId].expiryDate;
    }
    
    /**
     * @dev Get student info by NIM
     */
    function getStudentByNIM(string memory nim) public view returns (
        address owner,
        uint256 tokenId,
        StudentData memory data
    ) {
        tokenId = nimToTokenId[nim];
        require(tokenId != 0, "NIM not found");
        
        owner = ownerOf(tokenId);
        data = studentData[tokenId];
    }

    /**
     * @dev Override _update to make non-transferable (soulbound)
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Only allow minting (from == address(0)) and burning (to == address(0))
        if (from != address(0) && to != address(0)) {
            revert("SID is non-transferable");
        }
        
        return super._update(to, tokenId, auth);
    }

    // Override functions required untuk multiple inheritance
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Get all student info by token ID
     */
    function getStudentInfo(uint256 tokenId) public view returns (
        StudentData memory data,
        address owner,
        bool expired
    ) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        data = studentData[tokenId];
        owner = ownerOf(tokenId);
        expired = isExpired(tokenId);
    }
}