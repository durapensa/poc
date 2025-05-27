# Claude Web API Discovery Findings

## Discovery Status
- Direct web scraping blocked (403 Forbidden)
- Using documentation analysis and common API patterns
- Implementing based on expected Claude web interface structure

## Expected API Endpoints

Based on typical chat application patterns and the documentation analysis:

### Base URL
```
https://claude.ai/api
```

### Authentication
- **Session Token**: Extracted from browser cookies/localStorage
- **Headers Required**:
  - `Cookie: sessionKey=<token>` 
  - `Authorization: Bearer <token>` (alternative)
  - `User-Agent: Mozilla/5.0...` (browser mimicking)
  - `Referer: https://claude.ai/`
  - `Origin: https://claude.ai`

### Conversation Management Endpoints

#### List Conversations
```http
GET /api/organizations/{org_id}/chat_conversations
```
**Expected Response**:
```json
{
  "conversations": [
    {
      "uuid": "conv_abc123",
      "name": "Conversation Title",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z",
      "organization_uuid": "org-xyz789"
    }
  ]
}
```

#### Get Conversation Details
```http
GET /api/organizations/{org_id}/chat_conversations/{conv_id}
```

#### Create New Conversation
```http
POST /api/organizations/{org_id}/chat_conversations
Content-Type: application/json

{
  "name": "New Conversation"
}
```

#### Send Message
```http
POST /api/append_message
Content-Type: application/json

{
  "conversation_uuid": "conv_abc123",
  "text": "Hello Claude",
  "organization_uuid": "org-xyz789"
}
```

## Implementation Strategy

### Phase 1: Basic HTTP Client
1. Create authenticated HTTP client with proper headers
2. Implement conversation listing endpoint
3. Test with real authentication tokens

### Phase 2: Data Models
1. Map API responses to TypeScript interfaces
2. Handle pagination and filtering
3. Implement conversation metadata sync

### Phase 3: Error Handling
1. Handle authentication failures
2. Implement retry logic for network errors
3. Graceful degradation for API changes

## Testing Approach

### Manual Testing with Browser DevTools
1. Use browser's Network tab to capture actual API calls
2. Copy request headers and payload formats
3. Test endpoints with curl/Postman using extracted tokens
4. Document actual response structures

### Integration Testing
1. Test with POC tool using real authentication
2. Verify conversation listing works
3. Test conversation creation and message sending
4. Validate data persistence and sync

## Notes for Implementation

- Start with conversation listing as the minimal viable API integration
- Use axios for HTTP client with interceptors for authentication
- Implement request/response logging for debugging
- Handle streaming responses for real-time chat later
- Plan for API versioning and endpoint changes

## Next Steps

1. Implement basic API client with authentication
2. Test conversation listing endpoint
3. Add error handling and retry logic
4. Implement conversation sync and local storage
5. Add commands for listing and managing conversations