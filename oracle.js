// In your Node.js backend
class CampaignOracle {
    async processCampaignResults(campaignId) {
        // 1. Check if campaign has ended
        const campaign = await this.getCampaignFromContract(campaignId);
        if (Date.now() < campaign.endTime * 1000) {
            throw new Error("Campaign hasn't ended yet");
        }
        
        // 2. Calculate final scores
        const userScores = await this.calculateFinalScores(campaignId);
        
        // 3. Create Merkle tree
        const { merkleRoot, totalAllocated } = await this.createMerkleTree(userScores);
        
        // 4. Call smart contract
        await this.publishResults(campaignId, merkleRoot, totalAllocated);
    }
    
    async publishResults(campaignId, merkleRoot, totalAllocated) {
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, this.wallet);
        const tx = await contract.publishResults(campaignId, merkleRoot, totalAllocated);
        await tx.wait();
        console.log(`Results published for campaign ${campaignId}`);
    }
}