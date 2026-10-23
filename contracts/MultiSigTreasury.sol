// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MultiSigTreasury
 * @dev 3-of-5 threshold multi-signature contract governing sensitive NGO disbursements and protocol upgrades.
 */
contract MultiSigTreasury is ReentrancyGuard {
    struct Transaction {
        address destination;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
    }

    address[] public signers;
    mapping(address => bool) public isSigner;
    uint256 public threshold;

    Transaction[] public transactions;
    // txIndex => signer => bool
    mapping(uint256 => mapping(address => bool)) public isConfirmed;

    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);
    event ThresholdChanged(uint256 newThreshold);
    event TransactionProposed(
        uint256 indexed txId,
        address indexed proposer,
        address indexed destination,
        uint256 value,
        bytes data
    );
    event TransactionConfirmed(uint256 indexed txId, address indexed signer, uint256 currentConfirmations);
    event ConfirmationRevoked(uint256 indexed txId, address indexed signer);
    event TransactionExecuted(uint256 indexed txId, address indexed executor);

    error NotSigner();
    error TxDoesNotExist(uint256 txId);
    error TxAlreadyExecuted(uint256 txId);
    error TxAlreadyConfirmed(uint256 txId);
    error TxNotConfirmed(uint256 txId);
    error InvalidThreshold();
    error InvalidSigners();
    error DuplicateSigner(address signer);
    error ExecutionFailed();

    modifier onlySigner() {
        if (!isSigner[msg.sender]) revert NotSigner();
        _;
    }

    modifier txExists(uint256 _txId) {
        if (_txId >= transactions.length) revert TxDoesNotExist(_txId);
        _;
    }

    modifier notExecuted(uint256 _txId) {
        if (transactions[_txId].executed) revert TxAlreadyExecuted(_txId);
        _;
    }

    modifier notConfirmed(uint256 _txId) {
        if (isConfirmed[_txId][msg.sender]) revert TxAlreadyConfirmed(_txId);
        _;
    }

    constructor(address[] memory _signers, uint256 _threshold) {
        if (_signers.length == 0) revert InvalidSigners();
        if (_threshold == 0 || _threshold > _signers.length) revert InvalidThreshold();

        for (uint256 i = 0; i < _signers.length; i++) {
            address s = _signers[i];
            if (s == address(0)) revert InvalidSigners();
            if (isSigner[s]) revert DuplicateSigner(s);

            isSigner[s] = true;
            signers.push(s);
            emit SignerAdded(s);
        }

        threshold = _threshold;
        emit ThresholdChanged(_threshold);
    }

    receive() external payable {}

    function proposeTransaction(
        address destination,
        uint256 value,
        bytes calldata data
    ) external onlySigner returns (uint256) {
        if (destination == address(0)) revert InvalidSigners();

        uint256 txId = transactions.length;
        transactions.push(
            Transaction({
                destination: destination,
                value: value,
                data: data,
                executed: false,
                confirmations: 0
            })
        );

        emit TransactionProposed(txId, msg.sender, destination, value, data);

        // Proposer automatically confirms
        _confirm(txId);

        return txId;
    }

    function confirmTransaction(uint256 txId)
        external
        onlySigner
        txExists(txId)
        notExecuted(txId)
        notConfirmed(txId)
    {
        _confirm(txId);
    }

    function _confirm(uint256 txId) internal {
        isConfirmed[txId][msg.sender] = true;
        transactions[txId].confirmations += 1;

        emit TransactionConfirmed(txId, msg.sender, transactions[txId].confirmations);

        if (transactions[txId].confirmations >= threshold) {
            executeTransaction(txId);
        }
    }

    function revokeConfirmation(uint256 txId)
        external
        onlySigner
        txExists(txId)
        notExecuted(txId)
    {
        if (!isConfirmed[txId][msg.sender]) revert TxNotConfirmed(txId);

        isConfirmed[txId][msg.sender] = false;
        transactions[txId].confirmations -= 1;

        emit ConfirmationRevoked(txId, msg.sender);
    }

    function executeTransaction(uint256 txId)
        public
        nonReentrant
        txExists(txId)
        notExecuted(txId)
    {
        Transaction storage txn = transactions[txId];
        require(txn.confirmations >= threshold, "Insufficient confirmations");

        txn.executed = true;

        (bool success, ) = txn.destination.call{value: txn.value}(txn.data);
        if (!success) revert ExecutionFailed();

        emit TransactionExecuted(txId, msg.sender);
    }

    // View Functions
    function getSigners() external view returns (address[] memory) {
        return signers;
    }

    function getTransactionCount() external view returns (uint256) {
        return transactions.length;
    }

    function getTransaction(uint256 txId)
        external
        view
        txExists(txId)
        returns (
            address destination,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 confirmations
        )
    {
        Transaction storage txn = transactions[txId];
        return (
            txn.destination,
            txn.value,
            txn.data,
            txn.executed,
            txn.confirmations
        );
    }
}
