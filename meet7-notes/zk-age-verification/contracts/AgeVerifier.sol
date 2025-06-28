// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./verifier.sol"; // Generated dari circom

/**
 * @title AgeVerifier
 * @dev Smart contract untuk verifikasi umur menggunakan ZK proofs
 */
contract AgeVerifier {
    // Generated verifier contract
    Groth16Verifier public immutable verifier;
    
    // Verified commitments untuk prevent replay attacks
    mapping(uint256 => bool) public usedCommitments;
    
    // Verified addresses
    mapping(address => bool) public verifiedAdults;
    mapping(address => uint256) public verificationTimestamp;
    
    // Events
    event AgeVerified(
        address indexed user,
        uint256 commitment,
        bool isAdult,
        uint256 timestamp
    );
    
    event VerificationRevoked(
        address indexed user,
        uint256 timestamp
    );
    
    constructor(address _verifier) {
        verifier = Groth16Verifier(_verifier);
    }
    
    function verifyAge(
        uint[2] memory _pA,
        uint[2][2] memory _pB,
        uint[2] memory _pC,
        uint[2] memory _publicSignals  // Changed from uint[1] to uint[2]
    ) external {
        // Extract public signals
        uint256 isAdult = _publicSignals[0];      // First output: isAdult (0 or 1)
        uint256 commitment = _publicSignals[1];   // Second output: commitment
        
        // Check that isAdult is 1 (true)
        require(isAdult == 1, "Age verification failed: not adult");
        
        // Check commitment belum pernah digunakan
        require(!usedCommitments[commitment], "Commitment already used");
        
        // Verify ZK proof
        bool isValid = verifier.verifyProof(_pA, _pB, _pC, _publicSignals);
        require(isValid, "Invalid age proof");
        
        // Mark commitment as used
        usedCommitments[commitment] = true;
        
        // Mark user as verified adult
        verifiedAdults[msg.sender] = true;
        verificationTimestamp[msg.sender] = block.timestamp;
        
        emit AgeVerified(msg.sender, commitment, true, block.timestamp);
    }
    
    /**
     * @dev Check if address adalah verified adult
     */
    function isVerifiedAdult(address user) external view returns (bool) {
        return verifiedAdults[user];
    }
    
    /**
     * @dev Get verification timestamp
     */
    function getVerificationTime(address user) external view returns (uint256) {
        return verificationTimestamp[user];
    }
    
    /**
     * @dev Revoke verification (for testing purposes)
     */
    function revokeVerification() external {
        require(verifiedAdults[msg.sender], "Not verified");
        
        verifiedAdults[msg.sender] = false;
        verificationTimestamp[msg.sender] = 0;
        
        emit VerificationRevoked(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Batch check multiple addresses
     */
    function batchCheckVerification(address[] calldata users) 
        external 
        view 
        returns (bool[] memory results) 
    {
        results = new bool[](users.length);
        for (uint i = 0; i < users.length; i++) {
            results[i] = verifiedAdults[users[i]];
        }
    }
    
    /**
     * @dev Get commitment status
     */
    function isCommitmentUsed(uint256 commitment) external view returns (bool) {
        return usedCommitments[commitment];
    }
}