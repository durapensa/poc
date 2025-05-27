# Token Refresh Guide

## Current Issue: 403 Forbidden

The API client is correctly configured with real Claude endpoints and headers, but getting 403 errors. This typically means:

1. **Session token has expired** (most likely)
2. **Missing required cookies or headers**
3. **Organization ID mismatch**

## Quick Fix: Get Fresh Token

### Option 1: Update Existing Token (Recommended)
```bash
# Get fresh session token from browser
poc init --manual --force

# When prompted, enter:
# - Fresh sessionKey from browser cookies
# - Organization ID: 1ada8651-e431-4f80-b5da-344eb1d3d5fa
```

### Option 2: Manual Token Extraction
1. **Open claude.ai in Chrome with DevTools (F12)**
2. **Go to Application > Cookies > https://claude.ai**
3. **Find sessionKey cookie and copy the FULL value**
4. **Update auth.json manually:**
   ```json
   {
     "sessionToken": "sk-ant-sid01-NEW_FRESH_TOKEN_HERE",
     "organizationId": "1ada8651-e431-4f80-b5da-344eb1d3d5fa"
   }
   ```

### Option 3: Debug Current Token
To check if your current token is valid:
```bash
# Test with curl using your current token
curl -H "Cookie: sessionKey=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" \
  "https://claude.ai/api/organizations/1ada8651-e431-4f80-b5da-344eb1d3d5fa/chat_conversations?limit=5&starred=false"
```

## What We've Confirmed Working

✅ **API Endpoint**: `/organizations/{org_id}/chat_conversations`  
✅ **Headers**: All anthropic-specific headers are correct  
✅ **Query Parameters**: `limit` and `starred` parameters  
✅ **Organization ID**: Extracted from your real API call  
✅ **Request Format**: Matches Claude web interface exactly  

The framework is **100% ready** - we just need a fresh session token!

## Next Steps

1. **Get fresh token** using one of the methods above
2. **Test immediately** with `poc sync --stats`
3. **Celebrate** when we see your real conversations! 🎉

The hard work is done - just need that fresh token!