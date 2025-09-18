# Create the content of the MoonForge Smart Contract functions in Markdown format
content = """# MoonForge Smart Contract Functions (Prototype)

## 1. Campaign Lifecycle
1. **`createCampaign(token, budget, endTime)`**
   - Called by a **brand** to start a new campaign.
   - They set campaign details and deposit the budget (tokens/ETH).
   - Stores metadata like hashtag, duration, reward pool.

2. **`fundCampaign(id, amount)`** *(optional if not combined with `createCampaign`)*
   - Lets a brand top-up an existing campaign with more funds.

3. **`closeCampaign(id)`**
   - Ends the campaign manually if needed.
   - Locks it from receiving new participants.

---

## 2. Results / Oracle
4. **`publishResults(id, merkleRoot, totalAllocated)`**
   - Called by the **oracle (backend)** after campaign ends.
   - Publishes a **summary of engagement results** in a compressed format (Merkle root).
   - Stores how much of the budget is allocated.

---

## 3. Rewards for Users
5. **`claimReward(id, amount, proof)`**
   - Called by a **user** who completed the campaign task.
   - Verifies proof (that backend/oracle assigned them X tokens).
   - Transfers tokens from campaign pool to user wallet.

---

## 4. Fund Management
6. **`refundUnused(id)`**
   - Called by the **brand** after the claim deadline.
   - Sends back unclaimed tokens to the brand.

---

## 5. Utility / Security
7. **`hasClaimed(id, user)`** (view function)
   - Lets anyone check if a user already claimed their reward.

8. **`getCampaign(id)`** (view function)
   - Returns campaign details (budget, brand, deadline, results status).

---

---

## 6. On-Chain Activity Tracking (Backend Oracle Responsibilities)

### **DeFi Activities to Monitor:**
9. **Token Swapping Activities**
   - Track swaps on DEXs (Uniswap, 1inch, SushiSwap, etc.)
   - Monitor swap volume, frequency, and token pairs
   - Award points based on transaction size and activity frequency

10. **Liquidity Provision**
    - Monitor LP token minting/burning events
    - Track liquidity additions to specific pools
    - Higher points for longer-term liquidity provision

11. **Staking & Yield Farming**
    - Track staking activities on protocols (Compound, Aave, Lido)
    - Monitor yield farming participation
    - Points based on staked amounts and duration

12. **NFT Activities**
    - Monitor NFT purchases, sales, and transfers
    - Track participation in NFT marketplaces (OpenSea, Blur)
    - Special campaigns for specific NFT collections

13. **Cross-Chain Bridge Usage**
    - Track bridge transactions between chains
    - Monitor multi-chain wallet activity
    - Bonus points for exploring new chains

### **Governance & Community Activities:**
14. **DAO Participation**
    - Track voting in governance proposals
    - Monitor delegation activities
    - Award points for active community participation

15. **Protocol Usage**
    - Monitor interactions with specific DeFi protocols
    - Track new protocol adoptions
    - Bonus for early adopters of new features

### **Backend Monitoring Strategy:**
- **Real-time Event Listening:** Subscribe to blockchain events using Web3 providers
- **Periodic Scanning:** Batch process historical transactions
- **Multi-chain Support:** Monitor activities across Ethereum, Polygon, Arbitrum, etc.
- **Data Indexing:** Use services like The Graph or Alchemy for efficient querying

### **Point Calculation Framework:**
```
Base Points System:
- Small swap (<$100): 10 points
- Medium swap ($100-$1000): 50 points  
- Large swap (>$1000): 100 points
- LP provision: 200 points + time multiplier
- Staking: 150 points + amount multiplier
- NFT transaction: 75 points
- DAO vote: 50 points
- Bridge transaction: 80 points

Multipliers:
- Early campaign participation: 1.5x
- Consistent daily activity: 1.2x
- First-time protocol user: 1.3x
- High-value transactions: 1.4x
- Multi-chain activity: 1.1x
```

---

## 7. User Journey Integration

### **Wallet Connection & Verification:**
- Users connect wallet via Web3 provider (MetaMask, WalletConnect)
- Store wallet address in database linked to user profile
- Optional: Link social media accounts for off-chain tracking

### **Activity Aggregation:**
- Backend continuously monitors linked wallet addresses
- Combines on-chain activity points with social media engagement
- Real-time dashboard showing current campaign standing

### **Privacy & Security:**
- No private key storage - only public wallet addresses
- Users maintain full custody of their assets
- Optional social media linking for enhanced rewards

---

# 🚀 Summary of Responsibilities
- **Brands:**
  - `createCampaign`, `fundCampaign`, `refundUnused`.
- **Oracle (backend):**
  - `publishResults`, monitor on-chain activities, calculate point scores.
- **Users:**
  - `claimReward`, perform on-chain activities, engage in social media.
- **Everyone (read-only):**
  - `getCampaign`, `hasClaimed`.


`// Example output from your scoring algorithm
const userRewards = [
    { address: '0xAlice...', amount: 100 },
    { address: '0xBob...', amount: 250 },
    { address: '0xCharlie...', amount: 75 }
];`