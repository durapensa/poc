# POC - Testing Notes

## Manual Testing Strategy

### Phase 1: Authentication Testing

#### Chrome Storage Access Tests
```bash
# Test Chrome installation detection
npm run dev -- --debug chrome-detect

# Test Chrome profile location
ls -la ~/Library/Application\ Support/Google/Chrome/Default/

# Verify Chrome storage files exist
ls -la ~/Library/Application\ Support/Google/Chrome/Default/Local\ Storage/leveldb/
ls -la ~/Library/Application\ Support/Google/Chrome/Default/Cookies
```

#### Token Extraction Tests
```bash
# Test authentication extraction
npm run dev init

# Verify auth.json creation and content
cat ~/.poc/auth.json | jq '.'

# Validate token format and expiration
node -e "
const auth = require(process.env.HOME + '/.poc/auth.json');
console.log('Token length:', auth.sessionToken?.length);
console.log('Organization ID:', auth.organizationId);
console.log('Expires:', auth.expiresAt);
"
```

#### Authentication Validation Tests
```bash
# Test token validity with simple API call
curl -H "Authorization: Bearer $(cat ~/.poc/auth.json | jq -r '.sessionToken')" \
     -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" \
     https://claude.ai/api/organizations/$(cat ~/.poc/auth.json | jq -r '.organizationId')/chat_conversations

# Expected: 200 OK with conversation list JSON
# Failure cases: 401 Unauthorized, 403 Forbidden
```

### Phase 2: Sync and Storage Testing

#### Conversation Metadata Sync Tests
```bash
# Test initial sync
npm run dev sync

# Verify sessions.json creation
cat ~/.poc/sessions.json | jq '.conversations | length'
cat ~/.poc/sessions.json | jq '.conversations[0]'

# Check placeholder file creation
ls -la ~/.poc/sessions/
file ~/.poc/sessions/conv_*.json

# Test incremental sync
npm run dev sync
# Should be faster on second run, only fetch new/updated conversations
```

#### File Storage Tests
```bash
# Test storage directory structure
tree ~/.poc/

# Verify file permissions
ls -la ~/.poc/
ls -la ~/.poc/sessions/

# Test storage quota (if implemented)
du -sh ~/.poc/

# Test file corruption recovery
echo "invalid json" > ~/.poc/sessions.json
npm run dev sync
# Should handle gracefully or recreate
```

#### Data Integrity Tests
```bash
# Compare web conversation count with local
npm run dev list | wc -l
# Compare with actual Claude web interface count

# Test conversation metadata accuracy
npm run dev list --json | jq '.[] | select(.id=="conv_123") | .title'
# Verify title matches web interface

# Test hash consistency (if implemented)
npm run dev sync
HASH1=$(cat ~/.poc/sessions.json | jq -r '.conversations[0].hash')
npm run dev sync
HASH2=$(cat ~/.poc/sessions.json | jq -r '.conversations[0].hash')
echo "Hashes match: $([ "$HASH1" = "$HASH2" ] && echo "yes" || echo "no")"
```

### Phase 3: Chat Interface Testing

#### New Conversation Tests
```bash
# Test new conversation creation
npm run dev chat
# Type: "Hello, this is a test message"
# Verify: Response received and properly formatted

# Test conversation persistence
ls ~/.poc/sessions/conv_*.json | tail -1 | xargs cat | jq '.messages | length'
# Should show 2 messages (human + assistant)

# Test conversation title generation
npm run dev list | tail -1
# Verify new conversation appears with appropriate title
```

#### Conversation Resume Tests
```bash
# Get existing conversation ID
CONV_ID=$(npm run dev list --json | jq -r '.[0].id')

# Test conversation resume
npm run dev chat $CONV_ID
# Verify: Previous messages displayed
# Type: "Continue our conversation"
# Verify: Context maintained from previous messages

# Test conversation loading performance
time npm run dev chat $CONV_ID
# Should load quickly for cached conversations
```

#### Interactive Chat Tests
```bash
# Test multi-turn conversation
npm run dev chat
# Turn 1: "What is TypeScript?"
# Turn 2: "How does it differ from JavaScript?"
# Turn 3: "Show me an example"
# Verify context maintained across turns

# Test streaming response handling
npm run dev chat --debug
# Verify chunks received and displayed progressively

# Test interruption handling (Ctrl+C)
npm run dev chat
# Start typing, press Ctrl+C
# Verify clean exit and conversation state preserved
```

### Phase 4: Command Interface Testing

#### List Command Tests
```bash
# Test basic listing
npm run dev list

# Test with options
npm run dev list --all
npm run dev list --json

# Test sorting and filtering (if implemented)
npm run dev list | head -5
npm run dev list | grep "yesterday"

# Test empty state
rm -rf ~/.poc/sessions/
npm run dev list
# Should handle gracefully
```

