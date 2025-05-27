# Browser API Discovery Guide

## Step-by-Step Instructions

### 1. Prepare Browser Environment
1. **Open Chrome** (make sure you're logged into claude.ai)
2. **Open DevTools**: Press `F12` or `Cmd+Option+I` (Mac)
3. **Go to Network tab**
4. **Clear existing requests**: Click the clear button (🚫)
5. **Filter by XHR/Fetch**: Click the "XHR" button to show only API requests

### 2. Capture Conversation List API
1. **Navigate to claude.ai** (or refresh if already there)
2. **Look for API requests** in the Network tab as the page loads
3. **Find conversation list requests** - look for requests that return conversation data

**What to look for:**
- URLs containing "conversation", "chat", "list"
- JSON responses with conversation arrays
- GET requests that happen on page load

### 3. Capture Conversation Actions
1. **Open a specific conversation** (click on an existing chat)
2. **Send a new message** in the conversation
3. **Create a new conversation** if possible

**What to capture:**
- Conversation opening/loading requests
- Message sending requests (likely POST)
- New conversation creation requests

### 4. Extract Key Information
For each API request found, capture:

#### Request Details
- **Full URL** (including query parameters)
- **HTTP Method** (GET, POST, PUT, etc.)
- **Request Headers** (especially authentication-related)
- **Request Body** (for POST requests)

#### Response Details
- **Response Status** (200, etc.)
- **Response Headers**
- **Response Body** (JSON structure)

### 5. Export Request as cURL
1. **Right-click on a request** in Network tab
2. **Copy → Copy as cURL**
3. **Paste into a text file** for analysis

## Key Things to Look For

### Authentication Headers
- `Cookie:` header with session tokens
- `Authorization:` header
- `X-CSRF-Token:` or similar CSRF protection
- `User-Agent:` and other browser headers

### Common API Patterns
```
GET /api/organizations/{org_id}/conversations
GET /api/conversations
POST /api/conversations
GET /api/conversations/{conv_id}/messages
POST /api/conversations/{conv_id}/messages
```

### Response Formats
Look for JSON like:
```json
{
  "conversations": [...],
  "messages": [...],
  "uuid": "conv_...",
  "organization_uuid": "org_..."
}
```

## Quick Discovery Session

Once you capture the requests, paste them here and I'll help analyze them to update our API client!

### Expected Findings
- **Base URL**: Likely `https://claude.ai/api` or similar
- **Conversation List**: GET request with conversations array
- **Authentication**: Session cookie or Bearer token
- **Organization ID**: In URL path or request body

Let me know what API requests you find!