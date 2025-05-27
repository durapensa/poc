import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AuthTokens } from '../types/auth';
import { ConversationMetadata } from '../types/conversation';
import { logger } from '../utils/logger';

export interface ApiConversation {
  uuid: string;
  name: string;
  created_at: string;
  updated_at: string;
  organization_uuid: string;
  message_count?: number;
}

export interface ApiConversationList {
  conversations: ApiConversation[];
  has_more?: boolean;
  next_cursor?: string;
}

export interface ApiError {
  error: string;
  message: string;
  status?: number;
}

export class ClaudeApiClient {
  private client: AxiosInstance;
  private auth: AuthTokens;

  constructor(auth: AuthTokens) {
    this.auth = auth;
    this.client = axios.create({
      baseURL: 'https://claude.ai/api',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://claude.ai/',
        'Origin': 'https://claude.ai',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      }
    });

    this.setupAuthentication();
    this.setupInterceptors();
  }

  private setupAuthentication(): void {
    // Set authentication headers
    this.client.defaults.headers.common['Cookie'] = `sessionKey=${this.auth.sessionToken}`;
    
    if (this.auth.csrfToken) {
      this.client.defaults.headers.common['X-CSRF-Token'] = this.auth.csrfToken;
    }

    logger.debug('API client configured with authentication', {
      hasSessionToken: !!this.auth.sessionToken,
      hasCsrfToken: !!this.auth.csrfToken,
      organizationId: this.auth.organizationId
    });
  }

  private setupInterceptors(): void {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          headers: this.sanitizeHeaders(config.headers)
        });
        return config;
      },
      (error) => {
        logger.error('API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        logger.debug('API Response', {
          status: response.status,
          url: response.config.url,
          dataType: typeof response.data
        });
        return response;
      },
      (error) => {
        const errorInfo = {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message
        };

        if (error.response?.status === 401) {
          logger.error('Authentication failed - tokens may be expired');
        } else if (error.response?.status === 403) {
          logger.error('Access forbidden - insufficient permissions');
        } else if (error.response?.status >= 500) {
          logger.error('Server error');
        } else {
          logger.error('API Error');
        }
        
        logger.debug('Error details', errorInfo);

        return Promise.reject(error);
      }
    );
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    if (sanitized.Cookie) {
      sanitized.Cookie = 'sessionKey=***';
    }
    if (sanitized['X-CSRF-Token']) {
      sanitized['X-CSRF-Token'] = '***';
    }
    return sanitized;
  }

  async getConversations(): Promise<ConversationMetadata[]> {
    try {
      logger.info('Fetching conversation list...');
      
      const url = `/organizations/${this.auth.organizationId}/chat_conversations`;
      const response = await this.client.get<ApiConversationList>(url);

      const conversations: ConversationMetadata[] = response.data.conversations.map(conv => ({
        id: conv.uuid,
        title: conv.name || 'Untitled Conversation',
        createdAt: new Date(conv.created_at),
        updatedAt: new Date(conv.updated_at),
        messageCount: conv.message_count || 0,
        isDownloaded: false,
        organizationId: conv.organization_uuid
      }));

      logger.success(`Retrieved ${conversations.length} conversations`);
      return conversations;

    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.warn('Conversations endpoint not found, trying alternative endpoints...');
        return await this.tryAlternativeEndpoints();
      }
      
      logger.error('Failed to fetch conversations', error);
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }
  }

  private async tryAlternativeEndpoints(): Promise<ConversationMetadata[]> {
    const endpoints = [
      '/chat_conversations',
      `/organizations/${this.auth.organizationId}/conversations`,
      '/conversations',
      '/api/conversations'
    ];

    for (const endpoint of endpoints) {
      try {
        logger.debug(`Trying alternative endpoint: ${endpoint}`);
        const response = await this.client.get(endpoint);
        
        // Try to parse response in different formats
        if (response.data.conversations) {
          return this.parseConversations(response.data.conversations);
        } else if (Array.isArray(response.data)) {
          return this.parseConversations(response.data);
        }
        
      } catch (error) {
        logger.debug(`Alternative endpoint failed: ${endpoint}`);
        continue;
      }
    }

    throw new Error('All conversation endpoints failed');
  }

  private parseConversations(data: any[]): ConversationMetadata[] {
    return data.map((conv, index) => {
      // Handle different response formats
      const id = conv.uuid || conv.id || conv.conversation_id || `conv_${index}`;
      const title = conv.name || conv.title || conv.subject || `Conversation ${index + 1}`;
      const createdAt = conv.created_at || conv.createdAt || conv.created || new Date().toISOString();
      const updatedAt = conv.updated_at || conv.updatedAt || conv.updated || createdAt;
      
      return {
        id,
        title,
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt),
        messageCount: conv.message_count || conv.messageCount || 0,
        isDownloaded: false,
        organizationId: conv.organization_uuid || conv.organizationId || this.auth.organizationId
      };
    });
  }

  async createConversation(title?: string): Promise<string> {
    try {
      logger.info('Creating new conversation...');
      
      const payload = {
        name: title || 'New Conversation'
      };

      const url = `/organizations/${this.auth.organizationId}/chat_conversations`;
      const response = await this.client.post(url, payload);

      const conversationId = response.data.uuid || response.data.id;
      
      if (!conversationId) {
        throw new Error('No conversation ID in response');
      }

      logger.success(`Created conversation: ${conversationId}`);
      return conversationId;

    } catch (error: any) {
      logger.error('Failed to create conversation', error);
      throw new Error(`Failed to create conversation: ${error.message}`);
    }
  }

  async sendMessage(conversationId: string, content: string): Promise<any> {
    try {
      logger.info('Sending message...');
      
      const payload = {
        conversation_uuid: conversationId,
        text: content,
        organization_uuid: this.auth.organizationId
      };

      const response = await this.client.post('/append_message', payload);
      
      logger.success('Message sent successfully');
      return response.data;

    } catch (error: any) {
      logger.error('Failed to send message', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      logger.info('Testing API connection...');
      
      // Try a simple endpoint first
      await this.getConversations();
      
      logger.success('API connection test successful');
      return true;

    } catch (error) {
      logger.error('API connection test failed');
      return false;
    }
  }
}