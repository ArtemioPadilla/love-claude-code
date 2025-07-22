/**
 * OAuth Bridge Service
 * 
 * Since Claude Code OAuth only accepts specific redirect URIs (localhost:54545),
 * we need to provide instructions for users to handle the OAuth flow manually
 * or run a local bridge server.
 */

export class ClaudeOAuthBridge {
  /**
   * Generate instructions for manual OAuth flow
   */
  static getManualInstructions(): string {
    return `
# Claude OAuth Manual Setup

Since the Claude Code OAuth client only accepts specific redirect URIs, 
you'll need to complete the authentication manually:

1. Click "Authorize" on the Claude authorization page
2. You'll be redirected to https://console.anthropic.com/oauth/code/callback
3. Copy the entire URL from your browser
4. Come back to this app and paste the URL in the field below

The URL will look like:
https://console.anthropic.com/oauth/code/callback?code=XXXXX#XXXXX
(Note: The state may appear after the # symbol)
    `.trim()
  }

  /**
   * Extract OAuth code and state from callback URL
   */
  static extractOAuthParams(callbackUrl: string): { code: string; state: string } | null {
    try {
      const url = new URL(callbackUrl)
      const code = url.searchParams.get('code')
      
      // State might be in the hash fragment
      let state = url.searchParams.get('state')
      if (!state && url.hash) {
        // Remove the leading # and use the hash as state
        state = url.hash.substring(1)
      }
      
      if (!code || !state) {
        console.error('Missing OAuth params:', { code: !!code, state: !!state, url: callbackUrl })
        return null
      }
      
      return { code, state }
    } catch (error) {
      console.error('Failed to parse OAuth callback URL:', error)
      return null
    }
  }

  /**
   * Instructions for running a local bridge server
   */
  static getBridgeServerInstructions(): string {
    return `
# Alternative: Run OAuth Bridge Server

You can run a simple bridge server to handle the OAuth callback:

\`\`\`bash
# Create a simple Node.js server
npx http-server -p 54545 --cors
\`\`\`

Then create an index.html file at http://localhost:54545/callback:
\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>OAuth Callback</title>
  <script>
    // Redirect to our app with the OAuth params
    const params = new URLSearchParams(window.location.search);
    window.location.href = 'http://localhost:3000/oauth/callback?' + params.toString();
  </script>
</head>
<body>
  <p>Redirecting...</p>
</body>
</html>
\`\`\`
    `.trim()
  }
}