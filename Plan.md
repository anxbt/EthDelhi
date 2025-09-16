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

# 🚀 Summary of Responsibilities
- **Brands:**
  - `createCampaign`, `fundCampaign`, `refundUnused`.
- **Oracle (backend):**
  - `publishResults`.
- **Users:**
  - `claimReward`.
- **Everyone (read-only):**
  - `getCampaign`, `hasClaimed`.

