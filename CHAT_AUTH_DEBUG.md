# Chat Authentication Debug Guide

## The Issue
The chat is showing a "NO_AUTH_TOKEN" error, indicating that authentication headers are not being sent properly.

## Debug Steps

1. **Open Browser Console** (F12 or Cmd+Option+I)

2. **Check Console Logs**
   When you send a chat message, you should see:
   ```
   Chat request - Auth method: oauth-max
   Chat request - Has OAuth creds: true
   Using OAuth authentication
   Request headers: {"Content-Type": "application/json", "X-Claude-Auth": "Bearer ..."}
   ```

3. **If you see "No authentication credentials available"**:
   - Go to Settings → AI Settings
   - Make sure you're authenticated with Claude Max
   - Click "Save Settings" after authentication

4. **Check Network Tab**:
   - Look for the request to `/api/v1/claude/chat`
   - Check Request Headers for either:
     - `X-Claude-Auth: Bearer <token>` (for OAuth)
     - `Authorization: Bearer <token>` (for JWT)

## Common Issues

### Issue 1: No OAuth Credentials
If console shows `Has OAuth creds: false`:
- You need to authenticate with Claude Max in Settings
- Make sure to complete the OAuth flow
- Save settings after authentication

### Issue 2: No JWT Token
If you're not using OAuth:
- You need to either:
  - Login with username/password (creates JWT token)
  - OR use OAuth authentication
  - OR add an API key in settings

### Issue 3: Headers Not Being Sent
If headers are missing in the network request:
- The fetch request might not be including headers properly
- Check that `X-Claude-Auth` header is present

## Testing Authentication

1. **Test OAuth Token** (if using OAuth):
   - Go to Settings → AI Settings
   - In the OAuth Tester section, click "Run OAuth Tests"
   - This will show if your OAuth token is valid

2. **Test Chat**:
   - Open browser console
   - Send a simple message like "Hello"
   - Watch console logs for authentication details
   - Check network tab for the actual request

## Quick Fix

If you're still having issues:

1. **Clear Everything**:
   ```javascript
   // Run in browser console
   localStorage.clear()
   location.reload()
   ```

2. **Re-authenticate**:
   - Go to Settings
   - Choose your authentication method
   - Complete the flow
   - Save settings
   - Try chat again

## What's Happening

The system supports three authentication methods:
1. **JWT Token**: From login (username/password)
2. **OAuth Token**: From Claude Max authentication  
3. **API Key**: Direct Anthropic API key

The chat needs at least one of these to work. The error suggests none are present or being sent correctly.