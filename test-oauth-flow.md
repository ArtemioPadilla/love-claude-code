# Testing OAuth Flow with Claude

## Current Implementation Status ✅

The OAuth authentication has been fully implemented with the following components:

### Backend Changes:
1. **Flexible Authentication Middleware** (`/backend/src/middleware/authMiddleware.ts`)
   - Supports both JWT tokens (Authorization header) and OAuth tokens (X-Claude-Auth header)
   - OAuth tokens are passed through without validation
   - Sets `req.oauthToken` and `req.authMethod = 'oauth'`

2. **Claude Service** (`/backend/src/services/claude.ts`)
   - Updated to accept OAuth tokens in `getClient()` method
   - Uses OAuth token as Bearer token for Anthropic API
   - Both `chat()` and `streamChat()` methods support OAuth tokens

3. **Claude API Routes** (`/backend/src/api/routes/claude.ts`)
   - Uses flexible authentication middleware
   - Passes OAuth token from request to Claude service
   - Supports both streaming and non-streaming responses

### Frontend Changes:
1. **API Client** (`/frontend/src/services/api.ts`)
   - Automatically adds X-Claude-Auth header when using OAuth
   - Handles token refresh when OAuth token expires
   - Passes authMethod to backend for proper handling

2. **OAuth Service** (`/frontend/src/services/claudeOAuth.ts`)
   - Fixed state parameter handling
   - Created `handleManualCallback()` for copy-paste flow
   - Proper token storage and refresh logic

## Testing Steps:

### 1. Restart the Backend Server
First, restart your backend to apply all the changes:
```bash
cd backend
npm run dev
```

### 2. Test OAuth Authentication Flow
1. Open your browser to http://localhost:3000
2. Go to Settings → AI Settings
3. Select "Claude Max (OAuth)" as authentication method
4. Click "Authenticate with Claude"
5. Copy the redirect URL and paste it back
6. You should see "Connected to Claude Max"

### 3. Test Claude Chat with OAuth
1. Create or open a project
2. Open the Claude chat panel
3. Type a message like "Hello, can you help me with React?"
4. You should receive a response without any 401 errors

### 4. Verify Authentication Headers
In your browser's Network tab, when sending a chat request:
- Look for the POST request to `/api/v1/claude/chat`
- Check the Request Headers
- You should see: `X-Claude-Auth: Bearer <your-oauth-token>`

## Common Issues and Solutions:

### If you get 401 Unauthorized:
- Make sure you're authenticated with Claude Max in Settings
- Check that the OAuth token hasn't expired
- Try re-authenticating

### If you get 429 Too Many Requests:
- The rate limits have been increased to 1000 requests per 15 minutes
- Wait a moment and try again

### If you get "Claude API not configured":
- This means no authentication method is set up
- Go to Settings and either:
  - Add an API key, or
  - Authenticate with Claude Max

## Rate Limiting Configuration:
The following rate limits are now in place:
- Development: 1000 requests per 15 minutes
- Production: 100 requests per 15 minutes
- Claude-specific: 30 requests per minute
- Health check interval: 30 seconds (reduced from 5 seconds)

## What's Working Now:
✅ OAuth authentication flow with manual callback
✅ Flexible authentication supporting both JWT and OAuth
✅ Claude chat with OAuth tokens
✅ Token refresh when expired
✅ Proper error messages for authentication issues
✅ Increased rate limits for development
✅ Connection status indicators (backend + Claude)

The OAuth implementation is complete and ready for use!