# Fee and Payout System Documentation

## Where Game Fees Are Sent

**Treasury Address:** `0x04823b9e53F6e921BcBf49737ed94aec3f2778ef`

All entry fees (0.01 cUSD per game) are sent directly to this treasury address when players pay to play.

### Fee Flow:
1. Player clicks "Pay & Start" → Pays 0.01 cUSD
2. Transaction sends cUSD from player's wallet → `TREASURY_ADDRESS`
3. Funds accumulate in the treasury wallet throughout the day

## Payout Distribution System

### Distribution Rules:
- **80%** of daily fees are distributed to top 3 players
- **20%** is kept as platform fee (stays in treasury)
- Distribution split:
  - **1st place:** 50% of distributable pool (40% of total fees)
  - **2nd place:** 30% of distributable pool (24% of total fees)
  - **3rd place:** 20% of distributable pool (16% of total fees)

### Example:
If 100 games are played in a day:
- Total fees: 100 × 0.01 = 1.0 cUSD
- Distributable: 1.0 × 0.8 = 0.8 cUSD
- Platform keeps: 0.2 cUSD
- 1st place gets: 0.8 × 0.5 = 0.4 cUSD
- 2nd place gets: 0.8 × 0.3 = 0.24 cUSD
- 3rd place gets: 0.8 × 0.2 = 0.16 cUSD

## Current Payout API

**Endpoint:** `POST /api/payouts/daily`

**What it does:**
1. Counts all plays from today (UTC day)
2. Calculates total fees and distributable amount (80%)
3. Finds top 3 fastest scores from today
4. Sends cUSD from treasury wallet to winners
5. Returns transaction hashes

**Requirements:**
- `TREASURY_PRIVATE_KEY` environment variable must be set
- The private key must correspond to the `TREASURY_ADDRESS`
- Treasury wallet must have sufficient cUSD balance to cover payouts

## ⚠️ Critical Setup Requirements

### 1. Treasury Wallet Setup

**IMPORTANT:** The `TREASURY_ADDRESS` and `TREASURY_PRIVATE_KEY` must match!

```bash
# In your .env file:
TREASURY_PRIVATE_KEY=0x...  # Private key for 0x04823b9e53F6e921BcBfItems37ed94aec3f2778ef
```

**To verify:**
1. Get the address from the private key: `npx viem wallet address --private-key <your-key>`
2. Ensure it matches `TREASURY_ADDRESS` in `src/lib/constants.ts`

### 2. Fund the Treasury Wallet

The treasury wallet needs:
- **cUSD balance** to pay out winners (should accumulate from entry fees)
- **CELO balance** for gas fees to send transactions

## Automation Setup

**Currently, the payout API is NOT automated.** You need to set up a scheduled job.

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/payouts/daily",
      "schedule": "0 0 * * *"
    }
  ]
}
```

This runs daily at midnight UTC.

### Option 2: External Cron Service

Use a service like:
- **Cron-job.org** - Free cron service
- **EasyCron** - Reliable cron service
- **GitHub Actions** - If using GitHub

Set up a daily HTTP request to:
```
POST https://your-domain.com/api/payouts/daily
```

### Option 3: Manual Execution

You can manually trigger payouts by calling the API:

```bash
# Using curl
curl -X POST https://your-domain.com/api/payouts/daily

# Or using a script
node scripts/trigger-payout.js
```

## Security Considerations

### ⚠️ Private Key Security

1. **Never commit `TREASURY_PRIVATE_KEY` to Git**
2. Store it securely in environment variables
3. Use a dedicated wallet for treasury (not your personal wallet)
4. Consider using a hardware wallet or multisig for production

### ⚠️ Treasury Balance Monitoring

Set up alerts to monitor:
- Treasury cUSD balance (should grow from fees)
- Treasury CELO balance (needs gas for payouts)
- Failed payout transactions

### ⚠️ Payout Verification

After each payout:
1. Check transaction hashes in response
2. Verify on CeloScan: https://sepolia.celoscan.io
3. Confirm winners received correct amounts
4. Log payout results for accounting

## Testing the Payout System

### Manual Test:

```bash
# 1. Make sure you have test data (some plays and scores from today)
# 2. Call the API
curl -X POST http://localhost:3000/api/payouts/daily

# Expected response:
{
  "ok": true,
  "playsToday": 10,
  "distributableUsd": 0.08,
  "txs": ["0x...", "0x...", "0x..."]
}
```

### Verify in Database:

```sql
-- Check today's plays
SELECT COUNT(*) FROM "Play" 
WHERE "startTime" >= CURRENT_DATE;

-- Check today's top 3 scores
SELECT * FROM "Score" 
WHERE "createdAt" >= CURRENT_DATE 
ORDER BY "finalTimeMs" ASC 
LIMIT 3;
```

## Troubleshooting

### "Missing TREASURY_PRIVATE_KEY"
- Add `TREASURY_PRIVATE_KEY` to your `.env` file
- Restart your server

### "Insufficient balance" errors
- Check treasury wallet has enough cUSD
- Check treasury wallet has CELO for gas
- Verify the private key matches the treasury address

### "Nothing to distribute"
- No plays today, or
- No scores submitted today
- This is normal if no one played

### Payouts not running automatically
- Set up cron job (see Automation Setup above)
- Check cron service logs
- Verify API endpoint is accessible

## Recommended Improvements

1. **Add payout logging** - Store payout history in database
2. **Add payout status tracking** - Track which days have been paid
3. **Add admin dashboard** - View treasury balance, payout history
4. **Add email/notification** - Alert when payouts complete
5. **Add retry logic** - Retry failed transactions
6. **Add multi-sig support** - For production security

