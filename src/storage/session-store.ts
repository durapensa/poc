import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ConversationMetadata, FullConversation } from '../types/conversation';
import { FileManager } from './file-manager';
import { logger } from '../utils/logger';

export interface SessionsIndex {
  conversations: ConversationMetadata[];
  lastSync: Date;
  version: string;
}

export class SessionStore {
  private sessionsFile: string;
  private sessionsDir: string;

  constructor() {
    this.sessionsFile = join(FileManager.getDataDirectory(), 'sessions.json');
    this.sessionsDir = FileManager.getSessionsDirectory();
  }

  async saveConversationsIndex(conversations: ConversationMetadata[]): Promise<void> {
    try {
      FileManager.ensureDataDirectory();

      const sessionsIndex: SessionsIndex = {
        conversations,
        lastSync: new Date(),
        version: '1.0.0'
      };

      const data = JSON.stringify(sessionsIndex, null, 2);
      writeFileSync(this.sessionsFile, data, { mode: 0o600 });

      logger.success(`Saved ${conversations.length} conversations to index`);
      logger.debug('Sessions index saved', this.sessionsFile);

    } catch (error) {
      logger.error('Failed to save conversations index', error as Error);
      throw error;
    }
  }

  async loadConversationsIndex(): Promise<ConversationMetadata[]> {
    if (!existsSync(this.sessionsFile)) {
      logger.debug('No sessions index found, returning empty list');
      return [];
    }

    try {
      const data = readFileSync(this.sessionsFile, 'utf8');
      const sessionsIndex: SessionsIndex = JSON.parse(data);

      // Convert date strings back to Date objects
      const conversations = sessionsIndex.conversations.map(conv => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt)
      }));

      logger.debug(`Loaded ${conversations.length} conversations from index`);
      return conversations;

    } catch (error) {
      logger.error('Failed to load conversations index', error as Error);
      logger.warn('Returning empty conversation list');
      return [];
    }
  }

  async getConversationList(): Promise<ConversationMetadata[]> {
    return await this.loadConversationsIndex();
  }

  async saveFullConversation(conversation: FullConversation): Promise<void> {
    try {
      FileManager.ensureDataDirectory();

      const filePath = join(this.sessionsDir, `${conversation.id}.json`);
      const data = JSON.stringify(conversation, null, 2);
      writeFileSync(filePath, data, { mode: 0o600 });

      logger.debug(`Saved full conversation: ${conversation.id}`);

    } catch (error) {
      logger.error(`Failed to save conversation ${conversation.id}`, error as Error);
      throw error;
    }
  }

  async loadFullConversation(conversationId: string): Promise<FullConversation | null> {
    const filePath = join(this.sessionsDir, `${conversationId}.json`);

    if (!existsSync(filePath)) {
      logger.debug(`Conversation file not found: ${conversationId}`);
      return null;
    }

    try {
      const data = readFileSync(filePath, 'utf8');
      const conversation: FullConversation = JSON.parse(data);

      // Convert date strings back to Date objects
      return {
        ...conversation,
        createdAt: new Date(conversation.createdAt),
        updatedAt: new Date(conversation.updatedAt),
        messages: conversation.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      };

    } catch (error) {
      logger.error(`Failed to load conversation ${conversationId}`, error as Error);
      return null;
    }
  }

  async createPlaceholderFile(conversation: ConversationMetadata): Promise<void> {
    try {
      const filePath = join(this.sessionsDir, `${conversation.id}_placeholder.json`);
      
      const placeholder = {
        ...conversation,
        messages: [],
        localOnly: false,
        placeholder: true,
        needsDownload: true
      };

      const data = JSON.stringify(placeholder, null, 2);
      writeFileSync(filePath, data, { mode: 0o600 });

      logger.debug(`Created placeholder for conversation: ${conversation.id}`);

    } catch (error) {
      logger.error(`Failed to create placeholder for ${conversation.id}`, error as Error);
      throw error;
    }
  }

  async markAsDownloaded(conversationId: string): Promise<void> {
    try {
      // Update the sessions index
      const conversations = await this.loadConversationsIndex();
      const updated = conversations.map(conv => 
        conv.id === conversationId 
          ? { ...conv, isDownloaded: true }
          : conv
      );
      await this.saveConversationsIndex(updated);

      // Remove placeholder file if it exists
      const placeholderPath = join(this.sessionsDir, `${conversationId}_placeholder.json`);
      if (existsSync(placeholderPath)) {
        const fs = require('fs');
        fs.unlinkSync(placeholderPath);
        logger.debug(`Removed placeholder file for ${conversationId}`);
      }

    } catch (error) {
      logger.error(`Failed to mark conversation as downloaded: ${conversationId}`, error as Error);
      throw error;
    }
  }

  async getLastSyncTime(): Promise<Date | null> {
    if (!existsSync(this.sessionsFile)) {
      return null;
    }

    try {
      const data = readFileSync(this.sessionsFile, 'utf8');
      const sessionsIndex: SessionsIndex = JSON.parse(data);
      return new Date(sessionsIndex.lastSync);

    } catch (error) {
      logger.debug('Failed to get last sync time', error);
      return null;
    }
  }

  async getStats(): Promise<{
    totalConversations: number;
    downloadedConversations: number;
    lastSync: Date | null;
  }> {
    const conversations = await this.loadConversationsIndex();
    const downloadedCount = conversations.filter(conv => conv.isDownloaded).length;
    const lastSync = await this.getLastSyncTime();

    return {
      totalConversations: conversations.length,
      downloadedConversations: downloadedCount,
      lastSync
    };
  }

  async findConversation(searchTerm: string): Promise<ConversationMetadata[]> {
    const conversations = await this.loadConversationsIndex();
    const lowerSearch = searchTerm.toLowerCase();

    return conversations.filter(conv => 
      conv.title.toLowerCase().includes(lowerSearch) ||
      conv.id.toLowerCase().includes(lowerSearch)
    );
  }

  async hasConversation(conversationId: string): Promise<boolean> {
    const conversations = await this.loadConversationsIndex();
    return conversations.some(conv => conv.id === conversationId);
  }
}