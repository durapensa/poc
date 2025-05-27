# Phase 3: Chat API Discovery

## Need to Capture: Message Sending Endpoint

To build the interactive chat, we need to discover how Claude sends messages and receives responses.

### Quick Discovery Session

**Please do this in your browser:**

1. **Open claude.ai and go to any existing conversation**
2. **Open DevTools (F12) → Network tab → Clear requests → Filter to XHR**
3. **Send a message** (anything like "Hello")
4. **Look for the API request** that sends the message
5. **Copy as cURL** the message sending request

### What to Look For

**Expected endpoint patterns:**
- `POST /api/append_message`
- `POST /api/organizations/{org}/conversations/{id}/messages`
- Something with "message", "send", or "append"

**Expected request body:**
```json
{
  "conversation_uuid": "conv_123...",
  "text": "Hello",
  "organization_uuid": "org_123..."
}
```

**Expected response:**
- Streaming response (Server-Sent Events)
- Or JSON with message ID and response text

### What I Need

Just **one working curl command** for sending a message, and I'll implement the complete chat interface!

The message sending API is the final piece we need to complete the interactive chat experience.