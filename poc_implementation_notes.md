# POC - Implementation Notes

## Project Setup

### Initial Setup Commands
```bash
# Create project directory
mkdir poc-claude-cli
cd poc-claude-cli

# Initialize npm project
npm init -y

# Install TypeScript and build tools
npm install -D typescript @types/node ts-node nodemon
npm install -D @types/sqlite3 @types/level

# Install CLI dependencies
npm install commander inquirer chalk
npm install ink react

# Install Chrome storage parsing
npm install sqlite3 level-read
npm install node-leveldb

# Install HTTP client
npm install axios

# Setup TypeScript configuration
npx tsc --init
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Package.json Scripts
```json
{
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "start": "node dist/index.js",
    "watch": "nodemon --exec ts-node src/index.ts"
  },
  "bin": {
    "poc": "./dist/index.js"
  }
}
```

## File Structure Implementation

### Source Code Organization
```
src/
├── index.ts                    # Main CLI entry point
├── types/
│   ├── auth.ts                # Authentication interfaces
│   ├── conversation.ts        # Conversation data structures  
│   └── config.ts              # Configuration interfaces
├── auth/
│   ├── chrome-parser.ts       # Chrome storage file parsing
│   ├── token-extractor.ts     # Token extraction logic
│   └── auth-manager.ts        # Authentication state management
├── sync/
│   ├── api-client.ts          # HTTP client for Claude API
│   ├── conversation-sync.ts   # Sync conversation metadata
│   └── metadata-manager.ts    # Local metadata management
├── commands/
│   ├── init.ts               # poc init command
│   ├── list.ts               # poc list command
│   ├── sync.ts               # poc sync command
│   ├── chat.ts               # poc chat command
│   └── download.ts           # poc download command
├── ui/
│   ├── chat-interface.tsx    # Ink chat component
│   ├── progress.tsx          # Progress indicators
│   └── conversation-list.tsx # Conversation display
├── storage/
│   ├── file-manager.ts       # File I/O operations
│   ├── session-store.ts      # Session data management
│   └── config-manager.ts     # Configuration management
└── utils/
    ├── chrome-paths.ts       # Chrome installation detection
    ├── logger.ts             # Logging utilities
    └── validators.ts         # Data validation helpers
```

### Data Structure Interfaces

#### Authentication Types
```typescript
// src/types/auth.ts
export interface AuthTokens {
  sessionToken: string;
  organizationId: string;
  userId?: string;
  csrfToken?: string;
  expiresAt?: Date;
  extractedFrom: 'chrome' | 'firefox' | 'safari';
  extractedAt: Date;
}

export interface ChromeStorage {
  localStorageData: Record<string, any>;
  cookies: ChromeCookie[];
  profilePath: string;
}

export interface ChromeCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expiresUtc?: Date;
  httpOnly: boolean;
  secure: boolean;
}
```

#### Conversation Types
```typescript
// src/types/conversation.ts
export interface ConversationMetadata {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  isDownloaded: boolean;
  hash?: string;
  organizationId: string;
}

export interface Message {
  id: string;
  role: 'human' | 'assistant';
  content: string;
  timestamp: Date;
  conversationId: string;
}

export interface FullConversation extends ConversationMetadata {
  messages: Message[];
  localOnly: boolean;
  placeholder?: boolean;
  needsDownload?: boolean;
}
```

#### Configuration Types
```typescript
// src/types/config.ts
export interface PocConfig {
  chromePath?: string;
  chromeProfile?: string;
  apiEndpoints: {
    baseUrl: string;
    conversationsPath: string;
    messagesPath: string;
  };
  storage: {
    dataDir: string;
    maxConversations?: number;
    autoSync: boolean;
  };
  ui: {
    colorOutput: boolean;
    interactive: boolean;
    paginationSize: number;
  };
}
```

## Core Implementation Components

### Chrome Storage Parser
```typescript
// src/auth/chrome-parser.ts
import sqlite3 from 'sqlite3';
import level from 'level-read';
import { ChromeStorage, ChromeCookie } from '../types/auth';

export class ChromeStorageParser {
  constructor(private profilePath: string) {}

  async parseLocalStorage(): Promise<Record<string, any>> {
    const dbPath = `${this.profilePath}/Local Storage/leveldb`;
    // Implementation for LevelDB parsing
    // Return claude.ai localStorage entries
  }

  async parseCookies(): Promise<ChromeCookie[]> {
    const cookiesPath = `${this.profilePath}/Cookies`;
    // Implementation for SQLite cookie parsing
    // Return claude.ai cookies
  }

  async getFullStorage(): Promise<ChromeStorage> {
    const [localStorageData, cookies] = await Promise.all([
      this.parseLocalStorage(),
      this.parseCookies()
    ]);

    return {
      localStorageData,
      cookies,
      profilePath: this.profilePath
    };
  }
}
```

### API Client Structure
```typescript
// src/sync/api-client.ts
import axios, { AxiosInstance } from 'axios';
import { AuthTokens } from '../types/auth';
import { ConversationMetadata } from '../types/conversation';

export class ClaudeApiClient {
  private client: AxiosInstance;

  constructor(private auth: AuthTokens) {
    this.client = axios.create({
      baseURL: 'https://claude.ai',
      headers: {
        'Authorization': `Bearer ${auth.sessionToken}`,
        'User-Agent': 'Mozilla/5.0...',
        'Origin': 'https://claude.ai',
        'Referer': 'https://claude.ai/'
      }
    });
  }

  async getConversations(): Promise<ConversationMetadata[]> {
    // Implementation for conversation list fetching
  }

  async createConversation(title?: string): Promise<string> {
    // Implementation for new conversation creation
  }

  async sendMessage(conversationId: string, content: string): Promise<ReadableStream> {
    // Implementation for message sending with streaming response
  }
}
```

### Command Implementation Pattern
```typescript
// src/commands/list.ts
import { Command } from 'commander';
import chalk from 'chalk';
import { SessionStore } from '../storage/session-store';

export function createListCommand(): Command {
  return new Command('list')
    .description('List conversation history')
    .option('-a, --all', 'Show all conversations including placeholders')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
      const sessionStore = new SessionStore();
      const conversations = await sessionStore.getConversationList();
      
      if (options.json) {
        console.log(JSON.stringify(conversations, null, 2));
      } else {
        // Format and display conversation list
        conversations.forEach(conv => {
          const status = conv.isDownloaded ? 
            chalk.green('Downloaded') : 
            chalk.yellow('Placeholder');
          
          console.log(`${conv.id.padEnd(15)} ${conv.title.padEnd(30)} ${conv.updatedAt.toDateString().padEnd(15)} ${status}`);
        });
      }
    });
}
```

## Development Workflow

### Phase 1: Authentication Foundation
**Files to implement first**:
1. `src/utils/chrome-paths.ts` - Chrome installation detection
2. `src/auth/chrome-parser.ts` - Basic LevelDB/SQLite parsing
3. `src/auth/token-extractor.ts` - Token identification logic
4. `src/commands/init.ts` - Initial setup command

**Testing approach**:
```bash
# Manual testing commands
npm run dev init
cat ~/.poc/auth.json  # Verify token extraction
```

### Phase 2: Data Structure and Storage
**Files to implement**:
1. `src/storage/file-manager.ts` - Basic file I/O
2. `src/storage/session-store.ts` - Session data management
3. `src/sync/api-client.ts` - Basic HTTP client setup
4. `src/commands/sync.ts` - Metadata sync

**Testing approach**:
```bash
npm run dev sync
npm run dev list
# Verify conversation metadata appears
```

### Phase 3: Basic Chat Interface
**Files to implement**:
1. `src/sync/conversation-sync.ts` - Full conversation download
2. `src/commands/chat.ts` - Basic prompt-response loop
3. `src/ui/chat-interface.tsx` - Ink component for interactive chat

**Testing approach**:
```bash
npm run dev chat
# Test new conversation creation
npm run dev chat conv_123
# Test conversation resume
```

## Testing and Debugging

### Manual Testing Checklist
- [ ] Chrome storage parsing works on target macOS version
- [ ] Extracted tokens successfully authenticate with Claude API
- [ ] Conversation metadata sync completes without errors
- [ ] New conversation creation works
- [ ] Existing conversation resume works
- [ ] Interactive chat loop responds correctly
- [ ] File storage and retrieval works as expected

### Debug Logging Strategy
```typescript
// src/utils/logger.ts
export const logger = {
  debug: (message: string, data?: any) => {
    if (process.env.POC_DEBUG) {
      console.log(chalk.gray(`[DEBUG] ${message}`), data || '');
    }
  },
  info: (message: string) => console.log(chalk.blue(`[INFO] ${message}`)),
  warn: (message: string) => console.log(chalk.yellow(`[WARN] ${message}`)),
  error: (message: string, error?: Error) => {
    console.log(chalk.red(`[ERROR] ${message}`));
    if (error && process.env.POC_DEBUG) {
      console.log(error.stack);
    }
  }
};
```

### Environment Variables
```bash
export POC_DEBUG=1              # Enable debug logging
export POC_DATA_DIR=~/.poc-dev  # Custom data directory
export POC_CHROME_PATH=/custom/path  # Custom Chrome path
```

## Performance Considerations

### File I/O Optimization
- Cache parsed Chrome storage data
- Implement incremental sync (only changed conversations)
- Use streaming for large conversation downloads
- Lazy load conversation content

### Memory Management
- Stream responses instead of loading full responses
- Limit concurrent API requests
- Clear unused conversation data from memory
- Implement conversation cache size limits

## Error Handling Strategy (Future)

### Common Error Scenarios
- Chrome not installed or profile not found
- Authentication tokens expired or invalid
- Network connectivity issues
- API endpoint changes or rate limiting
- Corrupted local storage files

### Recovery Mechanisms
- Automatic token refresh attempts
- Fallback to manual authentication
- Local storage repair and validation
- Graceful degradation for offline usage

This implementation guide provides the foundation for building the POC tool incrementally while maintaining clean architecture and testability.