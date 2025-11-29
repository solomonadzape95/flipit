# Ngrok and WalletConnect Issues Guide

## Yes, ngrok can cause WalletConnect to fail

Common issues when using ngrok with WalletConnect:

### 1. **WebSocket Connection Issues**
- WalletConnect relies on WebSocket connections for real-time communication
- ngrok's free tier can have WebSocket connection timeouts or drops
- Solution: Use ngrok's paid tier or configure WebSocket support

### 2. **CORS Problems**
- ngrok might not properly forward CORS headers
- WalletConnect requests might be blocked
- Solution: Configure ngrok with proper headers

### 3. **Redirect URI Mismatches**
- WalletConnect project settings require specific redirect URIs
- ngrok URLs change on each restart (free tier)
- Solution: Use static ngrok domains or update WalletConnect project settings

### 4. **HTTPS Certificate Issues**
- ngrok's SSL certificates might not be trusted by all wallets
- Mixed content warnings
- Solution: Use ngrok's HTTPS URLs consistently

## For Minipay Testing: You Don't Need WalletConnect!

**Good news:** Since Minipay uses the **injected connector** (exposes `window.ethereum`), it works independently of WalletConnect. You can disable WalletConnect when testing with Minipay.

## Solutions

### Option 1: Disable WalletConnect (Recommended for Minipay)

Simply don't set the `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` environment variable:

```env
# Comment out or remove this line
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

The app will only use the injected connector, which works perfectly with Minipay through ngrok.

### Option 2: Configure ngrok for WebSocket Support

If you need WalletConnect, use ngrok with WebSocket support:

```bash
# Start ngrok with WebSocket support
ngrok http 3000 --scheme=https

# Or use ngrok config file
ngrok start --all --config=ngrok.yml
```

Create `ngrok.yml`:
```yaml
version: "2"
authtoken: YOUR_NGROK_AUTH_TOKEN
tunnels:
  web:
    proto: http
    addr: 3000
    inspect: true
    bind_tls: true
```

### Option 3: Use Static ngrok Domain (Paid)

1. Sign up for ngrok paid plan
2. Reserve a static domain: `your-app.ngrok.io`
3. Update WalletConnect project settings with this static URL
4. Use the static domain for testing

### Option 4: Update WalletConnect Project Settings

If using WalletConnect with ngrok:

1. Go to [WalletConnect Cloud Dashboard](https://cloud.walletconnect.com/)
2. Find your project
3. Add your ngrok URL to **Allowed Domains**:
   - `https://your-ngrok-url.ngrok.io`
   - `https://*.ngrok.io` (wildcard, if supported)
4. Update **Redirect URIs** if needed

## Testing with Minipay (Recommended Approach)

Since you're testing with Minipay, the simplest solution is:

1. **Disable WalletConnect** - Remove or comment out `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
2. **Use ngrok normally** - Minipay's injected connector will work fine
3. **Test the app** - Everything should work through ngrok

### Steps:

```bash
# 1. Make sure WalletConnect is disabled in .env
# (Don't set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID)

# 2. Start your dev server
pnpm dev

# 3. Start ngrok
ngrok http 3000

# 4. Use the ngrok HTTPS URL in Minipay
# The injected connector will work perfectly!
```

## Troubleshooting

### WalletConnect Modal Not Appearing
- Check browser console for errors
- Verify ngrok URL is HTTPS (not HTTP)
- Check WalletConnect project settings

### Connection Timeout
- WebSocket connection issue with ngrok
- Try disabling WalletConnect and use injected only
- Or upgrade to ngrok paid plan

### CORS Errors
- Add ngrok URL to WalletConnect allowed domains
- Check ngrok headers configuration
- Verify HTTPS is used consistently

### Minipay Not Connecting
- This is **NOT** a WalletConnect issue - Minipay uses injected connector
- Check if `window.ethereum` is available
- Verify you're using HTTPS ngrok URL
- Check Minipay developer mode is enabled

## Best Practice for Development

For Minipay testing, use this setup:

```env
# .env.local
# Don't set WalletConnect - not needed for Minipay
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

# Your other env vars
NEXT_PUBLIC_CELO_NETWORK=sepolia
DATABASE_URL=...
```

This way:
- ✅ Minipay works perfectly through ngrok
- ✅ No WalletConnect complications
- ✅ Simpler setup
- ✅ Faster connection

## Production Considerations

For production:
- Use a real domain (not ngrok)
- Configure WalletConnect properly with your production domain
- Set up proper CORS and security headers
- Use static ngrok domains only for staging/testing

