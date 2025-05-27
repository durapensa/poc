# Manual Token Extraction Guide

## Overview
Due to Chrome's cookie encryption, you'll need to manually extract authentication tokens from your browser. This guide provides step-by-step instructions for getting the required tokens from Claude's web interface.

## Prerequisites
- You must be logged in to [claude.ai](https://claude.ai) in your browser
- You must have Chrome or another browser with developer tools

## Step-by-Step Instructions

### 1. Open Claude.ai and Developer Tools

1. **Navigate to Claude.ai**: Go to https://claude.ai in your browser
2. **Ensure you're logged in**: You should see your conversations and be able to chat
3. **Open Developer Tools**: 
   - **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
   - **Firefox**: Press `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
   - **Safari**: Press `Cmd+Option+I` (Mac) - you may need to enable developer tools first

### 2. Extract Session Token

#### Method 1: From Cookies (Recommended)
1. In Developer Tools, click the **Application** tab (Chrome) or **Storage** tab (Firefox)
2. In the left sidebar, expand **Cookies**
3. Click on **https://claude.ai**
4. Look for a cookie named `sessionKey` or similar session-related cookie
5. **Copy the value** (click on the value field and copy the entire string)

#### Method 2: From Network Requests
1. In Developer Tools, click the **Network** tab
2. **Refresh the page** or send a message in Claude
3. Look for requests to `claude.ai` API endpoints
4. Click on one of the requests (usually to `/api/` endpoints)
5. In the **Headers** section, find the **Request Headers**
6. Look for `Cookie:` header and find the session token value

#### Method 3: From Local Storage
1. In Developer Tools, click the **Application** tab (Chrome) or **Storage** tab (Firefox)
2. In the left sidebar, expand **Local Storage**
3. Click on **https://claude.ai**
4. Look for keys containing `session`, `auth`, or `token`
5. **Copy the value** from any session-related entries

### 3. Extract Organization ID

#### Method 1: From URL
1. **Look at the browser URL** when you're in a conversation
2. The URL often contains the organization ID in this format:
   ```
   https://claude.ai/chat/org-ABC123XYZ789...
   ```
3. **Copy the org ID**: The part that starts with `org-` (e.g., `org-ABC123XYZ789`)

#### Method 2: From Network Requests
1. In the **Network** tab, look for API requests
2. Check request URLs for organization IDs starting with `org-`
3. **Copy the org ID** from the URL path

#### Method 3: From Local Storage
1. In **Local Storage** for claude.ai
2. Look for keys containing `organization`, `org`, or similar
3. **Copy the organization ID** value

### 4. Common Token Patterns

**Session Token Examples:**
- Long alphanumeric strings (50+ characters)
- May start with prefixes like `sk-`, `sess-`, or similar
- Usually contains mixed case letters and numbers

**Organization ID Examples:**
- Always starts with `org-`
- Followed by alphanumeric string
- Example: `org-ABC123XYZ789DEF456`

**CSRF Token (Optional):**
- May be needed for some API calls
- Often shorter than session tokens
- Look for `csrf`, `xsrf`, or similar in cookies/headers

## Security Notes

⚠️ **Important Security Considerations:**

1. **Keep tokens private**: Never share your session tokens with others
2. **Tokens expire**: Session tokens typically expire after 24-48 hours
3. **Re-extract when needed**: You may need to repeat this process periodically
4. **Use on trusted devices only**: Only extract tokens on your own devices
5. **Log out to invalidate**: Logging out of Claude will invalidate your tokens

## Troubleshooting

### Common Issues

**Can't find session token:**
- Make sure you're logged in to Claude
- Try refreshing the page and checking Network requests
- Look in different storage locations (cookies, localStorage, sessionStorage)

**Token doesn't work:**
- Verify you copied the complete token without extra spaces
- Check if you're still logged in to Claude
- Try extracting a fresh token

**Organization ID missing:**
- Some personal accounts may not have explicit org IDs
- Try using the string "unknown" as a placeholder
- Check if you're part of a team/organization in Claude

**Developer tools not showing data:**
- Refresh the page after opening developer tools
- Try sending a message in Claude to generate network activity
- Clear browser cache and try again

### Getting Help

If you're having trouble extracting tokens:

1. **Check browser compatibility**: Ensure you're using a supported browser
2. **Try incognito mode**: Sometimes extensions interfere with token extraction
3. **Clear browser data**: Clear cookies and cache, then log back in
4. **Try different extraction method**: If cookies don't work, try localStorage or network requests

## Using Extracted Tokens

Once you have your tokens:

```bash
# Run POC init with manual token input
poc init --manual

# Follow the prompts to enter:
# 1. Session token
# 2. Organization ID (or "unknown")
# 3. Optional CSRF token
```

The POC tool will validate your tokens and save them securely to `~/.poc/auth.json` for future use.

---

**Need more help?** Check the troubleshooting section or refer to the POC documentation for additional guidance.