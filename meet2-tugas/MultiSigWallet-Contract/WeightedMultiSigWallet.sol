// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./WalletGovToken.sol";

contract WeightedMultiSigWallet {
    using ECDSA for bytes32;

    event Executor(address executor);
    event ExecuteTransaction(
        address indexed owner,
        address payable to,
        uint256 value,
        bytes data,
        uint256 nonce,
        bytes32 hash,
        bytes result
    );

    uint256 public quorumPerMillion;
    uint256 public nonce;
    uint256 public chainId;

    mapping(address => bool) public executors;
    uint256 public executorCount = 1;

    WalletGovToken public govToken;
    uint256 public constant govTokenSupply = 1000000;

    modifier onlySelf() {
        require(msg.sender == address(this), "Not Self");
        _;
    }

    modifier onlyExecutors() {
        require(executors[msg.sender], "Not an executor");
        _;
    }

    receive() external payable {}

    constructor(uint256 _chainId, uint256 _quorumPerMillion) {
        require(
            _quorumPerMillion > 0,
            "constructor: must be non-zero sigs required"
        );
        quorumPerMillion = _quorumPerMillion;
        chainId = _chainId;
        govToken = new WalletGovToken(govTokenSupply, msg.sender);
        executors[msg.sender] = true;
        emit Executor(msg.sender);
    }

    /* 
        Proposal execution functions
    */

    function executeTransaction(
        address payable _receiver,
        uint256 _value,
        bytes memory _calldata,
        bytes[] memory signatures
    ) external onlyExecutors returns (bytes memory) {
        require(hasWeight(), "executeTransaction: only owners can execute");

        bytes32 _hash = getTransactionHash(nonce, _receiver, _value, _calldata);
        nonce++;
        uint256 totalWeight;
        address duplicateGuard;
        for (uint256 i = 0; i < signatures.length; i++) {
            address recovered = recover(_hash, signatures[i]);
            require(
                recovered > duplicateGuard,
                "executeTransaction: duplicate or unordered signatures"
            );
            duplicateGuard = recovered;

            totalWeight += govToken.balanceOf(recovered);
            if (totalWeight >= quorumPerMillion) break;
        }

        require(
            totalWeight >= quorumPerMillion,
            "executeTransaction: not enough valid signatures"
        );

        (bool success, bytes memory result) = _receiver.call{value: _value}(
            _calldata
        );
        require(success, "call failed");

        emit ExecuteTransaction(
            msg.sender,
            _receiver,
            _value,
            _calldata,
            nonce - 1,
            _hash,
            result
        );
        return result;
    }

    function getTransactionHash(
        uint256 _nonce,
        address to,
        uint256 value,
        bytes memory _calldata
    ) public view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    address(this),
                    chainId,
                    _nonce,
                    to,
                    value,
                    _calldata
                )
            );
    }

    function recover(
        bytes32 _hash,
        bytes memory _signature
    ) public pure returns (address) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash)).recover(_signature);
    }

    function hasWeight() public view returns (bool) {
        return govToken.balanceOf(msg.sender) > 0;
    }

    /* 
        Wallet inner settings
    */

    function updateQuorumPerMillion(
        uint256 newquorumPerMillion
    ) external onlySelf {
        require(
            newquorumPerMillion > 0,
            "updateQuorumPerMillion: must be non-zero sigs required"
        );
        quorumPerMillion = newquorumPerMillion;
    }

    function addExecutor(address newExecutor) external onlySelf {
        executors[newExecutor] = true;
        executorCount++;
        emit Executor(newExecutor);
    }

    function removeExecutor(address oldExecutor) external onlySelf {
        require(executorCount > 1, "Cannot remove the last executor.");
        executors[oldExecutor] = false;
        executorCount--;
    }
}
