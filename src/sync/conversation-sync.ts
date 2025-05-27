import { ClaudeApiClient } from './api-client';
import { CurlApiClient } from './curl-client';
import { SessionStore } from '../storage/session-store';
import { FileManager } from '../storage/file-manager';
import { ConversationMetadata } from '../types/conversation';
import { logger } from '../utils/logger';

export interface SyncResult {
  newConversations: number;
  updatedConversations: number;
  totalConversations: number;
  errors: string[];
}

export class ConversationSync {
  private apiClient: ClaudeApiClient;
  private curlClient: CurlApiClient;
  private sessionStore: SessionStore;

  constructor() {
    const auth = FileManager.loadAuthTokens();
    if (!auth) {
      throw new Error('No authentication tokens found. Run "poc init" first.');
    }

    this.apiClient = new ClaudeApiClient(auth);
    this.curlClient = new CurlApiClient(auth);
    this.sessionStore = new SessionStore();
  }

  async syncConversations(options: {
    force?: boolean;
    createPlaceholders?: boolean;
  } = {}): Promise<SyncResult> {
    const result: SyncResult = {
      newConversations: 0,
      updatedConversations: 0,
      totalConversations: 0,
      errors: []
    };

    try {
      logger.info('Starting conversation sync...');

      // Test API connection first, with curl fallback
      logger.info('Testing API connection...');
      let connectionOk = await this.apiClient.testConnection();
      let usingCurl = false;
      
      if (!connectionOk) {
        logger.warn('Direct API connection failed, trying curl fallback...');
        connectionOk = await this.curlClient.testConnection();
        usingCurl = true;
      }
      
      if (!connectionOk) {
        throw new Error('Both direct API and curl connection failed. Check your authentication tokens.');
      }

      // Fetch remote conversations
      if (usingCurl) {
        logger.info('Fetching conversations using curl (direct API blocked)...');
      } else {
        logger.info('Fetching conversations from Claude API...');
      }
      
      const remoteConversations = usingCurl 
        ? await this.curlClient.getConversations()
        : await this.apiClient.getConversations();
      
      if (remoteConversations.length === 0) {
        logger.warn('No conversations found in Claude account');
        result.totalConversations = 0;
        return result;
      }

      // Load local conversations
      const localConversations = await this.sessionStore.loadConversationsIndex();
      const localConversationMap = new Map(
        localConversations.map(conv => [conv.id, conv])
      );

      // Process remote conversations
      const updatedConversations: ConversationMetadata[] = [];

      for (const remoteConv of remoteConversations) {
        const localConv = localConversationMap.get(remoteConv.id);

        if (!localConv) {
          // New conversation
          logger.debug(`New conversation found: ${remoteConv.title}`);
          updatedConversations.push(remoteConv);
          result.newConversations++;

          // Create placeholder file if requested
          if (options.createPlaceholders !== false) {
            try {
              await this.sessionStore.createPlaceholderFile(remoteConv);
            } catch (error) {
              result.errors.push(`Failed to create placeholder for ${remoteConv.id}: ${error}`);
            }
          }

        } else if (this.shouldUpdateConversation(localConv, remoteConv, options.force)) {
          // Updated conversation
          logger.debug(`Updated conversation: ${remoteConv.title}`);
          const updated = {
            ...remoteConv,
            isDownloaded: localConv.isDownloaded // Preserve download status
          };
          updatedConversations.push(updated);
          result.updatedConversations++;

        } else {
          // No changes needed
          updatedConversations.push(localConv);
        }
      }

      // Save updated conversations index
      await this.sessionStore.saveConversationsIndex(updatedConversations);
      result.totalConversations = updatedConversations.length;

      logger.success('Conversation sync completed');
      logger.debug('Sync results', {
        total: result.totalConversations,
        new: result.newConversations,
        updated: result.updatedConversations,
        errors: result.errors.length
      });

      return result;

    } catch (error: any) {
      logger.error('Conversation sync failed', error);
      result.errors.push(error.message);
      throw error;
    }
  }

  private shouldUpdateConversation(
    local: ConversationMetadata, 
    remote: ConversationMetadata, 
    force?: boolean
  ): boolean {
    if (force) {
      return true;
    }

    // Update if remote has newer timestamp
    if (remote.updatedAt > local.updatedAt) {
      return true;
    }

    // Update if title changed
    if (remote.title !== local.title) {
      return true;
    }

    // Update if message count changed
    if (remote.messageCount !== local.messageCount) {
      return true;
    }

    return false;
  }

  async syncSingleConversation(conversationId: string): Promise<void> {
    try {
      logger.info(`Syncing conversation: ${conversationId}`);

      // This would require a separate API endpoint to get full conversation details
      // For now, we'll just update the metadata
      const conversations = await this.apiClient.getConversations();
      const conversation = conversations.find(conv => conv.id === conversationId);

      if (!conversation) {
        throw new Error(`Conversation ${conversationId} not found`);
      }

      // Update the conversation in local storage
      const localConversations = await this.sessionStore.loadConversationsIndex();
      const updated = localConversations.map(conv => 
        conv.id === conversationId ? conversation : conv
      );

      await this.sessionStore.saveConversationsIndex(updated);
      logger.success(`Conversation ${conversationId} synced successfully`);

    } catch (error: any) {
      logger.error(`Failed to sync conversation ${conversationId}`, error);
      throw error;
    }
  }

  async downloadConversation(conversationId: string): Promise<void> {
    try {
      logger.info(`Downloading full conversation: ${conversationId}`);

      // Check if conversation exists in index
      const hasConversation = await this.sessionStore.hasConversation(conversationId);
      if (!hasConversation) {
        throw new Error(`Conversation ${conversationId} not found in index. Run sync first.`);
      }

      // For now, this is a placeholder - we need to implement the actual message fetching
      // This would require discovering the messages endpoint
      logger.warn('Full conversation download not yet implemented');
      logger.info('This feature requires discovering the messages API endpoint');

      // Mark as downloaded (placeholder for now)
      await this.sessionStore.markAsDownloaded(conversationId);
      logger.success(`Conversation ${conversationId} marked as downloaded`);

    } catch (error: any) {
      logger.error(`Failed to download conversation ${conversationId}`, error);
      throw error;
    }
  }

  async getStats(): Promise<{
    api: boolean;
    local: {
      totalConversations: number;
      downloadedConversations: number;
      lastSync: Date | null;
    };
  }> {
    try {
      // Test both API and curl connection
      let apiConnected = await this.apiClient.testConnection();
      
      if (!apiConnected) {
        logger.warn('Direct API failed, testing curl fallback...');
        apiConnected = await this.curlClient.testConnection();
        if (apiConnected) {
          logger.success('Curl fallback connection successful');
        }
      }
      
      const localStats = await this.sessionStore.getStats();

      return {
        api: apiConnected,
        local: localStats
      };

    } catch (error) {
      logger.debug('Failed to get sync stats');
      return {
        api: false,
        local: {
          totalConversations: 0,
          downloadedConversations: 0,
          lastSync: null
        }
      };
    }
  }
}