const { ethers } = require("hardhat");

async function main() {
    console.log("🏭 Deploying Galxe Contract...");
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    // Deploy Galxe contract
    const Galxe = await ethers.getContractFactory("Galxe");
    const galxe = await Galxe.deploy();
    
    console.log("✅ Galxe Contract deployed to:", galxe.target);
    
    // Wait for confirmation
    await galxe.waitForDeployment();
    console.log("🔗 Transaction confirmed!");
    
    // Set oracle address
    const oracleAddress = process.env.ORACLE_ADDRESS;
    if (oracleAddress) {
        console.log("🔮 Setting oracle address...");
        const tx = await galxe.setOracle(oracleAddress);
        await tx.wait();
        console.log("✅ Oracle set to:", oracleAddress);
    }
    
    return galxe.target;
}

main()
    .then((address) => {
        console.log("\n🎉 Deployment Complete!");
        console.log("📝 Add this to your .env file:");
        console.log(`GALXE_CONTRACT_ADDRESS=${address}`);
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });