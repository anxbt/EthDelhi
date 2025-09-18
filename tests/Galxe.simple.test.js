const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Galxe Contract Simple Tests", function () {
    let galxe;
    let mockToken;
    let owner;
    let brand;
    let oracle;
    let user1;
    
    beforeEach(async function () {
        // Get signers
        [owner, brand, oracle, user1] = await ethers.getSigners();
        
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
        it("Should deploy successfully", async function () {
            expect(await galxe.owner()).to.equal(owner.address);
            expect(await galxe.oracle()).to.equal(oracle.address);
            expect(await galxe.campaignCount()).to.equal(0);
        });
    });

    describe("Campaign Creation", function () {
        it("Should create a campaign successfully", async function () {
            const campaignBudget = ethers.parseEther("1000");
            const endTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
            
            // Approve tokens
            await mockToken.connect(brand).approve(galxe.target, campaignBudget);
            
            // Create campaign (only 3 parameters: token, budget, endTime)
            const tx = await galxe.connect(brand).createCampaign(
                mockToken.target,
                campaignBudget,
                endTime
            );
            
            expect(await galxe.campaignCount()).to.equal(1);
            
            // Check campaign details
            const campaign = await galxe.getCampaign(1);
            expect(campaign.brand).to.equal(brand.address);
            expect(campaign.budget).to.equal(campaignBudget);
        });

        it("Should fail without sufficient allowance", async function () {
            const campaignBudget = ethers.parseEther("1000");
            const endTime = Math.floor(Date.now() / 1000) + 3600;
            
            // Don't approve tokens
            await expect(
                galxe.connect(brand).createCampaign(
                    mockToken.target,
                    campaignBudget,
                    endTime
                )
            ).to.be.reverted;
        });
    });

    describe("Oracle Management", function () {
        it("Should allow owner to set oracle", async function () {
            await galxe.setOracle(user1.address);
            expect(await galxe.oracle()).to.equal(user1.address);
        });

        it("Should prevent non-owner from setting oracle", async function () {
            await expect(
                galxe.connect(user1).setOracle(user1.address)
            ).to.be.revertedWith("Only owner can call this function");
        });
    });
});