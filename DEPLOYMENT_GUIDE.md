# 🚀 MoonForge/Galxe Smart Contract Deployment Guide

Complete step-by-step guide to deploy your campaign platform on Base testnet and integrate with your backend/frontend.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Base Testnet Configuration](#base-testnet-configuration)
4. [Deploy Your Token](#deploy-your-token)
5. [Deploy Galxe Contract](#deploy-galxe-contract)
6. [Backend Integration](#backend-integration)
7. [Frontend Integration](#frontend-integration)
8. [Testing & Verification](#testing--verification)
9. [Production Deployment](#production-deployment)

---

## 🔧 Prerequisites

### Required Software
- Node.js (v18+)
- npm/pnpm
- MetaMask browser extension
- Git

### Required Accounts
- MetaMask wallet
- Base testnet ETH (for gas fees)
- GitHub account (for code management)

---

## ⚙️ Environment Setup

### 1. Install Dependencies
```bash
cd c:\Users\Hp\Desktop\ETHDELHI
pnpm install
```

### 2. Create Environment File
Create `.env` file in your project root:

```bash
# Create .env file
echo. > .env
```

### 3. Configure Environment Variables
Add these variables to your `.env` file:

```env
# Wallet Configuration
PRIVATE_KEY=your_private_key_here
WALLET_ADDRESS=your_wallet_address_here

# Network Configuration
BASE_TESTNET_RPC_URL=https://sepolia.base.org
BASE_MAINNET_RPC_URL=https://mainnet.base.org

# Contract Addresses (will be filled after deployment)
GALXE_CONTRACT_ADDRESS=
MOON_TOKEN_ADDRESS=

# Oracle Configuration
ORACLE_PRIVATE_KEY=your_oracle_private_key_here
ORACLE_ADDRESS=your_oracle_address_here

# API Configuration
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# Block Explorer
BASE_EXPLORER_URL=https://sepolia-explorer.base.org
```

---

## 🌐 Base Testnet Configuration

### 1. Add Base Testnet to MetaMask

**Network Details:**
- **Network Name:** Base Sepolia
- **RPC URL:** `https://sepolia.base.org`
- **Chain ID:** `84532`
- **Currency Symbol:** `ETH`
- **Block Explorer:** `https://sepolia-explorer.base.org`

**Steps:**
1. Open MetaMask
2. Click network dropdown → "Add Network"
3. Enter the details above
4. Save and switch to Base Sepolia

### 2. Get Test ETH
- Visit: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- Connect your wallet
- Request test ETH (you'll need ~0.1 ETH for deployment)

### 3. Export Your Private Key
⚠️ **SECURITY WARNING:** Never share your private key! Only use for testnets.

**From MetaMask:**
1. MetaMask → Account menu → Account details
2. Export Private Key
3. Enter password
4. Copy the private key
5. Add to `.env` file as `PRIVATE_KEY`

---

## 🪙 Deploy Your Token

### 1. Create Token Deployment Script
Create `scripts/deploy-token.js`:

```javascript
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
```

### 2. Update Hardhat Config
Update `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    baseSepolia: {
      url: process.env.BASE_TESTNET_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 84532,
      gasPrice: 1000000000, // 1 gwei
    },
    baseMainnet: {
      url: process.env.BASE_MAINNET_RPC_URL, 
      accounts: [process.env.PRIVATE_KEY],
      chainId: 8453,
      gasPrice: 1000000000,
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./tests", 
    cache: "./cache",
    artifacts: "./artifacts"
  },
  etherscan: {
    apiKey: {
      baseSepolia: "PLACEHOLDER_STRING"
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  }
};
```

### 3. Deploy Token
```bash
npx hardhat run scripts/deploy-token.js --network baseSepolia
```

**Expected Output:**
```
🪙 Deploying MOON Token...
Deploying with account: 0x1234...
Account balance: 0.05 ETH
✅ MOON Token deployed to: 0xABCD1234...
📊 Total Supply: 1000000000.0 MOON
🔗 Transaction confirmed!

🎉 Deployment Complete!
📝 Add this to your .env file:
MOON_TOKEN_ADDRESS=0xABCD1234...
```

---

## 📋 Deploy Galxe Contract

### 1. Create Galxe Deployment Script
Create `scripts/deploy-galxe.js`:

```javascript
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
```

### 2. Deploy Galxe Contract
```bash
npx hardhat run scripts/deploy-galxe.js --network baseSepolia
```

### 3. Verify Contracts (Optional)
```bash
# Verify token
npx hardhat verify --network baseSepolia [TOKEN_ADDRESS] "MOON Token" "MOON" "1000000000000000000000000000"

# Verify Galxe contract
npx hardhat verify --network baseSepolia [GALXE_ADDRESS]
```

---

## 🔧 Backend Integration

### 1. Update Oracle Service
Update your `oracle.js` file:

```javascript
const { ethers } = require("ethers");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
require("dotenv").config();

class CampaignOracle {
    constructor() {
        // Connect to Base testnet
        this.provider = new ethers.JsonRpcProvider(process.env.BASE_TESTNET_RPC_URL);
        
        // Oracle wallet
        this.wallet = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY, this.provider);
        
        // Contract instance
        this.contract = new ethers.Contract(
            process.env.GALXE_CONTRACT_ADDRESS,
            require("./artifacts/contracts/_Galxe.sol/Galxe.json").abi,
            this.wallet
        );
        
        console.log("🔮 Oracle initialized:");
        console.log("📡 Network:", await this.provider.getNetwork());
        console.log("👛 Oracle Address:", this.wallet.address);
        console.log("📋 Contract Address:", process.env.GALXE_CONTRACT_ADDRESS);
    }

    async processCampaignResults(campaignId) {
        try {
            console.log(`🎯 Processing campaign ${campaignId}...`);
            
            // 1. Get campaign data
            const campaign = await this.contract.getCampaign(campaignId);
            console.log("📊 Campaign retrieved:", campaign);
            
            // 2. Check if campaign has ended
            if (Date.now() < Number(campaign.endTime) * 1000) {
                throw new Error("Campaign hasn't ended yet");
            }
            
            // 3. Calculate user scores (mock data for now)
            const userScores = await this.calculateFinalScores(campaignId);
            console.log("🎯 User scores calculated:", userScores);
            
            // 4. Create Merkle tree
            const { merkleRoot, totalAllocated } = await this.createMerkleTree(userScores);
            console.log("🌳 Merkle root:", merkleRoot);
            console.log("💰 Total allocated:", ethers.formatEther(totalAllocated));
            
            // 5. Publish results
            await this.publishResults(campaignId, merkleRoot, totalAllocated);
            
            return { merkleRoot, totalAllocated, userScores };
            
        } catch (error) {
            console.error("❌ Error processing campaign:", error);
            throw error;
        }
    }

    async calculateFinalScores(campaignId) {
        // TODO: Implement your scoring logic here
        // For now, return mock data
        return [
            {
                address: "0x1234567890123456789012345678901234567890",
                amount: ethers.parseEther("100")
            },
            {
                address: "0x0987654321098765432109876543210987654321", 
                amount: ethers.parseEther("150")
            }
        ];
    }

    async createMerkleTree(userScores) {
        const leaves = userScores.map(score => 
            keccak256(
                ethers.solidityPacked(
                    ["address", "uint256"],
                    [score.address, score.amount]
                )
            )
        );
        
        const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
        const merkleRoot = merkleTree.getHexRoot();
        
        const totalAllocated = userScores.reduce(
            (sum, score) => sum + score.amount, 
            0n
        );
        
        return { merkleRoot, totalAllocated };
    }

    async publishResults(campaignId, merkleRoot, totalAllocated) {
        console.log("📤 Publishing results to blockchain...");
        
        const tx = await this.contract.publishResults(
            campaignId, 
            merkleRoot, 
            totalAllocated
        );
        
        console.log("⏳ Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("✅ Results published! Block:", receipt.blockNumber);
        
        return receipt;
    }

    async getGasPrice() {
        const gasPrice = await this.provider.getFeeData();
        console.log("⛽ Current gas price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
        return gasPrice;
    }
}

module.exports = CampaignOracle;

// Example usage
if (require.main === module) {
    async function test() {
        const oracle = new CampaignOracle();
        
        // Test oracle connection
        console.log("🧪 Testing oracle connection...");
        await oracle.getGasPrice();
        console.log("✅ Oracle test complete!");
    }
    
    test().catch(console.error);
}
```

### 2. Create API Server
Create `server.js`:

```javascript
const express = require("express");
const cors = require("cors");
const CampaignOracle = require("./oracle");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize oracle
const oracle = new CampaignOracle();

// Routes
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.post("/process-campaign/:id", async (req, res) => {
    try {
        const campaignId = req.params.id;
        console.log(`📨 API request to process campaign ${campaignId}`);
        
        const result = await oracle.processCampaignResults(campaignId);
        
        res.json({
            success: true,
            campaignId,
            merkleRoot: result.merkleRoot,
            totalAllocated: result.totalAllocated.toString(),
            userCount: result.userScores.length
        });
        
    } catch (error) {
        console.error("❌ API Error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get("/campaign/:id", async (req, res) => {
    try {
        const campaignId = req.params.id;
        const campaign = await oracle.contract.getCampaign(campaignId);
        
        res.json({
            success: true,
            campaign: {
                id: campaign.id.toString(),
                brand: campaign.brand,
                rewardToken: campaign.rewardToken,
                budget: campaign.budget.toString(),
                endTime: campaign.endTime.toString(),
                isActive: campaign.isActive
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
```

---

## 🎨 Frontend Integration

### 1. Web3 Connection Setup
Create `frontend/utils/web3.js`:

```javascript
import { ethers } from "ethers";

// Contract ABIs (import from your artifacts)
import GalxeABI from "../contracts/Galxe.json";
import TokenABI from "../contracts/MockERC20.json";

class Web3Service {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.galxeContract = null;
        this.tokenContract = null;
    }

    async connect() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                // Request account access
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                
                // Create provider and signer
                this.provider = new ethers.BrowserProvider(window.ethereum);
                this.signer = await this.provider.getSigner();
                
                // Initialize contracts
                this.galxeContract = new ethers.Contract(
                    process.env.REACT_APP_GALXE_CONTRACT_ADDRESS,
                    GalxeABI.abi,
                    this.signer
                );
                
                this.tokenContract = new ethers.Contract(
                    process.env.REACT_APP_MOON_TOKEN_ADDRESS,
                    TokenABI.abi,
                    this.signer
                );
                
                // Check network
                const network = await this.provider.getNetwork();
                if (network.chainId !== 84532n) { // Base Sepolia
                    await this.switchToBaseTestnet();
                }
                
                console.log("✅ Web3 connected!");
                return await this.signer.getAddress();
                
            } catch (error) {
                console.error("❌ Connection failed:", error);
                throw error;
            }
        } else {
            throw new Error("MetaMask not installed!");
        }
    }

    async switchToBaseTestnet() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x14a34' }], // 84532 in hex
            });
        } catch (switchError) {
            // Add network if it doesn't exist
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x14a34',
                        chainName: 'Base Sepolia',
                        nativeCurrency: {
                            name: 'ETH',
                            symbol: 'ETH',
                            decimals: 18
                        },
                        rpcUrls: ['https://sepolia.base.org'],
                        blockExplorerUrls: ['https://sepolia-explorer.base.org']
                    }]
                });
            }
        }
    }

    async createCampaign(tokenAddress, budget, endTime) {
        try {
            // Approve tokens first
            const approveTx = await this.tokenContract.approve(
                process.env.REACT_APP_GALXE_CONTRACT_ADDRESS,
                budget
            );
            await approveTx.wait();
            
            // Create campaign
            const tx = await this.galxeContract.createCampaign(
                tokenAddress,
                budget,
                endTime
            );
            
            const receipt = await tx.wait();
            console.log("✅ Campaign created:", receipt);
            return receipt;
            
        } catch (error) {
            console.error("❌ Campaign creation failed:", error);
            throw error;
        }
    }

    async getCampaign(campaignId) {
        try {
            const campaign = await this.galxeContract.getCampaign(campaignId);
            return {
                id: campaign.id.toString(),
                brand: campaign.brand,
                rewardToken: campaign.rewardToken,
                budget: ethers.formatEther(campaign.budget),
                endTime: new Date(Number(campaign.endTime) * 1000),
                isActive: campaign.isActive
            };
        } catch (error) {
            console.error("❌ Failed to get campaign:", error);
            throw error;
        }
    }
}

export default new Web3Service();
```

### 2. React Component Example
Create `frontend/components/CampaignCreator.jsx`:

```jsx
import React, { useState } from 'react';
import { ethers } from 'ethers';
import Web3Service from '../utils/web3';

const CampaignCreator = () => {
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);
    const [account, setAccount] = useState('');

    const [campaignData, setCampaignData] = useState({
        budget: '',
        duration: '24' // hours
    });

    const connectWallet = async () => {
        try {
            setLoading(true);
            const address = await Web3Service.connect();
            setAccount(address);
            setConnected(true);
        } catch (error) {
            alert('Failed to connect wallet: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const createCampaign = async () => {
        try {
            setLoading(true);
            
            const budget = ethers.parseEther(campaignData.budget);
            const endTime = Math.floor(Date.now() / 1000) + (parseInt(campaignData.duration) * 3600);
            
            const receipt = await Web3Service.createCampaign(
                process.env.REACT_APP_MOON_TOKEN_ADDRESS,
                budget,
                endTime
            );
            
            alert('Campaign created successfully! Transaction: ' + receipt.transactionHash);
            
        } catch (error) {
            alert('Failed to create campaign: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="campaign-creator">
            <h2>🎯 Create Campaign</h2>
            
            {!connected ? (
                <button onClick={connectWallet} disabled={loading}>
                    {loading ? 'Connecting...' : 'Connect Wallet'}
                </button>
            ) : (
                <div>
                    <p>✅ Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
                    
                    <div className="form">
                        <label>
                            Budget (MOON tokens):
                            <input
                                type="number"
                                value={campaignData.budget}
                                onChange={(e) => setCampaignData({
                                    ...campaignData,
                                    budget: e.target.value
                                })}
                                placeholder="1000"
                            />
                        </label>
                        
                        <label>
                            Duration (hours):
                            <input
                                type="number"
                                value={campaignData.duration}
                                onChange={(e) => setCampaignData({
                                    ...campaignData,
                                    duration: e.target.value
                                })}
                                placeholder="24"
                            />
                        </label>
                        
                        <button onClick={createCampaign} disabled={loading}>
                            {loading ? 'Creating...' : 'Create Campaign'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampaignCreator;
```

---

## 🧪 Testing & Verification

### 1. Test Your Deployment
Create `scripts/test-deployment.js`:

```javascript
const { ethers } = require("hardhat");

async function testDeployment() {
    console.log("🧪 Testing deployment...");
    
    // Connect to contract
    const galxe = await ethers.getContractAt("Galxe", process.env.GALXE_CONTRACT_ADDRESS);
    const token = await ethers.getContractAt("MockERC20", process.env.MOON_TOKEN_ADDRESS);
    
    // Test contract calls
    console.log("📋 Contract Address:", galxe.target);
    console.log("🪙 Token Address:", token.target);
    console.log("👑 Owner:", await galxe.owner());
    console.log("🔮 Oracle:", await galxe.oracle());
    console.log("📊 Campaign Count:", await galxe.campaignCount());
    
    // Test token
    const [deployer] = await ethers.getSigners();
    const balance = await token.balanceOf(deployer.address);
    console.log("💰 Your MOON balance:", ethers.formatEther(balance));
    
    console.log("✅ All tests passed!");
}

testDeployment().catch(console.error);
```

### 2. Run Tests
```bash
# Test deployment
npx hardhat run scripts/test-deployment.js --network baseSepolia

# Run unit tests
npx hardhat test

# Check coverage
npx hardhat coverage
```

### 3. Interact with Contract
```bash
# Start local node for testing
npx hardhat node

# In another terminal, deploy locally
npx hardhat run scripts/deploy-token.js --network localhost
npx hardhat run scripts/deploy-galxe.js --network localhost
```

---

## 🚀 Production Deployment

### 1. Security Checklist
- [ ] Private keys stored securely (not in code)
- [ ] Environment variables configured
- [ ] Contracts verified on explorer
- [ ] Oracle address set correctly
- [ ] Test transactions successful
- [ ] Gas limits optimized

### 2. Deploy to Base Mainnet
Update `.env`:
```env
BASE_MAINNET_RPC_URL=https://mainnet.base.org
# Use mainnet addresses
```

Deploy:
```bash
# Deploy token to mainnet
npx hardhat run scripts/deploy-token.js --network baseMainnet

# Deploy Galxe to mainnet  
npx hardhat run scripts/deploy-galxe.js --network baseMainnet
```

### 3. Post-Deployment Tasks
1. **Verify contracts** on Base explorer
2. **Update frontend** with mainnet addresses
3. **Test oracle** functionality
4. **Monitor gas costs**
5. **Set up monitoring** for failed transactions

---

## 📞 Troubleshooting

### Common Issues

**"Insufficient funds for gas"**
- Get more ETH from Base faucet
- Lower gas price in hardhat config

**"Nonce too high"**
- Reset MetaMask account: Settings → Advanced → Reset Account

**"Contract not deployed"**
- Check contract address in .env
- Verify network (testnet vs mainnet)

**"Oracle unauthorized"**
- Call `setOracle()` with correct address
- Check oracle private key

### Getting Help
- Base Discord: https://discord.gg/buildonbase
- Hardhat Docs: https://hardhat.org/docs
- Ethers.js Docs: https://docs.ethers.org

---

## 🎉 Success Checklist

When everything is working, you should have:

- [ ] ✅ MOON token deployed on Base testnet
- [ ] ✅ Galxe contract deployed and verified
- [ ] ✅ Oracle configured and authorized
- [ ] ✅ Backend API responding
- [ ] ✅ Frontend connecting to MetaMask
- [ ] ✅ Test campaign created successfully
- [ ] ✅ Merkle tree generation working
- [ ] ✅ Ready for hackathon demo! 🚀

---

## 📝 Quick Reference

### Important Addresses
```
Base Sepolia Testnet:
- Chain ID: 84532
- RPC: https://sepolia.base.org
- Explorer: https://sepolia-explorer.base.org
- Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

Your Contracts:
- MOON Token: [YOUR_TOKEN_ADDRESS]
- Galxe Contract: [YOUR_GALXE_ADDRESS]
```

### Useful Commands
```bash
# Check deployment
npx hardhat run scripts/test-deployment.js --network baseSepolia

# Verify contract
npx hardhat verify --network baseSepolia [ADDRESS] [CONSTRUCTOR_ARGS]

# Run tests
npx hardhat test

# Start backend
node server.js

# Check gas prices
npx hardhat run scripts/gas-check.js --network baseSepolia
```

**Good luck with your hackathon! 🏆**