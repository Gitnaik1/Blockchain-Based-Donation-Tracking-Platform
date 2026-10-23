// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title NgoRegistry
 * @dev Manages NGO identity records, verified treasury wallets, and regulatory compliance states on-chain.
 */
contract NgoRegistry is Ownable, Pausable {
    enum VerificationStatus {
        PENDING,
        ACTIVE,
        SUSPENDED,
        REVOKED
    }

    struct NgoRecord {
        uint256 id;
        string name;
        string category;
        address verifiedWallet;
        string legalRegNo;
        string ipfsKycCid;
        VerificationStatus status;
        uint256 registeredAt;
        uint256 updatedAt;
    }

    uint256 private _ngoIdCounter;
    mapping(uint256 => NgoRecord) private _ngos;
    mapping(address => uint256) private _walletToNgoId;

    event NgoRegistered(
        uint256 indexed ngoId,
        string name,
        string category,
        address indexed verifiedWallet,
        string legalRegNo,
        string ipfsKycCid,
        uint256 timestamp
    );

    event NgoStatusUpdated(
        uint256 indexed ngoId,
        VerificationStatus oldStatus,
        VerificationStatus newStatus,
        address indexed updatedBy,
        uint256 timestamp
    );

    event NgoWalletUpdated(
        uint256 indexed ngoId,
        address indexed oldWallet,
        address indexed newWallet,
        uint256 timestamp
    );

    event NgoMetadataUpdated(
        uint256 indexed ngoId,
        string newIpfsKycCid,
        uint256 timestamp
    );

    error InvalidAddress();
    error EmptyString();
    error NgoNotFound(uint256 ngoId);
    error WalletAlreadyRegistered(address wallet);
    error NgoNotActive(uint256 ngoId);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Registers a new NGO with pending status until compliance approval.
     */
    function registerNgo(
        string calldata name,
        string calldata category,
        address verifiedWallet,
        string calldata legalRegNo,
        string calldata ipfsKycCid
    ) external onlyOwner whenNotPaused returns (uint256) {
        if (verifiedWallet == address(0)) revert InvalidAddress();
        if (bytes(name).length == 0 || bytes(legalRegNo).length == 0) revert EmptyString();
        if (_walletToNgoId[verifiedWallet] != 0) revert WalletAlreadyRegistered(verifiedWallet);

        _ngoIdCounter++;
        uint256 newId = _ngoIdCounter;

        _ngos[newId] = NgoRecord({
            id: newId,
            name: name,
            category: category,
            verifiedWallet: verifiedWallet,
            legalRegNo: legalRegNo,
            ipfsKycCid: ipfsKycCid,
            status: VerificationStatus.ACTIVE,
            registeredAt: block.timestamp,
            updatedAt: block.timestamp
        });

        _walletToNgoId[verifiedWallet] = newId;

        emit NgoRegistered(
            newId,
            name,
            category,
            verifiedWallet,
            legalRegNo,
            ipfsKycCid,
            block.timestamp
        );

        return newId;
    }

    /**
     * @notice Updates the verification status of an NGO (Active, Suspended, Revoked).
     */
    function setNgoStatus(uint256 ngoId, VerificationStatus newStatus) external onlyOwner {
        if (_ngos[ngoId].id == 0) revert NgoNotFound(ngoId);

        VerificationStatus oldStatus = _ngos[ngoId].status;
        _ngos[ngoId].status = newStatus;
        _ngos[ngoId].updatedAt = block.timestamp;

        emit NgoStatusUpdated(ngoId, oldStatus, newStatus, msg.sender, block.timestamp);
    }

    /**
     * @notice Updates an NGO's verified operational wallet.
     */
    function updateNgoWallet(uint256 ngoId, address newWallet) external onlyOwner {
        if (_ngos[ngoId].id == 0) revert NgoNotFound(ngoId);
        if (newWallet == address(0)) revert InvalidAddress();
        if (_walletToNgoId[newWallet] != 0 && _walletToNgoId[newWallet] != ngoId) {
            revert WalletAlreadyRegistered(newWallet);
        }

        address oldWallet = _ngos[ngoId].verifiedWallet;
        delete _walletToNgoId[oldWallet];

        _ngos[ngoId].verifiedWallet = newWallet;
        _ngos[ngoId].updatedAt = block.timestamp;
        _walletToNgoId[newWallet] = ngoId;

        emit NgoWalletUpdated(ngoId, oldWallet, newWallet, block.timestamp);
    }

    /**
     * @notice Updates IPFS KYC metadata proof for annual audit reviews.
     */
    function updateNgoMetadata(uint256 ngoId, string calldata newIpfsKycCid) external onlyOwner {
        if (_ngos[ngoId].id == 0) revert NgoNotFound(ngoId);
        if (bytes(newIpfsKycCid).length == 0) revert EmptyString();

        _ngos[ngoId].ipfsKycCid = newIpfsKycCid;
        _ngos[ngoId].updatedAt = block.timestamp;

        emit NgoMetadataUpdated(ngoId, newIpfsKycCid, block.timestamp);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // View Functions
    function isNgoActive(uint256 ngoId) external view returns (bool) {
        return _ngos[ngoId].status == VerificationStatus.ACTIVE;
    }

    function getNgoDetails(uint256 ngoId) external view returns (NgoRecord memory) {
        if (_ngos[ngoId].id == 0) revert NgoNotFound(ngoId);
        return _ngos[ngoId];
    }

    function getNgoByWallet(address wallet) external view returns (NgoRecord memory) {
        uint256 id = _walletToNgoId[wallet];
        if (id == 0) revert NgoNotFound(0);
        return _ngos[id];
    }

    function totalNgos() external view returns (uint256) {
        return _ngoIdCounter;
    }
}
