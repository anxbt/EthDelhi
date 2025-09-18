const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

describe("Galxe Contract Tests", function () {
    let galxe;
    let mockToken;
    let owner;
    let brand;
    let oracle;
    let user1;
    let user2;
    let user3;
    
    const CAMPAIGN_BUDGET = ethers.parseEther("1000"); // 1000 tokens
    const USER1_REWARD = ethers.parseEther("100");     // 100 tokens
    const USER2_REWARD = ethers.parseEther("150");     // 150 tokens
    const USER3_REWARD = ethers.parseEther("75");      // 75 tokens
    
    beforeEach(async function () {
        // Get signers
        [owner, brand, oracle, user1, user2, user3] = await ethers.getSigners();
        
        // Deploy mock ERC20 token
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockToken = await MockToken.deploy("MockToken", "MTK", ethers.parseEther("10000"));
        
        // Deploy Galxe contract
        const Galxe = await ethers.getContractFactory("Galxe");
        galxe = await Galxe.deploy();
        
        // Transfer tokens to brand for testing
        await mockToken.transfer(brand.address, ethers.parseEther("5000"));
        
        // Set oracle address
        await galxe.setOracle(oracle.address);
    });

    describe("Contract Deployment", function () {
        it("Should set the correct owner and oracle", async function () {
            expect(await galxe.owner()).to.equal(owner.address);
            expect(await galxe.oracle()).to.equal(oracle.address);
        });

        it("Should start with zero campaigns", async function () {
            expect(await galxe.campaignCount()).to.equal(0);
        });
    });

    describe("Oracle Management", function () {
        it("Should allow owner to change oracle", async function () {
            await galxe.setOracle(user1.address);
            expect(await galxe.oracle()).to.equal(user1.address);
        });

        it("Should reject oracle change from non-owner", async function () {
            await expect(
                galxe.connect(brand).setOracle(user1.address)
            ).to.be.revertedWith("Only owner can call this function");
        });

        it("Should reject zero address as oracle", async function () {
            await expect(
                galxe.setOracle(ethers.constants.AddressZero)
            ).to.be.revertedWith("Oracle cannot be zero address");
        });
    });

    describe("Campaign Creation", function () {
        beforeEach(async function () {
            // Approve tokens for campaign creation
            await mockToken.connect(brand).approve(galxe.address, CAMPAIGN_BUDGET);
        });

        it("Should create a campaign successfully", async function () {
            const endTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
            
            await expect(
                galxe.connect(brand).createCampaign(
                    mockToken.address,
                    CAMPAIGN_BUDGET,
                    endTime
                )
            ).to.emit(galxe, "CampaignCreated"); // Note: This event doesn't exist yet, we should add it

            expect(await galxe.campaignCount()).to.equal(1);
            
            const campaign = await galxe.getCampaignStruct(1);
            expect(campaign.id).to.equal(1);
            expect(campaign.brand).to.equal(brand.address);
            expect(campaign.rewardToken).to.equal(mockToken.address);
            expect(campaign.budget).to.equal(CAMPAIGN_BUDGET);
            expect(campaign.isActive).to.be.true;
            expect(campaign.merkleRoot).to.equal(ethers.constants.HashZero);
            expect(campaign.totalAllocated).to.equal(0);
        });

        it("Should reject campaign with past end time", async function () {
            const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
            
            await expect(
                galxe.connect(brand).createCampaign(
                    mockToken.address,
                    CAMPAIGN_BUDGET,
                    pastTime
                )
            ).to.be.revertedWith("End time must be in the future");
        });

        it("Should reject campaign with zero budget", async function () {
            const endTime = Math.floor(Date.now() / 1000) + 3600;
            
            await expect(
                galxe.connect(brand).createCampaign(
                    mockToken.address,
                    0,
                    endTime
                )
            ).to.be.revertedWith("Budget must be greater than zero");
        });

        it("Should transfer tokens to contract", async function () {
            const endTime = Math.floor(Date.now() / 1000) + 3600;
            const initialBalance = await mockToken.balanceOf(galxe.address);
            
            await galxe.connect(brand).createCampaign(
                mockToken.address,
                CAMPAIGN_BUDGET,
                endTime
            );
            
            const finalBalance = await mockToken.balanceOf(galxe.address);
            expect(finalBalance.sub(initialBalance)).to.equal(CAMPAIGN_BUDGET);
        });
    });

    describe("Campaign Management", function () {
        let campaignId;
        
        beforeEach(async function () {
            // Create a test campaign
            const endTime = Math.floor(Date.now() / 1000) + 3600;
            await mockToken.connect(brand).approve(galxe.address, CAMPAIGN_BUDGET);
            await galxe.connect(brand).createCampaign(
                mockToken.address,
                CAMPAIGN_BUDGET,
                endTime
            );
            campaignId = 1;
        });

        describe("Close Campaign", function () {
            it("Should allow brand to close their campaign", async function () {
                await expect(
                    galxe.connect(brand).closeCampaign(campaignId)
                ).to.emit(galxe, "CampaignClosed")
                .withArgs(campaignId, brand.address, anyValue);

                const campaign = await galxe.getCampaignStruct(campaignId);
                expect(campaign.isActive).to.be.false;
            });

            it("Should reject close from non-brand", async function () {
                await expect(
                    galxe.connect(user1).closeCampaign(campaignId)
                ).to.be.revertedWith("Only campaign creator can close");
            });

            it("Should reject close of non-existent campaign", async function () {
                await expect(
                    galxe.connect(brand).closeCampaign(999)
                ).to.be.revertedWith("Campaign does not exist");
            });

            it("Should reject double close", async function () {
                await galxe.connect(brand).closeCampaign(campaignId);
                
                await expect(
                    galxe.connect(brand).closeCampaign(campaignId)
                ).to.be.revertedWith("Campaign is already closed");
            });
        });
    });

    describe("Results Publishing", function () {
        let campaignId;
        let merkleTree;
        let merkleRoot;
        let totalAllocated;
        
        beforeEach(async function () {
            // Create campaign that ends in the past (for testing)
            const pastEndTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
            await mockToken.connect(brand).approve(galxe.address, CAMPAIGN_BUDGET);
            
            // We need to create campaign with future time first, then simulate time passing
            const futureEndTime = Math.floor(Date.now() / 1000) + 1;
            await galxe.connect(brand).createCampaign(
                mockToken.address,
                CAMPAIGN_BUDGET,
                futureEndTime
            );
            campaignId = 1;
            
            // Wait for campaign to end
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Prepare Merkle tree
            const rewards = [
                { address: user1.address, amount: USER1_REWARD },
                { address: user2.address, amount: USER2_REWARD },
                { address: user3.address, amount: USER3_REWARD }
            ];
            
            const leaves = rewards.map(reward => 
                keccak256(
                    ethers.solidityPacked(
                        ["address", "uint256"],
                        [reward.address, reward.amount]
                    )
                )
            );
            
            merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
            merkleRoot = merkleTree.getHexRoot();
            totalAllocated = USER1_REWARD + USER2_REWARD) + USER3_REWARD);
        });

        it("Should allow oracle to publish results", async function () {
            await expect(
                galxe.connect(oracle).publishResults(campaignId, merkleRoot, totalAllocated)
            ).to.emit(galxe, "ResultsPublished")
            .withArgs(campaignId, merkleRoot, totalAllocated, anyValue);

            const campaign = await galxe.getCampaignStruct(campaignId);
            expect(campaign.merkleRoot).to.equal(merkleRoot);
            expect(campaign.totalAllocated).to.equal(totalAllocated);
            expect(campaign.isActive).to.be.false;
        });

        it("Should reject results from non-oracle", async function () {
            await expect(
                galxe.connect(brand).publishResults(campaignId, merkleRoot, totalAllocated)
            ).to.be.revertedWith("Only oracle can call this function");
        });

        it("Should reject results for non-existent campaign", async function () {
            await expect(
                galxe.connect(oracle).publishResults(999, merkleRoot, totalAllocated)
            ).to.be.revertedWith("Campaign does not exist");
        });

        it("Should reject allocation exceeding budget", async function () {
            const excessiveAllocation = CAMPAIGN_BUDGET + ethers.parseEther("1"));
            
            await expect(
                galxe.connect(oracle).publishResults(campaignId, merkleRoot, excessiveAllocation)
            ).to.be.revertedWith("Allocated amount exceeds budget");
        });

        it("Should reject empty merkle root", async function () {
            await expect(
                galxe.connect(oracle).publishResults(campaignId, ethers.constants.HashZero, totalAllocated)
            ).to.be.revertedWith("Merkle root cannot be empty");
        });

        it("Should reject double publishing", async function () {
            await galxe.connect(oracle).publishResults(campaignId, merkleRoot, totalAllocated);
            
            await expect(
                galxe.connect(oracle).publishResults(campaignId, merkleRoot, totalAllocated)
            ).to.be.revertedWith("Results already published");
        });
    });

    describe("Reward Claiming", function () {
        let campaignId;
        let merkleTree;
        let merkleRoot;
        let totalAllocated;
        let user1Proof;
        let user2Proof;
        
        beforeEach(async function () {
            // Create and setup campaign with published results
            const futureEndTime = Math.floor(Date.now() / 1000) + 1;
            await mockToken.connect(brand).approve(galxe.address, CAMPAIGN_BUDGET);
            await galxe.connect(brand).createCampaign(
                mockToken.address,
                CAMPAIGN_BUDGET,
                futureEndTime
            );
            campaignId = 1;
            
            // Wait for campaign to end
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Create Merkle tree and publish results
            const rewards = [
                { address: user1.address, amount: USER1_REWARD },
                { address: user2.address, amount: USER2_REWARD },
                { address: user3.address, amount: USER3_REWARD }
            ];
            
            const leaves = rewards.map(reward => 
                keccak256(
                    ethers.solidityPacked(
                        ["address", "uint256"],
                        [reward.address, reward.amount]
                    )
                )
            );
            
            merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
            merkleRoot = merkleTree.getHexRoot();
            totalAllocated = USER1_REWARD + USER2_REWARD) + USER3_REWARD);
            
            // Generate proofs
            user1Proof = merkleTree.getHexProof(leaves[0]);
            user2Proof = merkleTree.getHexProof(leaves[1]);
            
            await galxe.connect(oracle).publishResults(campaignId, merkleRoot, totalAllocated);
        });

        it("Should allow valid reward claims", async function () {
            const initialBalance = await mockToken.balanceOf(user1.address);
            
            await expect(
                galxe.connect(user1).claimReward(campaignId, USER1_REWARD, user1Proof)
            ).to.emit(galxe, "RewardClaimed")
            .withArgs(campaignId, user1.address, USER1_REWARD, anyValue);

            const finalBalance = await mockToken.balanceOf(user1.address);
            expect(finalBalance.sub(initialBalance)).to.equal(USER1_REWARD);
            
            expect(await galxe.hasClaimed(campaignId, user1.address)).to.be.true;
        });

        it("Should reject invalid proof", async function () {
            // Use user2's proof for user1's claim
            await expect(
                galxe.connect(user1).claimReward(campaignId, USER1_REWARD, user2Proof)
            ).to.be.revertedWith("Invalid Merkle proof");
        });

        it("Should reject double claims", async function () {
            await galxe.connect(user1).claimReward(campaignId, USER1_REWARD, user1Proof);
            
            await expect(
                galxe.connect(user1).claimReward(campaignId, USER1_REWARD, user1Proof)
            ).to.be.revertedWith("Reward already claimed");
        });

        it("Should reject claims before results published", async function () {
            // Create new campaign without published results
            const endTime = Math.floor(Date.now() / 1000) + 3600;
            await mockToken.connect(brand).approve(galxe.address, CAMPAIGN_BUDGET);
            await galxe.connect(brand).createCampaign(
                mockToken.address,
                CAMPAIGN_BUDGET,
                endTime
            );
            
            await expect(
                galxe.connect(user1).claimReward(2, USER1_REWARD, user1Proof)
            ).to.be.revertedWith("Results not published yet");
        });

        it("Should reject zero amount claims", async function () {
            await expect(
                galxe.connect(user1).claimReward(campaignId, 0, user1Proof)
            ).to.be.revertedWith("Amount must be greater than zero");
        });
    });

    describe("Campaign Information", function () {
        let campaignId;
        
        beforeEach(async function () {
            const endTime = Math.floor(Date.now() / 1000) + 3600;
            await mockToken.connect(brand).approve(galxe.address, CAMPAIGN_BUDGET);
            await galxe.connect(brand).createCampaign(
                mockToken.address,
                CAMPAIGN_BUDGET,
                endTime
            );
            campaignId = 1;
        });

        describe("getCampaign", function () {
            it("Should return correct campaign details", async function () {
                const result = await galxe.getCampaign(campaignId);
                
                expect(result.id).to.equal(campaignId);
                expect(result.brand).to.equal(brand.address);
                expect(result.rewardToken).to.equal(mockToken.address);
                expect(result.budget).to.equal(CAMPAIGN_BUDGET);
                expect(result.isActive).to.be.true;
                expect(result.hasEnded).to.be.false;
                expect(result.resultsPublished).to.be.false;
            });

            it("Should reject non-existent campaign", async function () {
                await expect(
                    galxe.getCampaign(999)
                ).to.be.revertedWith("Campaign does not exist");
            });
        });

        describe("getCampaignStruct", function () {
            it("Should return campaign struct", async function () {
                const campaign = await galxe.getCampaignStruct(campaignId);
                
                expect(campaign.id).to.equal(campaignId);
                expect(campaign.brand).to.equal(brand.address);
                expect(campaign.budget).to.equal(CAMPAIGN_BUDGET);
            });
        });

        describe("getCampaignStatus", function () {
            it("Should return correct status information", async function () {
                const status = await galxe.getCampaignStatus(campaignId);
                
                expect(status.hasEnded).to.be.false;
                expect(status.resultsPublished).to.be.false;
                expect(status.isActive).to.be.true;
                expect(status.remainingBudget).to.equal(CAMPAIGN_BUDGET);
            });
        });
    });

    describe("hasClaimed Function", function () {
        it("Should return false for unclaimed rewards", async function () {
            expect(await galxe.hasClaimed(1, user1.address)).to.be.false;
        });
        
        // Note: Testing true case requires full campaign flow which is covered above
    });
});

// Helper to match any value in events
const anyValue = undefined;
