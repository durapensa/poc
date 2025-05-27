# POC - API Discovery Notes

## Chrome Browser Storage Analysis

### Authentication Token Locations

#### Chrome Default Profile Paths
```
macOS: ~/Library/Application Support/Google/Chrome/Default/
├── Local Storage/
│   └── leveldb/           # localStorage data
├── Cookies                # SQLite database
└── Preferences           # JSON configuration
```

#### Expected Token Patterns
**localStorage keys to investigate**:
- `auth_token`
- `session_key` 
- `claude_session`
- `anthropic_session`
- Organization/user ID storage

**Cookie patterns to look for**:
- `session=...`
- `__cf_bm=...` (Cloudflare bot management)
- `anthropic_session=...`
- CSRF protection cookies

#### LevelDB Parsing Strategy
```typescript
// Pseudo-code for LevelDB parsing
import level from 'level-read'

interface ChromeLocalStorage {
  key: string;
  value: string | object;
  timestamp?: number;
}

async function parseLocalStorage(chromePath: string): Promise<ChromeLocalStorage[]> {
  // Parse LevelDB files
  // Extract claude.ai localStorage entries
  // Return structured token data
}
```

## Claude Web API Endpoint Discovery

### Network Analysis Target Areas

#### Authentication Endpoints
- Login/session validation
- Token refresh mechanisms  
- Organization/user context

#### Conversation Management
- List conversations: `GET /api/organizations/{org_id}/chat_conversations`
- Create conversation: `POST /api/organizations/{org_id}/chat_conversations`
- Get conversation: `GET /api/organizations/{org_id}/chat_conversations/{conv_id}`
- Delete conversation: `DELETE /api/organizations/{org_id}/chat_conversations/{conv_id}`

#### Message Operations  
- Send message: `POST /api/append_message`
- Edit message: `PUT /api/messages/{message_id}`
- Message history: `GET /api/organizations/{org_id}/chat_conversations/{conv_id}/messages`

#### Streaming Responses
- Server-Sent Events endpoint for real-time responses
- WebSocket connections for chat interactions
- Chunk-based response parsing

### Request Header Analysis

#### Required Headers (to be discovered)
```typescript interface RequestHeaders {
  'Authorization': 'Bearer <token>';
  'Cookie': string; // session cookies
  'X-Request-ID': string; // UUID for request tracking
  'X-CSRF-Token'?: string; // CSRF protection
  'Content-Type': 'application/json';
  'User-Agent': string; // Browser identification
  'Referer': 'https://claude.ai/';
  'Origin': 'https://claude.ai';
}
```

#### Response Analysis Points
- HTTP status code patterns
- Rate limiting headers (`X-RateLimit-*`)
- Pagination patterns for conversation lists
- Error response structures
- Streaming response formats

### Data Structure Discovery

#### Conversation Object Structure
```typescript
interface Conversation {
  id: string; // Format: conv_<uuid>
  title: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  organization_id: string;
  message_count?: number;
  participants?: ParticipantInfo[];
  metadata?: ConversationMetadata;
}
```

#### Message Object Structure  
```typescript
interface Message {
  id: string; // Format: msg_<uuid>
  conversation_id: string;
  role: 'human' | 'assistant';
  content: string;
  timestamp: string; // ISO timestamp
  edit_history?: EditInfo[];
  attachments?: AttachmentInfo[];
}
```

#### Streaming Response Format
```typescript
interface StreamingResponse {
  type: 'message_start' | 'content_block_delta' | 'message_complete';
  data: {
    completion?: string; // Partial content
    message_id?: string;
    conversation_id?: string;
    error?: ErrorInfo;
  };
}
```

## Implementation Discovery Tasks

### Phase 1: Authentication Discovery
- [ ] Locate Chrome storage files on macOS
- [ ] Identify localStorage keys used by claude.ai
- [ ] Extract and decode session tokens
- [ ] Identify cookie-based authentication
- [ ] Test token validity and expiration

### Phase 2: API Endpoint Discovery
- [ ] Intercept network requests during web usage
- [ ] Document request/response patterns
- [ ] Identify required headers and CSRF tokens
- [ ] Map conversation CRUD operations
- [ ] Analyze message sending flow

### Phase 3: Response Format Discovery
- [ ] Document JSON response structures
- [ ] Analyze streaming response patterns
- [ ] Identify error response formats
- [ ] Map pagination and filtering options
- [ ] Test rate limiting behavior

### Phase 4: Integration Testing
- [ ] Validate extracted tokens work with API
- [ ] Test conversation list retrieval
- [ ] Test message sending functionality
- [ ] Verify streaming response handling
- [ ] Document any authentication refresh needs

## Reverse Engineering Tools

### Browser DevTools Usage
1. **Network Tab**: Capture all API requests during normal usage
2. **Application Tab**: Inspect localStorage and cookies
3. **Console**: Test API calls with extracted tokens
4. **Sources**: Examine client-side JavaScript for API patterns

### Command Line Tools
```bash
# Chrome process inspection
lsof -p $(pgrep Chrome) | grep leveldb

# SQLite cookie analysis  
sqlite3 ~/Library/Application\ Support/Google/Chrome/Default/Cookies \
  "SELECT name, value, host_key FROM cookies WHERE host_key LIKE '%claude.ai%'"

# LevelDB content examination
# Use node.js level libraries for parsing
```

### Network Interception
```javascript
// Browser console - intercept fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch request:', args);
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('Fetch response:', response);
      return response;
    });
};
```

## Security Considerations

### Token Handling
- Identify token expiration patterns
- Plan for token refresh mechanisms
- Consider token encryption at rest
- Document scope and permissions of extracted tokens

### Request Authenticity
- Analyze CSRF protection mechanisms
- Document required request signing
- Identify bot detection countermeasures
- Plan for request rate limiting compliance

## Notes Template for Claude Code

```markdown
## Discovery Session: [Date]

### Objective
[What we're trying to discover]

### Method
[How we approached the discovery]

### Findings
[What we learned]

### Code Examples
[Working examples of API calls, data parsing, etc.]

### Next Steps
[What to investigate next]

### Open Questions
[Unresolved issues or uncertainties]
```

This document will be continuously updated during development as we discover more about Claude's web interface API and Chrome storage patterns.