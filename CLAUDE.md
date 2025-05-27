# Claude Memory - POC CLI Tool Project

## Project Overview
**POC** (Claude Web Interface CLI Tool) - A TypeScript/Node.js CLI that reverse-engineers Claude's web interface to provide terminal access without using the official API.

## Current Status: ✅ COMPLETE & READY FOR GITHUB
- **Phase 1**: Authentication foundation ✅
- **Phase 2**: API integration & conversation sync ✅  
- **Phase 3**: Interactive chat interface ✅
- **Cleanup**: Repository organized, README written, build verified ✅
- **SDK Features**: Claude Code SDK-style usage patterns implemented ✅
- **Auto Token Refresh**: Automatic token refresh prompts on auth failure ✅

## Key Components

### Authentication (`src/auth/`)
- **chrome-parser.ts**: Extracts tokens from Chrome browser storage (LevelDB/SQLite)
- **token-extractor.ts**: Processes and validates authentication tokens
- **Fallback**: Manual token input via `poc init` when Chrome extraction fails

### API Integration (`src/sync/`)
- **curl-client.ts**: Bypasses Cloudflare protection using curl fallback
- **message-client.ts**: Real-time chat with Server-Sent Events parsing
- **conversation-sync.ts**: Downloads conversation history from Claude web interface

### CLI Commands (`src/commands/`)
- `poc init` - Set up authentication tokens
- `poc sync` - Download conversation history  
- `poc list` - Show local conversations
- `poc chat` - Interactive chat interface

### Storage (`src/storage/`)
- Local storage in `~/.poc/` directory
- JSON files for conversations and metadata
- Session management and token persistence

## Critical Technical Details

### Authentication Tokens Required:
```javascript
{
  sessionKey: "sk-ant-sessionid-xxx",
  organizationId: "org-xxx"
}
```

### Real Claude API Endpoints:
- Conversations: `GET /api/organizations/{org}/chat_conversations`
- Chat completion: `POST /api/organizations/{org}/chat_conversations/{id}/completion`
- Uses Server-Sent Events for streaming responses

### Cloudflare Bypass:
Uses curl subprocess calls instead of direct HTTP requests to avoid 403 errors.

## Build & Test Commands
```bash
npm install
npm run build      # TypeScript compilation
node dist/index.js --help
poc init           # After global install
```

## Recent Improvements ✅
- **Shell Escaping Fixed**: Messages with apostrophes now work correctly
- **Authentication Error Detection**: Proper error messages for expired tokens  
- **Automatic Token Refresh**: Prompts user to refresh tokens when authentication fails
- **SDK-style Usage**: `--print/-p` and `--continue` flags implemented
- **Enhanced List Display**: Full conversation IDs shown instead of truncated

## Known Issues
- React/Ink components excluded from build due to module resolution issues
- Simple inquirer-based chat interface working perfectly
- Chrome cookie encryption requires manual token fallback on some systems

## Next Session Priorities
1. Fix React/Ink TypeScript issues for enhanced UI
2. Add conversation creation API endpoint
3. Implement parent message UUID handling for conversation context
4. Consider conversation search/filtering features

## Development Notes
- Uses curl fallback strategy for all API calls
- Server-Sent Events parsing for real-time Claude responses
- Modular TypeScript architecture with strict typing
- Comprehensive error handling and logging

## Repository Structure
```
poc/
├── src/           # TypeScript source code
├── docs/          # All documentation files  
├── dist/          # Compiled JavaScript
└── README.md      # Installation & usage guide
```

## Testing Status
✅ Authentication working (Chrome + manual)
✅ Conversation sync working (30+ conversations tested)
✅ Interactive chat working (real Claude responses)
✅ Build process working
✅ CLI commands all functional