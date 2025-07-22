# Using Claude Max with Love Claude Code

## Current Status

While OAuth tokens from claude.ai cannot be used directly with the Anthropic API, there are several ways to use your Claude Max subscription with Love Claude Code:

## Option 1: Claude Code CLI Integration (Recommended)

The Claude Code CLI is already integrated into Love Claude Code as a fallback authentication method.

### Setup Instructions

1. **Install Claude Code CLI** (if not already installed):
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. **Authenticate Claude Code CLI**:
   ```bash
   claude setup-token
   ```
   This will open your browser and authenticate with your Claude Max account.

3. **Use Love Claude Code normally**:
   - When you authenticate with OAuth in Love Claude Code
   - If the OAuth token fails with the API (which it will)
   - The system automatically falls back to using Claude Code CLI
   - Your messages will be processed through the CLI

### How It Works

When you send a message in Love Claude Code with OAuth authentication:
1. First tries the OpenCode approach with special headers
2. Then tries the custom OAuth client
3. Finally falls back to Claude Code CLI (if installed and authenticated)

The Claude Code CLI uses its own authentication mechanism that works with Claude Max subscriptions.

## Option 2: Use API Keys

While not using your Claude Max subscription directly, you can:
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Add it in Love Claude Code Settings → AI Settings

## Option 3: Future Enhancement - Claude Code Token

We're planning to add a new authentication method that would:
1. Let you run `claude setup-token` to generate a token
2. Copy that token into Love Claude Code
3. Use it directly without needing the CLI installed

## Troubleshooting

### Check if Claude Code CLI is working:
```bash
claude -p "Hello, are you working?"
```

### Check Love Claude Code logs:
When using OAuth, look for these messages in the console:
- "Claude Code restriction detected - trying alternative OAuth approach"
- "Attempting Claude Code CLI approach..."
- "Claude Code CLI is installed, using CLI wrapper"

### Common Issues:
1. **CLI not detected**: Make sure Claude Code is in your PATH
2. **CLI not authenticated**: Run `claude setup-token` again
3. **Still getting mock responses**: Check the backend logs for errors

## Technical Details

The OAuth tokens from claude.ai are designed for the web chat interface and have restrictions:
- They include the header: "This credential is only authorized for use with Claude Code"
- They cannot be used with the standard Anthropic API
- They work only with the Claude Code CLI or specific Claude Code integrations

Love Claude Code detects this restriction and automatically falls back to the CLI integration, allowing you to use your Claude Max subscription indirectly.