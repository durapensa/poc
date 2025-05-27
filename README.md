# POC - Claude Web Interface CLI Tool

A command-line interface tool that connects to Claude's web interface without using the official API. Extract authentication tokens, sync conversation history, and chat with Claude directly from your terminal.

## ⚠️ Work in Progress

This is an experimental proof-of-concept tool that reverse-engineers Claude's web interface. Use at your own risk and be aware that:
- Claude may update their API endpoints at any time
- This tool is not officially supported by Anthropic
- Authentication tokens may expire and require manual refresh

## 🚀 Features

- **Authentication**: Extract tokens from Chrome browser or manual input
- **Conversation Sync**: Download and sync your Claude conversation history
- **Interactive Chat**: Start new conversations or resume existing ones
- **Local Storage**: Conversations stored locally in `~/.poc/`

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Chrome browser (for automatic token extraction)
- TypeScript (for development)

## 🛠️ Installation

### Clone and Build

```bash
git clone <repository-url>
cd poc
npm install
npm run build
```

### Install Globally

```bash
npm install -g .
```

Or use the binary directly:
```bash
./dist/index.js --help
```

## 🎯 Quick Start

### 1. Initialize Authentication
```bash
poc init
```
This will attempt to extract tokens from Chrome. If that fails, you'll be prompted to enter tokens manually.

### 2. Sync Conversations
```bash
poc sync
```
Downloads your conversation history from Claude's web interface.

### 3. List Conversations
```bash
poc list
```
Shows your synced conversations with titles and IDs.

### 4. Start Chatting
```bash
poc chat
```
Launches an interactive chat interface with Claude.

## 📖 Commands

| Command | Description |
|---------|-------------|
| `poc init` | Set up authentication tokens |
| `poc sync` | Sync conversations from Claude web interface |
| `poc list` | List available conversations |
| `poc chat` | Start interactive chat with Claude |

## 🔧 Manual Token Setup

If automatic Chrome token extraction fails:

1. Open Chrome and navigate to [claude.ai](https://claude.ai)
2. Open Developer Tools (F12)
3. Go to Application → Cookies → https://claude.ai
4. Copy the `sessionKey` value
5. Run `poc init` and paste when prompted

For detailed instructions, see [docs/MANUAL_TOKEN_GUIDE.md](docs/MANUAL_TOKEN_GUIDE.md)

## 🗂️ Project Structure

```
poc/
├── src/
│   ├── auth/           # Authentication and token management
│   ├── commands/       # CLI command implementations
│   ├── storage/        # Local file storage
│   ├── sync/           # API clients and conversation sync
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── docs/               # Documentation and development notes
└── dist/               # Compiled JavaScript output
```

## 🧪 Development

### Build
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Testing
```bash
# Test authentication
node dist/index.js init

# Test sync
node dist/index.js sync

# Test chat
node dist/index.js chat
```

## 📝 Documentation

Detailed documentation is available in the `docs/` folder:

- [Architecture Overview](docs/poc_architecture.md)
- [API Discovery Process](docs/poc_api_discovery.md) 
- [Implementation Notes](docs/poc_implementation_notes.md)
- [Manual Token Guide](docs/MANUAL_TOKEN_GUIDE.md)

## ⚖️ License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

This is a proof-of-concept project. Contributions welcome, but please note the experimental nature of reverse-engineering web APIs.

## ⚠️ Disclaimer

This tool is not affiliated with or endorsed by Anthropic. It's an independent project that interfaces with Claude's web interface for educational and experimental purposes.