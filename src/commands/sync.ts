import { Command } from 'commander';
import { ConversationSync } from '../sync/conversation-sync';
import { logger } from '../utils/logger';

export function createSyncCommand(): Command {
  return new Command('sync')
    .description('Sync conversation metadata from Claude web interface')
    .option('--force', 'Force update all conversations regardless of timestamps')
    .option('--no-placeholders', 'Skip creating placeholder files for conversations')
    .option('--conversation <id>', 'Sync a specific conversation by ID')
    .option('--stats', 'Show sync statistics without performing sync')
    .action(async (options) => {
      try {
        const sync = new ConversationSync();

        if (options.stats) {
          await showStats(sync);
          return;
        }

        if (options.conversation) {
          await syncSingleConversation(sync, options.conversation);
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
    createPlaceholders: options.placeholders !== false
  };

  const result = await sync.syncConversations(syncOptions);

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

  if (result.newConversations > 0) {
    logger.info('Use "poc list" to see your conversations');
    logger.info('Use "poc download <id>" to download full conversation content');
  }
}

async function syncSingleConversation(sync: ConversationSync, conversationId: string): Promise<void> {
  logger.info(`Syncing conversation: ${conversationId}`);
  
  await sync.syncSingleConversation(conversationId);
  
  logger.success('Conversation synced successfully!');
  logger.info('Use "poc list" to see updated conversation details');
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