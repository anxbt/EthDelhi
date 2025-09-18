const { ethers } = require("hardhat");

async function main() {
    console.log("🪙 Deploying MOON Token...");
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");
    
    // Deploy token
    const Token = await ethers.getContractFactory("MockERC20");
    const totalSupply = ethers.parseEther("1000000000"); // 1 billion tokens
    
    const token = await Token.deploy(
        "MOON Token",           // name
        "MOON",                // symbol  
        totalSupply            // total supply
    );
    
    console.log("✅ MOON Token deployed to:", token.target);
    console.log("📊 Total Supply:", ethers.formatEther(totalSupply), "MOON");
    
    // Wait for confirmation
    await token.waitForDeployment();
    console.log("🔗 Transaction confirmed!");
    
    return token.target;
}

main()
    .then((address) => {
        console.log("\n🎉 Deployment Complete!");
        console.log("📝 Add this to your .env file:");
        console.log(`MOON_TOKEN_ADDRESS=${address}`);
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });