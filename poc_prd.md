# POC - Claude Web Interface CLI Tool
## Product Requirements Document

### Overview
`poc` is a command-line interface tool that enables interaction with Claude's web interface without using the official API. It extracts authentication tokens from Chrome browser storage, syncs conversation history locally, and provides CLI access to start new chats or resume existing conversations.

### Technical Stack
- **Language**: TypeScript/Node.js
- **Package Manager**: npm
- **CLI Framework**: Hybrid approach - standard CLI for simple commands, Ink components for interactive chat
- **Target Platform**: macOS (initial), expand to Linux/Windows later
- **Browser Support**: Chrome Default profile (initial), expand to multiple profiles/browsers later

### Core Features

#### Authentication & Setup
- Extract session tokens from Chrome browser storage (localStorage + cookies)
- Parse Chrome's LevelDB and SQLite databases using libraries
- Store authentication data in `~/.poc/auth.json`
- Initial setup via `poc init` command

#### Conversation Sync
- Fetch conversation metadata from Claude web API
- Store conversation index in `~/.poc/sessions.json`
- Create placeholder files for conversations not yet downloaded
- Support incremental sync of metadata only
- Full conversation download on-demand

#### Local Storage Structure
```
~/.poc/
├── auth.json                    # Authentication tokens
├── sessions.json               # Session index/metadata
├── sessions/                   # Individual conversation files
│   ├── conv_abc123.json        # Full conversation data
│   ├── conv_def456.json
│   └── conv_placeholder_xyz.json # Synced but not downloaded
└── config.json                 # User preferences, configuration
```

#### Command Interface
- `poc init` - Initial setup and authentication extraction
- `poc list` - Display conversation history (titles, dates, status)
- `poc sync` - Refresh metadata from Claude web interface
- `poc chat [conv_id]` - Start new or resume existing conversation
- `poc download <conv_id>` - Explicitly download full conversation

### Architecture

#### File Organization
```
src/
├── auth/           # Chrome storage parsing components
├── sync/           # API calls and conversation management
├── commands/       # CLI command handlers
├── ui/            # Ink components for interactive mode
└── storage/       # Local file management
```

#### Component Separation
- Each functional area in separate small source files
- Chrome storage parsing isolated from API logic
- Authentication, sync, and chat functionality decoupled
- Modular design for future browser/feature expansion

### Development Approach

#### Iterative Development
1. **Phase 1**: Authentication extraction and basic file structure
2. **Phase 2**: Conversation metadata sync and local storage
3. **Phase 3**: Basic chat interface (prompt-response loop)
4. **Phase 4**: Resume existing conversations
5. **Phase 5**: Polish and error handling

#### Testing Strategy
- Manual testing during development
- Maintain testing notes in separate MD file
- Plan for future programmatic test suite
- Focus on core functionality verification

#### Documentation
- Architecture decisions tracked in separate MD files
- API discovery notes maintained by Claude Code
- Implementation notes and design decisions documented
- Each major component documented separately

### Technical Specifications

#### Authentication Flow
1. Detect Chrome installation and Default profile
2. Parse LevelDB files for localStorage data
3. Parse SQLite database for cookies
4. Extract session tokens, CSRF tokens, organization IDs
5. Store in structured JSON format with expiration tracking

#### API Integration
- Reverse-engineer Claude web interface API endpoints
- Handle streaming responses for chat interactions
- Implement request/response patterns matching web interface
- Follow Claude Code SDK patterns where applicable

#### Configuration Management
- Centralized configuration in `config.json`
- User preferences and customizable settings
- Browser path and profile configuration
- API endpoint and request configuration

### Success Criteria

#### MVP Functionality
- [ ] Successfully extract Chrome authentication tokens
- [ ] Sync conversation metadata from Claude web interface
- [ ] Display conversation list with titles and dates
- [ ] Start new conversations via CLI
- [ ] Resume existing conversations
- [ ] Basic interactive chat loop

#### Code Quality
- [ ] Modular, maintainable TypeScript codebase
- [ ] Clear separation of concerns across components
- [ ] Following Claude Code SDK conventions
- [ ] Comprehensive documentation and architectural notes

### Future Considerations

#### Planned Expansions
- Multiple browser support (Firefox, Safari)
- Multiple Chrome profile support
- Conversation editing and branching
- Rich interactive UI enhancements
- Error handling and offline capabilities
- Security enhancements (token encryption)

#### Technical Debt Areas
- Authentication token refresh logic
- API endpoint versioning and changes
- Browser storage format changes
- Cross-platform compatibility

### Development Guidelines

#### Code Standards
- Follow Claude Code SDK patterns and conventions
- Use TypeScript strict mode
- Implement proper error boundaries for production
- Maintain small, focused source files

#### Git Workflow
- Main branch development for MVP
- Private GitHub repository
- Regular commits with clear messages
- Documentation updates with code changes

This PRD serves as the foundation for iterative development with Claude Code, maintaining flexibility for rapid iteration while establishing clear architectural boundaries and success criteria.