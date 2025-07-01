// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/AgeVerifier.sol";
import "../src/verifier.sol";

contract AgeVerifierTest is Test {
    AgeVerifier public ageVerifier;
    Groth16Verifier public verifier;
    
    // Test addresses
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);
    
    // Sample valid proof data (these would be generated from circom)
    // Note: These are dummy values for testing - real values would come from circom
    uint[2] public validProofA = [
        0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef,
        0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321
    ];
    
    uint[2][2] public validProofB = [
        [0x1111222233334444555566667777888899990000aaaabbbbccccddddeeee0000,
         0xffff0000ddddeeeebbbbcccc8888999955556666222233331111444400001111],
        [0xabcd1234efab5678cdab9012ef563456ab127890cd561234ab785678cd129012,
         0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba]
    ];
    
    uint[2] public validProofC = [
        0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef,
        0xcafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe
    ];
    
    // Valid public signals: [isAdult, commitment]
    uint[2] public validAdultSignals = [
        1, // isAdult = 1 (true)
        0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234 // commitment
    ];
    
    uint[2] public invalidNotAdultSignals = [
        0, // isAdult = 0 (false)
        0x987654321fedcba987654321fedcba987654321fedcba987654321fedcba9876 // commitment
    ];
    
    // Events to test
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
    
    function setUp() public {
        // Deploy verifier contract
        verifier = new Groth16Verifier();
        
        // Deploy age verifier contract
        ageVerifier = new AgeVerifier(address(verifier));
        
        // Label addresses for better trace
        vm.label(alice, "Alice");
        vm.label(bob, "Bob");
        vm.label(charlie, "Charlie");
        vm.label(address(ageVerifier), "AgeVerifier");
        vm.label(address(verifier), "Groth16Verifier");
    }
    
    // Test successful deployment
    function testDeployment() public view {
        assertEq(address(ageVerifier.verifier()), address(verifier));
        assertFalse(ageVerifier.isVerifiedAdult(alice));
        assertEq(ageVerifier.getVerificationTime(alice), 0);
    }
    
    // Test successful age verification (mocked)
    function testSuccessfulAgeVerification() public {
        vm.startPrank(alice);
        
        // Mock the verifier to return true
        vm.mockCall(
            address(verifier),
            abi.encodeWithSelector(
                Groth16Verifier.verifyProof.selector,
                validProofA,
                validProofB,
                validProofC,
                validAdultSignals
            ),
            abi.encode(true)
        );
        
        // Expect the AgeVerified event
        vm.expectEmit(true, false, false, true);
        emit AgeVerified(alice, validAdultSignals[1], true, block.timestamp);
        
        // Call verifyAge
        ageVerifier.verifyAge(
            validProofA,
            validProofB,
            validProofC,
            validAdultSignals
        );
        
        // Verify state changes
        assertTrue(ageVerifier.isVerifiedAdult(alice));
        assertEq(ageVerifier.getVerificationTime(alice), block.timestamp);
        assertTrue(ageVerifier.isCommitmentUsed(validAdultSignals[1]));
        assertTrue(ageVerifier.usedCommitments(validAdultSignals[1]));
        
        vm.stopPrank();
    }
    
    // Test failed verification when not adult
    function test_RevertWhen_NotAdult() public {
        vm.startPrank(alice);
        
        // Mock the verifier to return true (proof is valid but isAdult = 0)
        vm.mockCall(
            address(verifier),
            abi.encodeWithSelector(
                Groth16Verifier.verifyProof.selector,
                validProofA,
                validProofB,
                validProofC,
                invalidNotAdultSignals
            ),
            abi.encode(true)
        );
        
        // Should revert with "Age verification failed: not adult"
        vm.expectRevert("Age verification failed: not adult");
        ageVerifier.verifyAge(
            validProofA,
            validProofB,
            validProofC,
            invalidNotAdultSignals
        );
        
        vm.stopPrank();
    }
    
    // Test failed verification with invalid proof
    function test_RevertWhen_InvalidProof() public {
        vm.startPrank(alice);
        
        // Mock the verifier to return false
        vm.mockCall(
            address(verifier),
            abi.encodeWithSelector(
                Groth16Verifier.verifyProof.selector,
                validProofA,
                validProofB,
                validProofC,
                validAdultSignals
            ),
            abi.encode(false)
        );
        
        // Should revert with "Invalid age proof"
        vm.expectRevert("Invalid age proof");
        ageVerifier.verifyAge(
            validProofA,
            validProofB,
            validProofC,
            validAdultSignals
        );
        
        vm.stopPrank();
    }
    
    // Test commitment replay protection
    function testCommitmentReplayProtection() public {
        // First verification by Alice
        vm.startPrank(alice);
        
        vm.mockCall(
            address(verifier),
            abi.encodeWithSelector(
                Groth16Verifier.verifyProof.selector,
                validProofA,
                validProofB,
                validProofC,
                validAdultSignals
            ),
            abi.encode(true)
        );
        
        ageVerifier.verifyAge(
            validProofA,
            validProofB,
            validProofC,
            validAdultSignals
        );
        
        vm.stopPrank();
        
        // Try to use same commitment with Bob
        vm.startPrank(bob);
        
        vm.mockCall(
            address(verifier),
            abi.encodeWithSelector(
                Groth16Verifier.verifyProof.selector,
                validProofA,
                validProofB,
                validProofC,
                validAdultSignals
            ),
            abi.encode(true)
        );
        
        // Should revert with "Commitment already used"
        vm.expectRevert("Commitment already used");
        ageVerifier.verifyAge(
            validProofA,
            validProofB,
            validProofC,
            validAdultSignals
        );
        
        vm.stopPrank();
    }
    
    // Test revoke verification
    function testRevokeVerification() public {
        // First verify Alice
        vm.startPrank(alice);
        
        vm.mockCall(
            address(verifier),
            abi.encodeWithSelector(
                Groth16Verifier.verifyProof.selector,
                validProofA,
                validProofB,
                validProofC,
                validAdultSignals
            ),
            abi.encode(true)
        );
        
        ageVerifier.verifyAge(
            validProofA,
            validProofB,
            validProofC,
            validAdultSignals
        );
        
        assertTrue(ageVerifier.isVerifiedAdult(alice));
        
        // Expect VerificationRevoked event
        vm.expectEmit(true, false, false, true);
        emit VerificationRevoked(alice, block.timestamp);
        
        // Revoke verification
        ageVerifier.revokeVerification();
        
        // Check state
        assertFalse(ageVerifier.isVerifiedAdult(alice));
        assertEq(ageVerifier.getVerificationTime(alice), 0);
        
        vm.stopPrank();
    }
    
    // Test revoke verification when not verified
    function test_RevertWhen_NotVerified() public {
        vm.startPrank(alice);
        
        // Should revert with "Not verified"
        vm.expectRevert("Not verified");
        ageVerifier.revokeVerification();
        
        vm.stopPrank();
    }
    
    // Test batch check verification
    function testBatchCheckVerification() public {
        // Verify Alice
        vm.startPrank(alice);
        
        vm.mockCall(
            address(verifier),
            abi.encodeWithSelector(
                Groth16Verifier.verifyProof.selector,
                validProofA,
                validProofB,
                validProofC,
                validAdultSignals
            ),
            abi.encode(true)
        );
        
        ageVerifier.verifyAge(
            validProofA,
            validProofB,
            validProofC,
            validAdultSignals
        );
        
        vm.stopPrank();
        
        // Create address array
        address[] memory users = new address[](3);
        users[0] = alice;
        users[1] = bob;
        users[2] = charlie;
        
        // Check batch verification
        bool[] memory results = ageVerifier.batchCheckVerification(users);
        
        assertTrue(results[0]); // Alice is verified
        assertFalse(results[1]); // Bob is not verified
        assertFalse(results[2]); // Charlie is not verified
    }
    
    // Test multiple users verification with different commitments
    function testMultipleUsersVerification() public {
        uint[2] memory bobSignals = [
            1, // isAdult = 1
            0x987654321fedcba987654321fedcba987654321fedcba987654321fedcba9876 // different commitment
        ];
        
        // Verify Alice
        vm.startPrank(alice);
        
        vm.mockCall(
            address(verifier),
            abi.encodeWithSelector(
                Groth16Verifier.verifyProof.selector,
                validProofA,
                validProofB,
                validProofC,
                validAdultSignals
            ),
            abi.encode(true)
        );
        
        ageVerifier.verifyAge(
            validProofA,
            validProofB,
            validProofC,
            validAdultSignals
        );
        
        vm.stopPrank();
        
        // Verify Bob with different commitment
        vm.startPrank(bob);
        
        vm.mockCall(
            address(verifier),
            abi.encodeWithSelector(
                Groth16Verifier.verifyProof.selector,
                validProofA,
                validProofB,
                validProofC,
                bobSignals
            ),
            abi.encode(true)
        );
        
        ageVerifier.verifyAge(
            validProofA,
            validProofB,
            validProofC,
            bobSignals
        );
        
        vm.stopPrank();
        
        // Both should be verified
        assertTrue(ageVerifier.isVerifiedAdult(alice));
        assertTrue(ageVerifier.isVerifiedAdult(bob));
        assertFalse(ageVerifier.isVerifiedAdult(charlie));
        
        // Different commitments should be used
        assertTrue(ageVerifier.isCommitmentUsed(validAdultSignals[1]));
        assertTrue(ageVerifier.isCommitmentUsed(bobSignals[1]));
    }
    
    // Test edge cases and boundary conditions
    function testEdgeCases() public view {
        // Test with empty address array
        address[] memory emptyUsers = new address[](0);
        bool[] memory emptyResults = ageVerifier.batchCheckVerification(emptyUsers);
        assertEq(emptyResults.length, 0);
        
        // Test commitment status for unused commitment
        uint256 unusedCommitment = 0x1111111111111111111111111111111111111111111111111111111111111111;
        assertFalse(ageVerifier.isCommitmentUsed(unusedCommitment));
    }
    
    // Test gas consumption
    function testGasConsumption() public {
        vm.startPrank(alice);
        
        vm.mockCall(
            address(verifier),
            abi.encodeWithSelector(
                Groth16Verifier.verifyProof.selector,
                validProofA,
                validProofB,
                validProofC,
                validAdultSignals
            ),
            abi.encode(true)
        );
        
        uint256 gasBefore = gasleft();
        
        ageVerifier.verifyAge(
            validProofA,
            validProofB,
            validProofC,
            validAdultSignals
        );
        
        uint256 gasUsed = gasBefore - gasleft();
        console.log("Gas used for verifyAge:", gasUsed);
        
        // Gas should be reasonable (less than 200k for mocked version)
        assertLt(gasUsed, 200000);
        
        vm.stopPrank();
    }
    
    // Test time progression
    function testTimeProgression() public {
        vm.startPrank(alice);
        
        vm.mockCall(
            address(verifier),
            abi.encodeWithSelector(
                Groth16Verifier.verifyProof.selector,
                validProofA,
                validProofB,
                validProofC,
                validAdultSignals
            ),
            abi.encode(true)
        );
        
        uint256 initialTime = block.timestamp;
        
        ageVerifier.verifyAge(
            validProofA,
            validProofB,
            validProofC,
            validAdultSignals
        );
        
        assertEq(ageVerifier.getVerificationTime(alice), initialTime);
        
        // Move time forward
        vm.warp(block.timestamp + 1 days);
        
        // Verification time should remain the same
        assertEq(ageVerifier.getVerificationTime(alice), initialTime);
        
        vm.stopPrank();
    }
    
    // Fuzz test with random addresses
    function testFuzzRandomAddresses(address randomUser) public view {
        vm.assume(randomUser != address(0));
        
        // Initially should not be verified
        assertFalse(ageVerifier.isVerifiedAdult(randomUser));
        assertEq(ageVerifier.getVerificationTime(randomUser), 0);
    }
    
    // Fuzz test with random commitments
    function testFuzzRandomCommitments(uint256 randomCommitment) public view {
        // Initially should not be used
        assertFalse(ageVerifier.isCommitmentUsed(randomCommitment));
    }
}