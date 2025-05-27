# POC - Architecture Decisions

## Technology Stack Decisions

### TypeScript/Node.js over Python
**Decision**: Use TypeScript/Node.js instead of Python 3.13
**Rationale**: 
- Better alignment with Claude Code SDK patterns
- Ink CLI framework provides rich interactive components
- npm ecosystem has robust Chrome storage parsing libraries
- Easier integration with web technologies (JSON, HTTP, streaming)

### Hybrid CLI Framework Approach
**Decision**: Use standard CLI for simple commands, Ink for interactive modes
**Commands using standard CLI**:
- `poc init`
- `poc list` 
- `poc sync`
- `poc download`

**Commands using Ink**:
- `poc chat` (interactive mode with streaming responses)

**Rationale**:
- Simple commands don't need React-like complexity
- Interactive chat benefits from real-time UI updates
- Matches Claude Code SDK patterns
- Easier to debug and maintain

## Data Storage Architecture

### File-Based Local Storage
**Decision**: Separate JSON files instead of database
**Structure**:
```
~/.poc/
├── auth.json           # Single auth state
├── sessions.json       # Conversation index
├── sessions/           # Individual conversations
└── config.json         # User configuration
```

**Rationale**:
- Simple to implement and debug
- Human-readable for development
- Easy to backup and version control
- No external database dependencies
- Supports partial sync strategies

### Lazy Loading Strategy
**Decision**: Metadata-first sync with on-demand conversation download
**Implementation**:
- `sessions.json` contains only metadata (titles, dates, message counts)
- Individual conversations downloaded when accessed
- Placeholder files for undownloaded conversations

**Rationale**:
- Fast startup times
- Bandwidth efficient
- User controls which conversations to cache locally
- Supports large conversation histories

## Authentication Strategy

### Direct Browser File Access
**Decision**: Parse Chrome storage files directly instead of browser automation
**Components**:
- LevelDB parser for localStorage data
- SQLite parser for cookies
- File system monitoring for token changes

**Rationale**:
- Faster than browser automation
- No browser dependencies at runtime
- More reliable for batch operations
- Easier to implement for MVP

### Chrome Default Profile Priority
**Decision**: Target Chrome Default profile initially
**Future**: Stub for profile detection and selection

**Rationale**:
- Covers majority use case
- Simpler implementation
- Clear expansion path

## API Integration Architecture

### Reverse-Engineered Web API
**Decision**: Use Claude web interface endpoints instead of official API
**Approach**:
- Network request interception and analysis
- Mimic browser request patterns
- Handle streaming responses
- Extract and use CSRF tokens

**Rationale**:
- Aligns with project goals (web interface wrapper)
- Access to web-specific features
- Conversation history compatibility
- No API key management needed

### Modular Component Design
**Decision**: Separate source files for each functional area
**Structure**:
```
src/
├── auth/
│   ├── chrome-parser.ts
│   ├── token-extractor.ts
│   └── auth-manager.ts
├── sync/
│   ├── api-client.ts
│   ├── conversation-sync.ts
│   └── metadata-manager.ts
├── commands/
│   ├── init.ts
│   ├── list.ts
│   ├── sync.ts
│   └── chat.ts
├── ui/
│   ├── chat-interface.tsx
│   ├── progress-indicator.tsx
│   └── conversation-list.tsx
└── storage/
    ├── file-manager.ts
    ├── session-store.ts
    └── config-manager.ts
```

**Rationale**:
- Clear separation of concerns
- Easier testing and debugging
- Supports future feature expansion
- Maintains small, focused files

## Error Handling Strategy

### Crash-Early Approach for MVP
**Decision**: Minimal error handling, let failures crash
**Areas for future enhancement**:
- Authentication token expiration
- Network connectivity issues
- Browser storage format changes
- API endpoint modifications

**Rationale**:
- Faster MVP development
- Clear identification of failure points
- Simplified debugging during development
- Focused feature implementation

## Development Process Decisions

### Incremental Development Phases
**Phase 1**: Authentication and basic structure
- Chrome storage parsing
- Token extraction
- Basic file structure

**Phase 2**: Metadata sync
- API client implementation
- Conversation list fetching
- Local storage management

**Phase 3**: Basic chat interface
- Simple prompt-response loop
- New conversation creation
- Response streaming

**Phase 4**: Conversation resume
- Existing conversation loading
- Context preservation
- Message history display

**Phase 5**: Polish and expansion
- Error handling
- Additional features
- Performance optimization

**Rationale**:
- Clear milestones and testing points
- Manageable complexity increments
- Early validation of core concepts
- Risk reduction through iteration

## Configuration Management

### Centralized Config Approach
**Decision**: Place maximum configuration in `config.json`
**Configurable items**:
- Browser paths and profiles
- API endpoints and request settings
- User preferences and display options
- Storage paths and file management

**Rationale**:
- User customization without code changes
- Environment-specific settings
- Feature flags for development
- Easy deployment configuration

These architectural decisions provide a foundation for consistent development while maintaining flexibility for future enhancements and expansions.