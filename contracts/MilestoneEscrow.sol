// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ITrustDonateTreasury {
    function releaseToEscrow(uint256 ngoId, address token, uint256 amount, address destination) external;
}

/**
 * @title MilestoneEscrow
 * @dev Manages milestone proposals, multi-approval release conditions, and verifiable fund distribution.
 */
contract MilestoneEscrow is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum MilestoneStatus {
        PROPOSED,
        APPROVED,
        DISBURSED,
        CANCELLED
    }

    struct Milestone {
        bytes32 id;
        uint256 ngoId;
        uint256 projectId;
        string title;
        address token; // address(0) for native POL
        uint256 amount;
        address payable recipientWallet;
        string ipfsInvoiceCid;
        uint256 deadline;
        uint256 approvalCount;
        MilestoneStatus status;
        uint256 proposedAt;
        uint256 disbursedAt;
    }

    address public immutable treasury;
    address public multiSigGovernor;
    uint256 public requiredApprovals = 3;

    // Milestone ID => Milestone
    mapping(bytes32 => Milestone) private _milestones;

    // Milestone ID => Approver => hasApproved
    mapping(bytes32 => mapping(address => bool)) private _milestoneApprovals;

    // Approver whitelist (Signers / Trustees)
    mapping(address => bool) public isAuthorizedApprover;

    event MilestoneProposed(
        bytes32 indexed milestoneId,
        uint256 indexed ngoId,
        uint256 indexed projectId,
        string title,
        address token,
        uint256 amount,
        address recipientWallet,
        string ipfsInvoiceCid,
        uint256 deadline
    );

    event MilestoneApproved(
        bytes32 indexed milestoneId,
        address indexed approver,
        uint256 currentApprovals,
        uint256 requiredApprovals
    );

    event MilestoneFundsDisbursed(
        bytes32 indexed milestoneId,
        address indexed recipient,
        address token,
        uint256 amount,
        uint256 timestamp
    );

    event MilestoneCancelled(
        bytes32 indexed milestoneId,
        string reason,
        uint256 timestamp
    );

    event ApproverUpdated(address indexed approver, bool isAuthorized);
    event RequiredApprovalsUpdated(uint256 oldThreshold, uint256 newThreshold);
    event MultiSigGovernorUpdated(address indexed oldGovernor, address indexed newGovernor);

    error InvalidAddress();
    error ZeroAmount();
    error DeadlineInPast();
    error MilestoneNotFound();
    error MilestoneNotPending();
    error AlreadyApproved();
    error UnauthorizedCaller();
    error ThresholdNotReached(uint256 current, uint256 required);

    modifier onlyApprover() {
        if (!isAuthorizedApprover[msg.sender] && msg.sender != owner() && msg.sender != multiSigGovernor) {
            revert UnauthorizedCaller();
        }
        _;
    }

    constructor(
        address initialOwner,
        address _treasury,
        address _multiSigGovernor
    ) Ownable(initialOwner) {
        if (_treasury == address(0)) revert InvalidAddress();
        treasury = _treasury;
        multiSigGovernor = _multiSigGovernor;

        isAuthorizedApprover[initialOwner] = true;
    }

    function setMultiSigGovernor(address _governor) external onlyOwner {
        if (_governor == address(0)) revert InvalidAddress();
        address old = multiSigGovernor;
        multiSigGovernor = _governor;
        emit MultiSigGovernorUpdated(old, _governor);
    }

    function setApprover(address approver, bool authorized) external onlyOwner {
        if (approver == address(0)) revert InvalidAddress();
        isAuthorizedApprover[approver] = authorized;
        emit ApproverUpdated(approver, authorized);
    }

    function setRequiredApprovals(uint256 newThreshold) external onlyOwner {
        require(newThreshold >= 1, "Threshold must be >= 1");
        uint256 old = requiredApprovals;
        requiredApprovals = newThreshold;
        emit RequiredApprovalsUpdated(old, newThreshold);
    }

    /**
     * @notice Propose a new project milestone for multi-approval escrow allocation.
     */
    function proposeMilestone(
        uint256 ngoId,
        uint256 projectId,
        string calldata title,
        address token,
        uint256 amount,
        address payable recipientWallet,
        string calldata ipfsInvoiceCid,
        uint256 durationSeconds
    ) external whenNotPaused returns (bytes32) {
        if (recipientWallet == address(0)) revert InvalidAddress();
        if (amount == 0) revert ZeroAmount();

        uint256 deadline = block.timestamp + durationSeconds;
        bytes32 milestoneId = keccak256(
            abi.encodePacked(
                ngoId,
                projectId,
                token,
                amount,
                recipientWallet,
                ipfsInvoiceCid,
                block.timestamp,
                block.prevrandao
            )
        );

        _milestones[milestoneId] = Milestone({
            id: milestoneId,
            ngoId: ngoId,
            projectId: projectId,
            title: title,
            token: token,
            amount: amount,
            recipientWallet: recipientWallet,
            ipfsInvoiceCid: ipfsInvoiceCid,
            deadline: deadline,
            approvalCount: 0,
            status: MilestoneStatus.PROPOSED,
            proposedAt: block.timestamp,
            disbursedAt: 0
        });

        emit MilestoneProposed(
            milestoneId,
            ngoId,
            projectId,
            title,
            token,
            amount,
            recipientWallet,
            ipfsInvoiceCid,
            deadline
        );

        return milestoneId;
    }

    /**
     * @notice Authorize and sign off on milestone release verification.
     */
    function approveMilestone(bytes32 milestoneId) external onlyApprover whenNotPaused {
        Milestone storage m = _milestones[milestoneId];
        if (m.id == bytes32(0)) revert MilestoneNotFound();
        if (m.status != MilestoneStatus.PROPOSED && m.status != MilestoneStatus.APPROVED) {
            revert MilestoneNotPending();
        }
        if (_milestoneApprovals[milestoneId][msg.sender]) revert AlreadyApproved();

        _milestoneApprovals[milestoneId][msg.sender] = true;
        m.approvalCount += 1;

        if (m.approvalCount >= requiredApprovals) {
            m.status = MilestoneStatus.APPROVED;
        }

        emit MilestoneApproved(milestoneId, msg.sender, m.approvalCount, requiredApprovals);
    }

    /**
     * @notice Disburse funds once required approval threshold is reached.
     */
    function disburseMilestoneFunds(bytes32 milestoneId) external nonReentrant whenNotPaused {
        Milestone storage m = _milestones[milestoneId];
        if (m.id == bytes32(0)) revert MilestoneNotFound();
        if (m.status != MilestoneStatus.APPROVED && m.approvalCount < requiredApprovals) {
            revert ThresholdNotReached(m.approvalCount, requiredApprovals);
        }

        m.status = MilestoneStatus.DISBURSED;
        m.disbursedAt = block.timestamp;

        // Pull funds from Treasury to Escrow and disburse to verified recipient
        ITrustDonateTreasury(treasury).releaseToEscrow(
            m.ngoId,
            m.token,
            m.amount,
            address(this)
        );

        if (m.token == address(0)) {
            (bool success, ) = m.recipientWallet.call{value: m.amount}("");
            require(success, "POL transfer to recipient failed");
        } else {
            IERC20(m.token).safeTransfer(m.recipientWallet, m.amount);
        }

        emit MilestoneFundsDisbursed(
            milestoneId,
            m.recipientWallet,
            m.token,
            m.amount,
            block.timestamp
        );
    }

    /**
     * @notice Cancel a milestone before funds are disbursed.
     */
    function cancelMilestone(bytes32 milestoneId, string calldata reason) external onlyOwner {
        Milestone storage m = _milestones[milestoneId];
        if (m.id == bytes32(0)) revert MilestoneNotFound();
        if (m.status == MilestoneStatus.DISBURSED) revert MilestoneNotPending();

        m.status = MilestoneStatus.CANCELLED;
        emit MilestoneCancelled(milestoneId, reason, block.timestamp);
    }

    function getMilestone(bytes32 milestoneId) external view returns (Milestone memory) {
        if (_milestones[milestoneId].id == bytes32(0)) revert MilestoneNotFound();
        return _milestones[milestoneId];
    }

    function hasApproved(bytes32 milestoneId, address approver) external view returns (bool) {
        return _milestoneApprovals[milestoneId][approver];
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {}
}
