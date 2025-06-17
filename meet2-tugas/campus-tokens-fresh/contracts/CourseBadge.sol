// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

/**
 * @title CourseBadge
 * @dev Multi-token untuk berbagai badges dan certificates
 * Token types:
 * - Course completion certificates (non-fungible)
 * - Event attendance badges (fungible)
 * - Achievement medals (limited supply)
 * - Workshop participation tokens
 */
contract CourseBadge is ERC1155, AccessControl, Pausable, ERC1155Supply {
    // Role definitions
    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Token ID ranges untuk organization
    uint256 public constant CERTIFICATE_BASE = 1000;
    uint256 public constant EVENT_BADGE_BASE = 2000;
    uint256 public constant ACHIEVEMENT_BASE = 3000;
    uint256 public constant WORKSHOP_BASE = 4000;
    
    // Token metadata structure
    struct TokenInfo {
        string name;
        string category;
        uint256 maxSupply;
        bool isTransferable;
        uint256 validUntil; // 0 = no expiry
        address issuer;
    }
    
    // Mappings
    mapping(uint256 => TokenInfo) public tokenInfo;
    mapping(uint256 => string) private _tokenURIs;
    
    // Track student achievements
    mapping(address => uint256[]) public studentBadges;
    mapping(uint256 => mapping(address => uint256)) public earnedAt; // Timestamp
    
    // Counter untuk generate unique IDs
    uint256 private _certificateCounter = 1;
    uint256 private _eventCounter = 1;
    uint256 private _achievementCounter = 1;
    uint256 private _workshopCounter = 1;

    // Events
    event TokenTypeCreated(uint256 indexed tokenId, string name, string category);
    event CertificateIssued(uint256 indexed tokenId, address indexed student);
    event EventBadgesMinted(uint256 indexed tokenId, address[] attendees);
    event AchievementGranted(uint256 indexed tokenId, address indexed student, uint256 rarity);

    constructor() ERC1155("") {
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(URI_SETTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    /**
     * @dev Create new certificate type
     * Use case: Mata kuliah baru atau program baru
     */
    function createCertificateType(
        string memory name,
        uint256 maxSupply,
        string memory tokenURI
    ) public onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = CERTIFICATE_BASE + _certificateCounter++;
        
        tokenInfo[tokenId] = TokenInfo({
            name: name,
            category: "Certificate",
            maxSupply: maxSupply,
            isTransferable: false, // Certificates are non-transferable
            validUntil: 0,
            issuer: msg.sender
        });
        
        _tokenURIs[tokenId] = tokenURI;
        
        emit TokenTypeCreated(tokenId, name, "Certificate");
        return tokenId;
    }

    /**
     * @dev Create event badge type
     */
    function createEventBadgeType(
        string memory name,
        uint256 maxSupply,
        string memory tokenURI
    ) public onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = EVENT_BADGE_BASE + _eventCounter++;
        
        tokenInfo[tokenId] = TokenInfo({
            name: name,
            category: "Event Badge",
            maxSupply: maxSupply,
            isTransferable: true, // Event badges can be transferred
            validUntil: 0,
            issuer: msg.sender
        });
        
        _tokenURIs[tokenId] = tokenURI;
        
        emit TokenTypeCreated(tokenId, name, "Event Badge");
        return tokenId;
    }

    /**
     * @dev Issue certificate to student
     * Use case: Student lulus mata kuliah
     */
    function issueCertificate(
        address student,
        uint256 certificateType
    ) public onlyRole(MINTER_ROLE) {
        require(tokenInfo[certificateType].issuer != address(0), "Certificate type does not exist");
        require(
            totalSupply(certificateType) < tokenInfo[certificateType].maxSupply || 
            tokenInfo[certificateType].maxSupply == 0,
            "Max supply reached"
        );
        
        _mint(student, certificateType, 1, "");
        earnedAt[certificateType][student] = block.timestamp;
        
        // Add to student's badge list
        studentBadges[student].push(certificateType);
        
        emit CertificateIssued(certificateType, student);
    }

    /**
     * @dev Batch mint event badges
     * Use case: Attendance badges untuk peserta event
     */
    function mintEventBadges(
        address[] memory attendees,
        uint256 eventId,
        uint256 amount
    ) public onlyRole(MINTER_ROLE) {
        require(tokenInfo[eventId].issuer != address(0), "Event badge type does not exist");
        
        for (uint256 i = 0; i < attendees.length; i++) {
            _mint(attendees[i], eventId, amount, "");
            earnedAt[eventId][attendees[i]] = block.timestamp;
            
            // Add to student's badge list if not already present
            bool alreadyHas = false;
            for (uint256 j = 0; j < studentBadges[attendees[i]].length; j++) {
                if (studentBadges[attendees[i]][j] == eventId) {
                    alreadyHas = true;
                    break;
                }
            }
            if (!alreadyHas) {
                studentBadges[attendees[i]].push(eventId);
            }
        }
        
        emit EventBadgesMinted(eventId, attendees);
    }

    /**
     * @dev Set metadata URI untuk token
     */
    function setTokenURI(uint256 tokenId, string memory newuri) 
        public onlyRole(URI_SETTER_ROLE) 
    {
        _tokenURIs[tokenId] = newuri;
    }

    /**
     * @dev Get all badges owned by student
     */
    function getStudentBadges(address student) 
        public view returns (uint256[] memory) 
    {
        return studentBadges[student];
    }

    /**
     * @dev Verify badge ownership dengan expiry check
     */
    function verifyBadge(address student, uint256 tokenId) 
        public view returns (bool isValid, uint256 earnedTimestamp) 
    {
        uint256 balance = balanceOf(student, tokenId);
        earnedTimestamp = earnedAt[tokenId][student];
        
        if (balance > 0 && earnedTimestamp > 0) {
            TokenInfo memory info = tokenInfo[tokenId];
            if (info.validUntil == 0 || block.timestamp <= info.validUntil) {
                isValid = true;
            }
        }
    }

    /**
     * @dev Pause all transfers
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Grant achievement badge
     * Use case: Dean's list, competition winner, etc
     */
    function grantAchievement(
        address student,
        string memory achievementName,
        uint256 rarity, // 1 = common, 2 = rare, 3 = legendary
        string memory tokenURI
    ) public onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = ACHIEVEMENT_BASE + _achievementCounter++;
        uint256 maxSupply;
        
        // Set max supply based on rarity
        if (rarity == 1) maxSupply = 1000; // Common
        else if (rarity == 2) maxSupply = 100; // Rare
        else if (rarity == 3) maxSupply = 10; // Legendary
        else revert("Invalid rarity level");
        
        tokenInfo[tokenId] = TokenInfo({
            name: achievementName,
            category: "Achievement",
            maxSupply: maxSupply,
            isTransferable: false, // Achievements are non-transferable
            validUntil: 0,
            issuer: msg.sender
        });
        
        _tokenURIs[tokenId] = tokenURI;
        _mint(student, tokenId, 1, "");
        earnedAt[tokenId][student] = block.timestamp;
        studentBadges[student].push(tokenId);
        
        emit TokenTypeCreated(tokenId, achievementName, "Achievement");
        emit AchievementGranted(tokenId, student, rarity);
        
        return tokenId;
    }

    /**
     * @dev Create workshop series dengan multiple sessions
     */
    function createWorkshopSeries(
        string memory seriesName,
        uint256 totalSessions
    ) public onlyRole(MINTER_ROLE) returns (uint256[] memory) {
        uint256[] memory sessionIds = new uint256[](totalSessions);
        
        for (uint256 i = 0; i < totalSessions; i++) {
            uint256 tokenId = WORKSHOP_BASE + _workshopCounter++;
            string memory sessionName = string(abi.encodePacked(seriesName, " - Session ", toString(i + 1)));
            
            tokenInfo[tokenId] = TokenInfo({
                name: sessionName,
                category: "Workshop",
                maxSupply: 0, // Unlimited
                isTransferable: true,
                validUntil: 0,
                issuer: msg.sender
            });
            
            sessionIds[i] = tokenId;
            emit TokenTypeCreated(tokenId, sessionName, "Workshop");
        }
        
        return sessionIds;
    }

    /**
     * @dev Override _update to check transferability and pause
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) whenNotPaused {
        // Check transferability for each token
        for (uint i = 0; i < ids.length; i++) {
            if (from != address(0) && to != address(0)) { // Not mint or burn
                require(tokenInfo[ids[i]].isTransferable, "Token not transferable");
            }
        }
        
        super._update(from, to, ids, values);
    }

    /**
     * @dev Override to return custom URI per token
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    /**
     * @dev Check interface support
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Helper function to convert uint to string
     */
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /**
     * @dev Get token information
     */
    function getTokenInfo(uint256 tokenId) public view returns (TokenInfo memory) {
        return tokenInfo[tokenId];
    }
}