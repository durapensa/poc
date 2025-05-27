import { Command } from 'commander';
import chalk from 'chalk';
import { SessionStore } from '../storage/session-store';
import { ConversationMetadata } from '../types/conversation';
import { logger } from '../utils/logger';

export function createListCommand(): Command {
  return new Command('list')
    .description('List conversation history')
    .option('-a, --all', 'Show all conversations including placeholders')
    .option('-d, --downloaded', 'Show only downloaded conversations')
    .option('-j, --json', 'Output as JSON')
    .option('-s, --search <term>', 'Search conversations by title or ID')
    .option('--limit <number>', 'Limit number of conversations shown', '20')
    .action(async (options) => {
      try {
        const sessionStore = new SessionStore();
        let conversations = await sessionStore.getConversationList();

        if (conversations.length === 0) {
          logger.info('No conversations found');
          logger.info('Run "poc sync" to fetch conversations from Claude');
          return;
        }

        // Apply filters
        if (options.search) {
          conversations = await sessionStore.findConversation(options.search);
          if (conversations.length === 0) {
            logger.info(`No conversations found matching: ${options.search}`);
            return;
          }
        }

        if (options.downloaded) {
          conversations = conversations.filter(conv => conv.isDownloaded);
        }

        if (!options.all) {
          // By default, show all conversations (downloaded + placeholders)
          // This option is here for future use
        }

        // Apply limit
        const limit = parseInt(options.limit);
        if (limit > 0 && conversations.length > limit) {
          conversations = conversations.slice(0, limit);
        }

        // Sort by updated date (newest first)
        conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

        if (options.json) {
          console.log(JSON.stringify(conversations, null, 2));
        } else {
          displayConversationsTable(conversations, options);
        }

      } catch (error: any) {
        logger.error('Failed to list conversations', error);
        process.exit(1);
      }
    });
}

function displayConversationsTable(conversations: ConversationMetadata[], options: any): void {
  console.log(chalk.bold('\n📝 Your Claude Conversations:\n'));

  // Table header
  const headers = [
    chalk.bold('ID'),
    chalk.bold('Title'),
    chalk.bold('Updated'),
    chalk.bold('Messages'),
    chalk.bold('Status')
  ];

  const idWidth = 12;
  const titleWidth = 40;
  const dateWidth = 12;
  const msgWidth = 8;
  const statusWidth = 12;

  console.log(
    headers[0].padEnd(idWidth) +
    headers[1].padEnd(titleWidth) +
    headers[2].padEnd(dateWidth) +
    headers[3].padEnd(msgWidth) +
    headers[4].padEnd(statusWidth)
  );

  console.log(chalk.gray('─'.repeat(idWidth + titleWidth + dateWidth + msgWidth + statusWidth)));

  // Table rows
  conversations.forEach(conv => {
    const id = conv.id.substring(0, 10) + (conv.id.length > 10 ? '...' : '');
    const title = truncateText(conv.title, titleWidth - 2);
    const date = formatDate(conv.updatedAt);
    const messages = conv.messageCount.toString();
    const status = conv.isDownloaded ? 
      chalk.green('Downloaded') : 
      chalk.yellow('Placeholder');

    console.log(
      chalk.cyan(id.padEnd(idWidth)) +
      title.padEnd(titleWidth) +
      chalk.gray(date.padEnd(dateWidth)) +
      chalk.blue(messages.padEnd(msgWidth)) +
      status.padEnd(statusWidth)
    );
  });

  // Summary
  const totalCount = conversations.length;
  const downloadedCount = conversations.filter(conv => conv.isDownloaded).length;
  const placeholderCount = totalCount - downloadedCount;

  console.log(chalk.gray('\n' + '─'.repeat(idWidth + titleWidth + dateWidth + msgWidth + statusWidth)));
  console.log(chalk.bold(`\n📊 Summary: ${totalCount} total, ${downloadedCount} downloaded, ${placeholderCount} placeholders\n`));

  // Usage hints
  if (placeholderCount > 0) {
    console.log(chalk.dim('💡 Use "poc download <id>" to download full conversation content'));
  }
  
  if (options.search) {
    console.log(chalk.dim(`🔍 Showing results for: "${options.search}"`));
  }
  
  if (conversations.length >= parseInt(options.limit)) {
    console.log(chalk.dim(`📄 Showing first ${options.limit} conversations (use --limit to see more)`));
  }
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)}w ago`;
  } else if (diffDays < 365) {
    return `${Math.floor(diffDays / 30)}mo ago`;
  } else {
    return `${Math.floor(diffDays / 365)}y ago`;
  }
}