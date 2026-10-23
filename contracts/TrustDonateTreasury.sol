// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface INgoRegistry {
    function isNgoActive(uint256 ngoId) external view returns (bool);
    function getNgoDetails(uint256 ngoId) external view returns (
        uint256 id,
        string memory name,
        string memory category,
        address verifiedWallet,
        string memory legalRegNo,
        string memory ipfsKycCid,
        uint8 status,
        uint256 registeredAt,
        uint256 updatedAt
    );
}

/**
 * @title TrustDonateTreasury
 * @dev Non-custodial treasury contract that accepts native POL and approved ERC20 tokens for verified NGOs.
 */
contract TrustDonateTreasury is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct TokenConfig {
        bool isAllowed;
        uint8 decimals;
        string symbol;
    }

    address public immutable ngoRegistry;
    address public milestoneEscrow;

    // Token address => configuration (address(0) represents native POL)
    mapping(address => TokenConfig) public allowedTokens;

    // NGO ID => Token address => Total Raised
    mapping(uint256 => mapping(address => uint256)) public totalRaisedByNgo;

    // NGO ID => Token address => Available Balance for Escrow Allocation
    mapping(uint256 => mapping(address => uint256)) public availableBalanceByNgo;

    event DonationReceived(
        bytes32 indexed donationId,
        uint256 indexed ngoId,
        address indexed donor,
        address token,
        uint256 amountRaw,
        string taxReceiptNo,
        uint256 timestamp
    );

    event TokenAllowlistUpdated(
        address indexed token,
        bool isAllowed,
        uint8 decimals,
        string symbol
    );

    event MilestoneEscrowConfigured(
        address indexed oldEscrow,
        address indexed newEscrow
    );

    event FundsTransferredToEscrow(
        uint256 indexed ngoId,
        address indexed token,
        uint256 amount,
        address indexed escrow
    );

    error InvalidAddress();
    error ZeroAmount();
    error TokenNotAllowed(address token);
    error NgoNotVerified(uint256 ngoId);
    error InsufficientNgoBalance(uint256 requested, uint256 available);
    error UnauthorizedCaller();

    modifier onlyEscrow() {
        if (msg.sender != milestoneEscrow) revert UnauthorizedCaller();
        _;
    }

    constructor(address initialOwner, address _ngoRegistry) Ownable(initialOwner) {
        if (_ngoRegistry == address(0)) revert InvalidAddress();
        ngoRegistry = _ngoRegistry;

        // Native POL is always allowed by default
        allowedTokens[address(0)] = TokenConfig({
            isAllowed: true,
            decimals: 18,
            symbol: "POL"
        });

        emit TokenAllowlistUpdated(address(0), true, 18, "POL");
    }

    /**
     * @notice Configures the MilestoneEscrow contract permitted to withdraw allocated funds.
     */
    function setMilestoneEscrow(address _escrow) external onlyOwner {
        if (_escrow == address(0)) revert InvalidAddress();
        address old = milestoneEscrow;
        milestoneEscrow = _escrow;
        emit MilestoneEscrowConfigured(old, _escrow);
    }

    /**
     * @notice Configures or revokes an ERC-20 token on the treasury allowlist.
     */
    function setAllowedToken(
        address token,
        bool isAllowed,
        uint8 decimals,
        string calldata symbol
    ) external onlyOwner {
        if (token == address(0)) revert InvalidAddress();
        allowedTokens[token] = TokenConfig({
            isAllowed: isAllowed,
            decimals: decimals,
            symbol: symbol
        });

        emit TokenAllowlistUpdated(token, isAllowed, decimals, symbol);
    }

    /**
     * @notice Donate native POL to a verified NGO.
     */
    function donatePOL(uint256 ngoId, string calldata taxReceiptNo)
        external
        payable
        whenNotPaused
        nonReentrant
    {
        if (msg.value == 0) revert ZeroAmount();
        if (!INgoRegistry(ngoRegistry).isNgoActive(ngoId)) revert NgoNotVerified(ngoId);

        bytes32 donationId = keccak256(
            abi.encodePacked(
                block.timestamp,
                msg.sender,
                ngoId,
                address(0),
                msg.value,
                taxReceiptNo,
                block.prevrandao
            )
        );

        totalRaisedByNgo[ngoId][address(0)] += msg.value;
        availableBalanceByNgo[ngoId][address(0)] += msg.value;

        emit DonationReceived(
            donationId,
            ngoId,
            msg.sender,
            address(0),
            msg.value,
            taxReceiptNo,
            block.timestamp
        );
    }

    /**
     * @notice Donate approved ERC-20 tokens (such as USDC/USDT) to a verified NGO.
     * @dev Measures actual received token delta to safely handle any fee-on-transfer variations.
     */
    function donateERC20(
        uint256 ngoId,
        address token,
        uint256 amount,
        string calldata taxReceiptNo
    ) external whenNotPaused nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (!allowedTokens[token].isAllowed) revert TokenNotAllowed(token);
        if (!INgoRegistry(ngoRegistry).isNgoActive(ngoId)) revert NgoNotVerified(ngoId);

        uint256 balanceBefore = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        uint256 actualReceived = IERC20(token).balanceOf(address(this)) - balanceBefore;

        if (actualReceived == 0) revert ZeroAmount();

        bytes32 donationId = keccak256(
            abi.encodePacked(
                block.timestamp,
                msg.sender,
                ngoId,
                token,
                actualReceived,
                taxReceiptNo,
                block.prevrandao
            )
        );

        totalRaisedByNgo[ngoId][token] += actualReceived;
        availableBalanceByNgo[ngoId][token] += actualReceived;

        emit DonationReceived(
            donationId,
            ngoId,
            msg.sender,
            token,
            actualReceived,
            taxReceiptNo,
            block.timestamp
        );
    }

    /**
     * @notice Transfers available funds to the verified MilestoneEscrow contract.
     */
    function releaseToEscrow(
        uint256 ngoId,
        address token,
        uint256 amount,
        address destination
    ) external onlyEscrow nonReentrant {
        if (amount == 0) revert ZeroAmount();
        uint256 available = availableBalanceByNgo[ngoId][token];
        if (amount > available) revert InsufficientNgoBalance(amount, available);

        availableBalanceByNgo[ngoId][token] -= amount;

        if (token == address(0)) {
            (bool success, ) = destination.call{value: amount}("");
            require(success, "POL transfer failed");
        } else {
            IERC20(token).safeTransfer(destination, amount);
        }

        emit FundsTransferredToEscrow(ngoId, token, amount, destination);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {
        revert("Use donatePOL");
    }
}
