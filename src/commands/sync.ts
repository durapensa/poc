import { Command } from 'commander';
import { ConversationSync } from '../sync/conversation-sync';
import { logger } from '../utils/logger';

export function createSyncCommand(): Command {
  return new Command('sync')
    .description('Sync conversation metadata from Claude web interface')
    .option('--force', 'Force update all conversations regardless of timestamps')
    .option('--no-placeholders', 'Skip creating placeholder files for conversations')
    .option('--conversation <id>', 'Sync a specific conversation by ID')
    .option('--download', 'Download full conversation content (not just metadata)')
    .option('--download-all', 'Download full content for all conversations')
    .option('--limit <number>', 'Limit number of conversations to process', '10')
    .option('--stats', 'Show sync statistics without performing sync')
    .action(async (options) => {
      try {
        const sync = new ConversationSync();

        if (options.stats) {
          await showStats(sync);
          return;
        }

        if (options.conversation) {
          await syncSingleConversation(sync, options.conversation, options);
          return;
        }

        await syncAllConversations(sync, options);

      } catch (error: any) {
        logger.error('Sync failed', error);
        
        if (error.message.includes('No authentication tokens')) {
          logger.info('Run "poc init" to set up authentication first');
        } else if (error.message.includes('API connection test failed')) {
          logger.info('Check your authentication tokens with "poc init --manual"');
        }
        
        process.exit(1);
      }
    });
}

async function syncAllConversations(sync: ConversationSync, options: any): Promise<void> {
  logger.info('Syncing all conversations...');

  const syncOptions = {
    force: options.force,
    createPlaceholders: options.placeholders !== false,
    downloadContent: options.download || options.downloadAll,
    limit: parseInt(options.limit)
  };

  const result = await sync.syncConversations(syncOptions);

  // Handle full content downloading
  if (options.downloadAll) {
    await downloadAllConversations(sync, options);
  }

  // Display results
  logger.success('Sync completed successfully!');
  
  console.log(`
📊 Sync Results:
  Total conversations: ${result.totalConversations}
  New conversations: ${result.newConversations}
  Updated conversations: ${result.updatedConversations}
  Errors: ${result.errors.length}
`);

  if (result.errors.length > 0) {
    logger.warn('Errors encountered during sync:');
    result.errors.forEach(error => logger.error(`  • ${error}`));
  }

  if (result.newConversations > 0 && !options.downloadAll) {
    logger.info('Use "poc list" to see your conversations');
    logger.info('Use "poc sync --download-all" to download full conversation content');
  }
}

async function syncSingleConversation(sync: ConversationSync, conversationId: string, options: any): Promise<void> {
  logger.info(`Syncing conversation: ${conversationId}`);
  
  await sync.syncSingleConversation(conversationId);
  
  if (options.download) {
    logger.info('Downloading full conversation content...');
    await sync.downloadConversation(conversationId);
  }
  
  logger.success('Conversation synced successfully!');
  logger.info('Use "poc list" to see updated conversation details');
}

async function downloadAllConversations(sync: ConversationSync, options: any): Promise<void> {
  logger.info('Downloading full content for all conversations...');
  
  const sessionStore = new (await import('../storage/session-store')).SessionStore();
  const conversations = await sessionStore.getConversationList();
  
  const limit = parseInt(options.limit);
  const toDownload = conversations.slice(0, limit);
  
  logger.info(`Downloading ${toDownload.length} conversations (limited to ${limit})...`);
  
  let downloaded = 0;
  let errors = 0;
  
  for (const conv of toDownload) {
    try {
      logger.info(`[${downloaded + 1}/${toDownload.length}] Downloading: ${conv.title}`);
      await sync.downloadConversation(conv.id);
      downloaded++;
    } catch (error: any) {
      logger.error(`Failed to download ${conv.id}: ${error.message}`);
      errors++;
    }
  }
  
  logger.success(`Download complete! ${downloaded} successful, ${errors} errors`);
}

async function showStats(sync: ConversationSync): Promise<void> {
  logger.info('Getting sync statistics...');
  
  const stats = await sync.getStats();
  
  console.log(`
📊 POC Sync Statistics:

API Connection: ${stats.api ? '✅ Connected' : '❌ Failed'}

Local Storage:
  Total conversations: ${stats.local.totalConversations}
  Downloaded conversations: ${stats.local.downloadedConversations}
  Placeholder conversations: ${stats.local.totalConversations - stats.local.downloadedConversations}
  Last sync: ${stats.local.lastSync ? stats.local.lastSync.toLocaleString() : 'Never'}
`);

  if (!stats.api) {
    logger.warn('API connection failed. Check your authentication:');
    logger.info('  • Run "poc init --manual" to update tokens');
    logger.info('  • Ensure you are logged in to claude.ai');
    logger.info('  • Check your network connection');
  }

  if (stats.local.totalConversations === 0) {
    logger.info('No conversations found locally. Run "poc sync" to fetch them.');
  }
}