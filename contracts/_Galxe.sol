// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

struct Campaign {
    uint256 id; //unique number for each campaign.
    address brand; //  wallet address of the brand that created the campaign.
    address rewardToken;
    uint256 budget;
    uint256 endTime;
    bytes32 merkleRoot; // Root of the Merkle tree containing reward data
    uint256 totalAllocated; //total  budget the oracle has assigned to users.
    bool isActive;
}

contract Galxe {
    // Oracle Management
    address public oracle; // Address of the Node.js backend wallet
    address public owner; // Contract owner (can change oracle)

    // Modifiers
    modifier onlyOracle() {
        require(msg.sender == oracle, "Only oracle can call this function");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // Events
    event CampaignClosed(
        uint256 indexed campaignId,
        address indexed brand,
        uint256 timestamp
    );

    event ResultsPublished(
        uint256 indexed campaignId,
        bytes32 indexed merkleRoot,
        uint256 totalAllocated,
        uint256 timestamp
    );

    event RewardClaimed(
        uint256 indexed campaignId,
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );

    // State variables
    mapping(uint256 => Campaign) public campaigns;
    uint256 public campaignCount; // To generate unique IDs

    // Track which users have claimed rewards for each campaign
    // campaignId => user address => claimed (true/false)
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    // Constructor - sets the deployer as both owner and initial oracle
    constructor() {
        owner = msg.sender;
        oracle = msg.sender; // Initially, deployer is the oracle
    }

    // Function to change oracle address (only owner can do this)
    function setOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Oracle cannot be zero address");
        oracle = newOracle;
    }

    function createCampaign(
        address token,
        uint256 budget,
        uint256 endTime
    ) external payable {
        // 1. Input validation
        require(endTime > block.timestamp, "End time must be in the future");
        require(budget > 0, "Budget must be greater than zero");

        // 2. Increment campaign count for a new ID
        campaignCount++;
        uint256 newCampaignId = campaignCount;

        // 3. Create and store the new campaign
        campaigns[newCampaignId] = Campaign({
            id: newCampaignId,
            brand: msg.sender, // The address calling the function
            rewardToken: token,
            budget: budget,
            endTime: endTime,
            merkleRoot: bytes32(0), // No results published yet
            totalAllocated: 0, // Nothing allocated yet
            isActive: true
        });

        // 4. Transfer the budget from the brand to this contract
        // Assumes the brand has already approved the contract to spend 'budget' amount of 'token'
        // You'll need to add: import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
        IERC20(token).transferFrom(msg.sender, address(this), budget);
    }

    function closeCampaign(uint256 campaignId) external {
        require(campaigns[campaignId].id != 0, "Campaign does not exist");
        require(campaigns[campaignId].isActive, "Campaign is already closed");
        require(
            msg.sender == campaigns[campaignId].brand,
            "Only campaign creator can close"
        );

        // You need to get a reference to the campaign in storage (not memory)
        Campaign storage campaignToClose = campaigns[campaignId];
        campaignToClose.isActive = false;
        // Let the world know this campaign was closed
        emit CampaignClosed(campaignId, msg.sender, block.timestamp);
    }

    function publishResults(
        uint256 campaignId,
        bytes32 _merkleRoot,
        uint256 _totalAllocated
    ) external onlyOracle {
        // Get storage reference to the campaign
        Campaign storage campaign = campaigns[campaignId];

        // 1. Validation checks
        require(campaign.id != 0, "Campaign does not exist");
        require(campaign.isActive, "Campaign is not active");
        require(
            block.timestamp > campaign.endTime,
            "Campaign has not ended yet"
        );
        require(campaign.merkleRoot == bytes32(0), "Results already published");
        require(
            _totalAllocated <= campaign.budget,
            "Allocated amount exceeds budget"
        );
        require(_merkleRoot != bytes32(0), "Merkle root cannot be empty");

        // 2. Update campaign with results
        campaign.merkleRoot = _merkleRoot;
        campaign.totalAllocated = _totalAllocated;

        // Optional: Mark campaign as inactive since results are now published
        campaign.isActive = false;

        // 3. Emit event for off-chain tracking
        emit ResultsPublished(
            campaignId,
            _merkleRoot,
            _totalAllocated,
            block.timestamp
        );
    }

    function claimReward(
        uint256 campaignId,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external {
        // Get storage reference to the campaign
        Campaign storage campaign = campaigns[campaignId];

        require(campaign.id != 0, "Campaign does not exist");
        require(campaign.merkleRoot != bytes32(0), "Results not published yet");
        require(!hasClaimed[campaignId][msg.sender], "Reward already claimed");
        require(amount > 0, "Amount must be greater than zero");

        // 2. Create the leaf node for this user's claim
        // This must match exactly how the Merkle tree was created in the backend
        bytes32 leaf = keccak256(
            abi.encodePacked(
                msg.sender, // User's address
                amount // Amount they're claiming
            )
        );

        // 3. Verify the Merkle proof
        require(
            MerkleProof.verify(merkleProof, campaign.merkleRoot, leaf),
            "Invalid Merkle proof"
        );

        // 4. Mark as claimed to prevent double-claiming
        hasClaimed[campaignId][msg.sender] = true;

        // 5. Transfer the reward tokens to the user
        IERC20(campaign.rewardToken).transfer(msg.sender, amount);

        // 6. Emit event for off-chain tracking
        emit RewardClaimed(campaignId, msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Returns comprehensive campaign details
     * @param campaignId The ID of the campaign to retrieve
     * @return id Campaign ID
     * @return brand Address of the brand that created the campaign
     * @return rewardToken Address of the token used for rewards
     * @return budget Total budget allocated for the campaign
     * @return endTime Campaign end timestamp
     * @return merkleRoot Merkle root of results (bytes32(0) if not published)
     * @return totalAllocated Total amount allocated to users
     * @return isActive Whether the campaign is currently active
     * @return hasEnded Whether the campaign has passed its end time
     * @return resultsPublished Whether results have been published by oracle
     */
    function getCampaign(uint256 campaignId) 
        external 
        view 
        returns (
            uint256 id,
            address brand,
            address rewardToken,
            uint256 budget,
            uint256 endTime,
            bytes32 merkleRoot,
            uint256 totalAllocated,
            bool isActive,
            bool hasEnded,
            bool resultsPublished
        ) 
    {
        require(campaignId > 0 && campaignId <= campaignCount, "Campaign does not exist");
        
        Campaign storage campaign = campaigns[campaignId];
        
        return (
            campaign.id,
            campaign.brand,
            campaign.rewardToken,
            campaign.budget,
            campaign.endTime,
            campaign.merkleRoot,
            campaign.totalAllocated,
            campaign.isActive,
            block.timestamp > campaign.endTime,  // hasEnded
            campaign.merkleRoot != bytes32(0)    // resultsPublished
        );
    }

    /**
     * @notice Returns campaign details as a struct (alternative to getCampaign)
     * @param campaignId The ID of the campaign to retrieve
     * @return The campaign struct with all details
     */
    function getCampaignStruct(uint256 campaignId) 
        external 
        view 
        returns (Campaign memory) 
    {
        require(campaignId > 0 && campaignId <= campaignCount, "Campaign does not exist");
        return campaigns[campaignId];
    }

    /**
     * @notice Returns campaign status information
     * @param campaignId The ID of the campaign to check
     * @return hasEnded Whether the campaign has passed its end time
     * @return resultsPublished Whether results have been published
     * @return isActive Whether the campaign is active
     * @return remainingBudget Amount of budget not yet allocated
     */
    function getCampaignStatus(uint256 campaignId)
        external
        view
        returns (
            bool hasEnded,
            bool resultsPublished,
            bool isActive,
            uint256 remainingBudget
        )
    {
        require(campaignId > 0 && campaignId <= campaignCount, "Campaign does not exist");
        
        Campaign storage campaign = campaigns[campaignId];
        
        return (
            block.timestamp > campaign.endTime,     // hasEnded
            campaign.merkleRoot != bytes32(0),      // resultsPublished
            campaign.isActive,                      // isActive
            campaign.budget - campaign.totalAllocated  // remainingBudget
        );
    }
}
