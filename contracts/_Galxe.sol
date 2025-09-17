// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

 struct Campaign {
        uint256 id; //unique number for each campaign.
        address brand; //  wallet address of the brand that created the campaign.
        address rewardToken;
        uint256 budget;
        uint256 endTime;

        uint256 totalAllocated; //total  budget the oracle has assigned to users.
        bool isActive;
    }

contract Galxe {
   
    // Events
    event CampaignClosed(uint256 indexed campaignId, address indexed brand, uint256 timestamp);
   
    // This would go inside your contract
    mapping(uint256 => Campaign) public campaigns;
    uint256 public campaignCount; // To generate unique IDs

    function createCampaign(address token, uint256 budget, uint256 endTime) external payable {
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
      require(msg.sender == campaigns[campaignId].brand, "Only campaign creator can close");

    // You need to get a reference to the campaign in storage (not memory)
Campaign storage campaignToClose = campaigns[campaignId];
campaignToClose.isActive = false;
      // Let the world know this campaign was closed
      emit CampaignClosed(campaignId, msg.sender, block.timestamp);
    }
}
