# Celo/Minipay Conversion Guide

This guide explains how to convert your app from Base Sepolia to Celo and make it compatible with Minipay wallet.

## Changes Made

### 1. Chain Configuration (`src/wagmi.ts`)
- **Before**: Used `baseSepolia` chain and `baseAccount` connector
- **After**: Uses `celoAlfajores` (testnet) or `celo` (mainnet) with `injected` connector
- Minipay works as an injected wallet (exposes `window.ethereum`), so the standard `injected()` connector works perfectly

### 2. USDC Token Address (`src/lib/usdc.ts`)
- **Before**: Base Sepolia USDC address
- **After**: Celo USDC addresses:
  - **Alfajores (testnet)**: `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`
  - **Mainnet**: `0xceba9300f2b8917101d6b8906b8c0b4b8e8b0b0b`

### 3. Wallet Connection (`src/app/page.tsx`)
- **Removed**: Base Account sub-account logic
- **Simplified**: Now uses standard wallet address directly
- **Removed**: Spend permission functionality (Base Account feature)

### 4. Chain References
- Updated `src/lib/faucet.ts` to use Celo chains
- Updated `src/app/api/payouts/daily/route.ts` to use Celo chains

### 5. Faucet Implementation (`src/app/api/faucet/route.ts`)
- **Before**: Used Coinbase CDP SDK (Base-specific)
- **After**: Uses direct viem wallet client to send USDC from a faucet wallet
- Requires `FAUCET_PRIVATE_KEY` environment variable (private key of wallet that holds USDC for distribution)

## Environment Variables

Add these to your `.env.local`:

```env
# Network selection (testnet or mainnet)
NEXT_PUBLIC_CELO_NETWORK=alfajores  # or "mainnet"

# Optional: WalletConnect Project ID (if you want WalletConnect support)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Faucet private key (for testnet faucet functionality)
# This should be a wallet that holds USDC for distribution
FAUCET_PRIVATE_KEY=0x...
```

## Testing with Minipay

### 1. Install Minipay
- Download Minipay from [Google Play](https://play.google.com/store/apps/details?id=com.minipay.app) or [App Store](https://apps.apple.com/app/minipay-stablecoin-wallet/id6449436345)

### 2. Enable Developer Mode
1. Open Minipay app
2. Go to Settings → About
3. Tap the version number 7 times
4. Go back to Settings → Developer Settings
5. Enable "Developer Mode"
6. Toggle "Use Testnet" to connect to Alfajores testnet

### 3. Test Your App
1. Use `ngrok` or similar to expose your local dev server:
   ```bash
   ngrok http 3000
   ```
2. In Minipay Developer Settings, tap "Load Test Page"
3. Enter your app's URL (the ngrok URL)
4. Tap "Go" to launch your app

### 4. Get Testnet Tokens
- Visit [Celo Alfajores Faucet](https://faucet.celo.org/alfajores) to get testnet CELO
- Exchange CELO for USDC using [Mento](https://www.mento.org/) or similar DEX

## Key Differences from Base Account

1. **No Sub-Accounts**: Celo uses standard EOA (Externally Owned Accounts), not smart contract wallets with sub-accounts
2. **No Spend Permissions**: Each transaction requires user approval (standard wallet behavior)
3. **Direct Wallet Connection**: Users connect their wallet directly, no embedded wallet creation
4. **Fee Abstraction**: Minipay supports fee abstraction, but transactions still require user approval

## Deployment

When deploying to production:

1. Set `NEXT_PUBLIC_CELO_NETWORK=mainnet` in your environment variables
2. Update the USDC address in `src/lib/usdc.ts` if needed (already configured)
3. Ensure your backend faucet (if used) supports Celo mainnet
4. Update any explorer URLs to use Celo explorers:
   - [CeloScan](https://celoscan.io/) for mainnet
   - [Alfajores Explorer](https://alfajores.celoscan.io/) for testnet

## Additional Resources

- [Celo Documentation](https://docs.celo.org/)
- [Minipay Developer Guide](https://docs.minipay.xyz/)
- [Building for Minipay](https://docs.celo.org/build/build-on-minipay/quickstart)
- [Wagmi Celo Integration](https://wagmi.sh/core/chains/celo)

