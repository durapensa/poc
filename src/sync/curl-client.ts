import { exec } from 'child_process';
import { promisify } from 'util';
import { ConversationMetadata } from '../types/conversation';
import { AuthTokens } from '../types/auth';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export interface CurlConversation {
  uuid: string;
  name: string;
  summary: string;
  created_at: string;
  updated_at: string;
  is_starred: boolean;
  settings: any;
  project_uuid?: string;
  current_leaf_message_uuid: string;
}

export class CurlApiClient {
  constructor(private auth: AuthTokens) {}

  async getConversations(): Promise<ConversationMetadata[]> {
    try {
      logger.info('Fetching conversations using curl...');
      
      // Build the curl command with the exact working format
      const curlCommand = `curl -s 'https://claude.ai/api/organizations/${this.auth.organizationId}/chat_conversations?limit=30&starred=false' \\
        -H 'accept: */*' \\
        -H 'accept-language: en-US,en;q=0.9' \\
        -H 'anthropic-anonymous-id: dc893078-42fd-4638-9048-3a30469b5933' \\
        -H 'anthropic-client-platform: web_claude_ai' \\
        -H 'anthropic-client-sha: unknown' \\
        -H 'anthropic-client-version: unknown' \\
        -H 'anthropic-device-id: 9e375fc5-ab10-418c-ac42-141811bc1825' \\
        -H 'content-type: application/json' \\
        -b 'activitySessionId=131d246a-de60-4e07-b294-55a6699743a1; anthropic-device-id=9e375fc5-ab10-418c-ac42-141811bc1825; ajs_anonymous_id=dc893078-42fd-4638-9048-3a30469b5933; CH-prefers-color-scheme=dark; cf_clearance=Cjd3O1vFpSMT46rdwb3GU8X.gOj.Ucl7uMmsh4plexk-1748372491-1.2.1.1-B7GLmEEHpdJdOqES1bIs5ZcecFo7qBwcMUd6B6KO9N..C_k5fZQacqrJosMGDDXCAxTYM2ijmGXhakGMBPj7O8Jc0zPJmLXKS6gTJK0K5mvkd5NIxWjgW9absf6SsL1CMXYTSs2YuJrntIrJ1y.eZhzxvMgDp50F52fU2O5r7ruspahwKYxON6046RGB65Oz_XgfA6YpG3gXZwY.ZztxrFMTidQWfGA6hgMKez1CtcAYJAL3t5L0RY5wUCkXAlPfAP4O0D6nH2H9H4T_MUoPcUoQSXV321LOchrDmu63RCkKMh_2C1ShSrX_IeUhvo3StTpNS3f1yJNiBXaZgQ81opQ1eV0b8Jcz5x.DeH9beFU; __ssid=dbb0bd6ca90d8571816366c06a4c2df; lastActiveOrg=${this.auth.organizationId}; intercom-device-id-lupk8zyo=372790a8-ba08-4696-9b57-f6db0053e92d; sessionKey=${this.auth.sessionToken}; intercom-session-lupk8zyo=WjhMTGp2blNTRkRidlljNENvb3ZtNGZUQWllYnBFMlJhVVZpa2RFWmRJQnRYMkN5OFpwZTY1cHFRNG8xSS8xTDVOY1hBOEZ0UEFkNkJCREVLNDZhck5XUUJiakN2K1UyOWV3b3JRMlpXRlk9LS1abG9lby9VWm5xUkJ3eWVFUkdQWUNBPT0=--06381b0061a4f37885a86ec487610755afa766df; user-sidebar-visible-on-load=false; __cf_bm=781vgbuexkEiHllgPPZY.Db3KYKRbbPB2q8Ok6bxeZg-1748374291-1.0.1.1-s_5pAMQXwYZRwJQH8ix8DMIsTxhQQ3K0OSooomjd_JXmKvoSCX4vKY2bhvc7cBowo4XzCI_I6V4EtC2rAFrgvZfpUeJau15GhAnzL_VuoEU' \\
        -H 'priority: u=1, i' \\
        -H 'referer: https://claude.ai/new' \\
        -H 'sec-ch-ua: "Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"' \\
        -H 'sec-ch-ua-mobile: ?0' \\
        -H 'sec-ch-ua-platform: "macOS"' \\
        -H 'sec-fetch-dest: empty' \\
        -H 'sec-fetch-mode: cors' \\
        -H 'sec-fetch-site: same-origin' \\
        -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'`;

      logger.debug('Executing curl command');
      const { stdout, stderr } = await execAsync(curlCommand);

      if (stderr) {
        logger.warn('Curl stderr output detected');
      }

      if (!stdout.trim()) {
        throw new Error('Empty response from curl command');
      }

      // Parse the JSON response
      const rawConversations: CurlConversation[] = JSON.parse(stdout);
      
      // Convert to our format
      const conversations: ConversationMetadata[] = rawConversations.map(conv => ({
        id: conv.uuid,
        title: conv.name || 'Untitled Conversation',
        createdAt: new Date(conv.created_at),
        updatedAt: new Date(conv.updated_at),
        messageCount: 0, // We don't have message count in this response
        isDownloaded: false,
        organizationId: this.auth.organizationId
      }));

      logger.success(`Retrieved ${conversations.length} conversations via curl`);
      return conversations;

    } catch (error: any) {
      logger.error('Failed to fetch conversations via curl');
      
      if (error.message.includes('JSON')) {
        logger.error('Invalid JSON response from curl - check token expiration');
      }
      
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }
  }

  async getConversationMessages(conversationId: string): Promise<any> {
    try {
      logger.info(`Fetching messages for conversation via curl: ${conversationId}`);
      
      const url = `https://claude.ai/api/organizations/${this.auth.organizationId}/chat_conversations/${conversationId}`;
      const command = `curl -s '${url}' ` +
        `-H 'anthropic-client-platform: web_claude_ai' ` +
        `-b 'sessionKey=${this.auth.sessionToken}; lastActiveOrg=${this.auth.organizationId}' ` +
        `-H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'`;

      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        logger.warn('Curl stderr: ' + stderr);
      }

      if (!stdout.trim()) {
        throw new Error('Empty response from API');
      }

      // Parse the JSON response
      const response = JSON.parse(stdout);
      
      logger.success(`Retrieved conversation details via curl`);
      return response;

    } catch (error: any) {
      logger.error('Failed to fetch conversation messages via curl');
      
      if (error.message.includes('JSON')) {
        logger.error('Invalid JSON response from curl - check token expiration');
      }
      
      throw new Error(`Failed to fetch conversation messages: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getConversations();
      return true;
    } catch (error) {
      return false;
    }
  }
}