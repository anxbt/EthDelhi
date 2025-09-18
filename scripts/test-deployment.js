const { ethers } = require("hardhat");

async function testDeployment() {
    console.log("🧪 Testing deployment...");
    
    // Check if addresses are set
    if (!process.env.GALXE_CONTRACT_ADDRESS) {
        console.error("❌ GALXE_CONTRACT_ADDRESS not set in .env");
        return;
    }
    
    if (!process.env.MOON_TOKEN_ADDRESS) {
        console.error("❌ MOON_TOKEN_ADDRESS not set in .env");
        return;
    }
    
    try {
        // Connect to contracts
        const galxe = await ethers.getContractAt("Galxe", process.env.GALXE_CONTRACT_ADDRESS);
        const token = await ethers.getContractAt("MockERC20", process.env.MOON_TOKEN_ADDRESS);
        
        // Test contract calls
        console.log("📋 Galxe Contract:", galxe.target);
        console.log("🪙 Token Contract:", token.target);
        console.log("👑 Owner:", await galxe.owner());
        console.log("🔮 Oracle:", await galxe.oracle());
        console.log("📊 Campaign Count:", await galxe.campaignCount());
        
        // Test token
        const [deployer] = await ethers.getSigners();
        const balance = await token.balanceOf(deployer.address);
        console.log("💰 Your MOON balance:", ethers.formatEther(balance));
        
        // Check token details
        console.log("🏷️ Token Name:", await token.name());
        console.log("🏷️ Token Symbol:", await token.symbol());
        console.log("📊 Total Supply:", ethers.formatEther(await token.totalSupply()));
        
        console.log("✅ All tests passed!");
        
    } catch (error) {
        console.error("❌ Test failed:", error.message);
    }
}

testDeployment().catch(console.error);