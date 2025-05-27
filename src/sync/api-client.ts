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

// The actual response is just an array, not wrapped in an object
export type ApiConversationResponse = ApiConversation[];

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
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/json',
        'anthropic-client-platform': 'web_claude_ai',
        'anthropic-client-version': 'unknown',
        'anthropic-client-sha': 'unknown',
        'anthropic-device-id': '9e375fc5-ab10-418c-ac42-141811bc1825',
        'anthropic-anonymous-id': 'dc893078-42fd-4638-9048-3a30469b5933',
        'baggage': 'sentry-environment=production,sentry-release=b73a1104b7057aff58c453d8efae475601e2e811,sentry-public_key=58e9b9d0fc244061a1b54fe288b0e483,sentry-trace_id=b938057cfd704e009e762cef10a8c4c1,sentry-sample_rate=0.01,sentry-sampled=false',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        'Referer': 'https://claude.ai/',
        'Origin': 'https://claude.ai',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Ch-Ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Priority': 'u=1, i'
      }
    });

    this.setupAuthentication();
    this.setupInterceptors();
  }

  private setupAuthentication(): void {
    // Use the complete cookie string from working browser session
    const cookieString = `activitySessionId=131d246a-de60-4e07-b294-55a6699743a1; anthropic-device-id=9e375fc5-ab10-418c-ac42-141811bc1825; ajs_anonymous_id=dc893078-42fd-4638-9048-3a30469b5933; CH-prefers-color-scheme=dark; cf_clearance=Cjd3O1vFpSMT46rdwb3GU8X.gOj.Ucl7uMmsh4plexk-1748372491-1.2.1.1-B7GLmEEHpdJdOqES1bIs5ZcecFo7qBwcMUd6B6KO9N..C_k5fZQacqrJosMGDDXCAxTYM2ijmGXhakGMBPj7O8Jc0zPJmLXKS6gTJK0K5mvkd5NIxWjgW9absf6SsL1CMXYTSs2YuJrntIrJ1y.eZhzxvMgDp50F52fU2O5r7ruspahwKYxON6046RGB65Oz_XgfA6YpG3gXZwY.ZztxrFMTidQWfGA6hgMKez1CtcAYJAL3t5L0RY5wUCkXAlPfAP4O0D6nH2H9H4T_MUoPcUoQSXV321LOchrDmu63RCkKMh_2C1ShSrX_IeUhvo3StTpNS3f1yJNiBXaZgQ81opQ1eV0b8Jcz5x.DeH9beFU; __ssid=dbb0bd6ca90d8571816366c06a4c2df; lastActiveOrg=${this.auth.organizationId}; intercom-device-id-lupk8zyo=372790a8-ba08-4696-9b57-f6db0053e92d; sessionKey=${this.auth.sessionToken}; intercom-session-lupk8zyo=WjhMTGp2blNTRkRidlljNENvb3ZtNGZUQWllYnBFMlJhVVZpa2RFWmRJQnRYMkN5OFpwZTY1cHFRNG8xSS8xTDVOY1hBOEZ0UEFkNkJCREVLNDZhck5XUUJiakN2K1UyOWV3b3JRMlpXRlk9LS1abG9lby9VWm5xUkJ3eWVFUkdQWUNBPT0=--06381b0061a4f37885a86ec487610755afa766df; user-sidebar-visible-on-load=false; __cf_bm=781vgbuexkEiHllgPPZY.Db3KYKRbbPB2q8Ok6bxeZg-1748374291-1.0.1.1-s_5pAMQXwYZRwJQH8ix8DMIsTxhQQ3K0OSooomjd_JXmKvoSCX4vKY2bhvc7cBowo4XzCI_I6V4EtC2rAFrgvZfpUeJau15GhAnzL_VuoEU`;
    this.client.defaults.headers.common['Cookie'] = cookieString;
    
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

  private generateDeviceId(): string {
    // Generate a UUID-like device ID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private generateAnonymousId(): string {
    // Generate a UUID-like anonymous ID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
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
      
      // Use the real Claude API endpoint with query parameters
      const url = `/organizations/${this.auth.organizationId}/chat_conversations`;
      const params = {
        limit: 30,
        starred: false // Get all conversations, not just starred
      };
      
      const response = await this.client.get<ApiConversationResponse>(url, { params });

      // Response is a direct array, not wrapped in an object
      const conversations: ConversationMetadata[] = response.data.map(conv => ({
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

  async getConversationMessages(conversationId: string): Promise<any> {
    try {
      logger.info(`Fetching messages for conversation: ${conversationId}`);
      
      // Try the conversation detail endpoint first
      const url = `/organizations/${this.auth.organizationId}/chat_conversations/${conversationId}`;
      const response = await this.client.get(url);
      
      return response.data;
      
    } catch (error: any) {
      logger.error('Failed to fetch conversation messages', error);
      throw new Error(`Failed to fetch conversation messages: ${error.message}`);
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