#### Download Command Tests
```bash
# Test explicit download
CONV_ID=$(npm run dev list --json | jq -r '.[] | select(.isDownloaded==false) | .id' | head -1)
npm run dev download $CONV_ID

# Verify download completion
cat ~/.poc/sessions/$CONV_ID.json | jq '.messages | length'

# Test already downloaded conversation
npm run dev download $CONV_ID
# Should handle gracefully (skip or update)
```

## Automated Testing Framework (Future)

### Unit Test Structure
```typescript
// tests/auth/chrome-parser.test.ts
import { ChromeStorageParser } from '../../src/auth/chrome-parser';

describe('ChromeStorageParser', () => {
  test('should parse mock localStorage data', async () => {
    // Mock Chrome storage files
    // Test parsing logic
    // Verify extracted tokens
  });

  test('should handle missing Chrome installation', () => {
    // Test error handling
  });
});
```

### Integration Test Examples
```typescript
// tests/integration/sync.test.ts
describe('Sync Integration', () => {
  test('should sync conversations end-to-end', async () => {
    // Setup mock API responses
    // Run sync command
    // Verify local storage state
  });
});
```

### Mock Data Setup
```bash
# Create test fixtures directory
mkdir -p tests/fixtures/chrome-storage
mkdir -p tests/fixtures/api-responses

# Mock Chrome localStorage data
# Mock API response data
# Mock conversation data
```

## Performance Testing

### Sync Performance Tests
```bash
# Test large conversation history sync
time npm run dev sync

# Monitor memory usage during sync
npm run dev sync &
PID=$!
while kill -0 $PID 2>/dev/null; do
  ps -o pid,vsz,rss,comm $PID
  sleep 1
done
```

### Chat Performance Tests
```bash
# Test response time for new chat
time npm run dev chat <<< "Hello"

# Test response time for conversation resume
time npm run dev chat $EXISTING_CONV_ID <<< "Continue"

# Test large conversation loading
# Create conversation with 100+ messages
# Measure load time
```

## Error Case Testing

### Network Error Tests
```bash
# Test offline behavior
# Disconnect network
npm run dev sync
npm run dev chat

# Test API endpoint changes
# Mock invalid API responses
# Verify graceful degradation
```

### Authentication Error Tests
```bash
# Test expired tokens
# Manually modify auth.json with old timestamp
npm run dev sync

# Test invalid tokens
echo '{"sessionToken":"invalid"}' > ~/.poc/auth.json
npm run dev list

# Test missing authentication
rm ~/.poc/auth.json
npm run dev list
```

### File System Error Tests
```bash
# Test read-only storage directory
chmod 444 ~/.poc/
npm run dev sync

# Test corrupted files
echo "invalid" > ~/.poc/sessions.json
npm run dev list

# Test disk space issues
# Fill available disk space
# Test graceful handling
```

## Browser Compatibility Testing

### Chrome Version Tests
```bash
# Test different Chrome versions
# Document minimum supported version
# Test Chrome Beta/Canary compatibility

# Test Chrome profile variations
# Test multiple Chrome profiles
# Test Chrome with different user data directories
```

### Future Browser Tests
```bash
# Placeholder for Firefox testing
# Placeholder for Safari testing
# Document browser-specific storage formats
```

## Security Testing

### Token Security Tests
```bash
# Verify token file permissions
ls -la ~/.poc/auth.json
# Should be 600 (user read/write only)

# Test token exposure in process list
ps aux | grep poc
# Verify tokens not visible in command line

# Test token logging
npm run dev --debug sync 2>&1 | grep -i token
# Should not log actual token values
```

## Test Result Documentation

### Test Session Template
```markdown
## Test Session: [Date]

### Environment
- macOS version: 
- Chrome version:
- Node.js version:
- POC version:

### Test Results
- [ ] Chrome storage access
- [ ] Token extraction
- [ ] API authentication
- [ ] Conversation sync
- [ ] New chat creation
- [ ] Chat resume
- [ ] Interactive mode

### Issues Found
[List any bugs or unexpected behavior]

### Performance Notes
[Timing measurements and observations]

### Next Testing Steps
[What to test in next session]
```

### Continuous Testing Checklist
```markdown
## Pre-Release Testing Checklist

### Core Functionality
- [ ] `poc init` extracts valid tokens
- [ ] `poc sync` downloads conversation metadata
- [ ] `poc list` displays conversations correctly
- [ ] `poc chat` creates new conversations
- [ ] `poc chat <id>` resumes existing conversations
- [ ] `poc download <id>` fetches full conversation

### Error Handling
- [ ] Graceful handling of missing Chrome
- [ ] Appropriate error for invalid tokens
- [ ] Network error recovery
- [ ] File permission issues handled

### Performance
- [ ] Sync completes in reasonable time (<30s for 100 conversations)
- [ ] Chat responses start streaming within 2s
- [ ] Memory usage remains stable during long sessions

### User Experience
- [ ] Clear error messages
- [ ] Helpful command-line help text
- [ ] Consistent output formatting
- [ ] Progress indicators where appropriate
```

This testing framework provides comprehensive coverage for manual testing during development and establishes the foundation for future automated testing implementation.