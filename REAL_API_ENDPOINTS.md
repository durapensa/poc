# Real Claude API Endpoints Discovery

## 🎯 Key Findings

### Conversation List Endpoint
```
GET https://claude.ai/api/organizations/{org_id}/chat_conversations?limit=30&starred=true
```

**Organization ID Found**: `1ada8651-e431-4f80-b5da-344eb1d3d5fa`

### Required Headers
```
Content-Type: application/json
anthropic-client-platform: web_claude_ai
anthropic-client-version: unknown
anthropic-client-sha: unknown
anthropic-device-id: {device_id}
anthropic-anonymous-id: {anonymous_id}
```

### Authentication
- **Primary**: `sessionKey=sk-ant-sid01-...` in Cookie header
- **Device ID**: `anthropic-device-id=9e375fc5-ab10-418c-ac42-141811bc1825`
- **Anonymous ID**: `anthropic-anonymous-id=dc893078-42fd-4638-9048-3a30469b5933`

### Query Parameters
- `limit=30` - Number of conversations to fetch
- `starred=true` - Filter for starred conversations (may need `false` for all)

## 🔍 Key Differences from Our Guesses

1. **Path Structure**: `/api/organizations/{org_id}/chat_conversations` ✅ (We guessed correctly!)
2. **Authentication**: Uses `sessionKey` cookie ✅ (We had this right!)
3. **Special Headers**: Requires anthropic-specific headers (We missed these!)
4. **Query Parameters**: Uses limit and starred filters (We didn't know about these!)

## 🚀 Next Steps

1. **Update API Client** with real headers and endpoint structure
2. **Test with starred=false** to get all conversations
3. **Capture more endpoints** for messages, sending, etc.

## 📝 Headers Template for Implementation
```typescript
{
  'Content-Type': 'application/json',
  'anthropic-client-platform': 'web_claude_ai',
  'anthropic-client-version': 'unknown',
  'anthropic-client-sha': 'unknown',
  'anthropic-device-id': deviceId,
  'anthropic-anonymous-id': anonymousId,
  'Cookie': `sessionKey=${sessionToken}`,
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36...',
  'Referer': 'https://claude.ai/',
  'Origin': 'https://claude.ai'
}
```

This is a huge breakthrough! Our guessed endpoint structure was actually correct - we just needed the anthropic-specific headers.