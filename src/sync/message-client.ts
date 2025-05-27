import { exec } from 'child_process';
import { promisify } from 'util';
import { AuthTokens } from '../types/auth';
import { Message } from '../types/conversation';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export interface SendMessageResponse {
  messageId: string;
  content: string;
  conversationId: string;
}

export class MessageClient {
  constructor(private auth: AuthTokens) {}

  async sendMessage(
    conversationId: string, 
    content: string,
    parentMessageId?: string,
    onStreamChunk?: (chunk: string) => void
  ): Promise<SendMessageResponse> {
    try {
      logger.info('Sending message to Claude...');
      
      // Real Claude completion endpoint with streaming
      const curlCommand = `curl -s 'https://claude.ai/api/organizations/${this.auth.organizationId}/chat_conversations/${conversationId}/completion' \\
        -H 'accept: text/event-stream, text/event-stream' \\
        -H 'accept-language: en-US,en;q=0.9' \\
        -H 'anthropic-client-platform: web_claude_ai' \\
        -H 'content-type: application/json' \\
        -b 'activitySessionId=131d246a-de60-4e07-b294-55a6699743a1; anthropic-device-id=9e375fc5-ab10-418c-ac42-141811bc1825; ajs_anonymous_id=dc893078-42fd-4638-9048-3a30469b5933; CH-prefers-color-scheme=dark; __ssid=dbb0bd6ca90d8571816366c06a4c2df; lastActiveOrg=${this.auth.organizationId}; intercom-device-id-lupk8zyo=372790a8-ba08-4696-9b57-f6db0053e92d; sessionKey=${this.auth.sessionToken}; user-sidebar-visible-on-load=false; cf_clearance=SiU9z2HkUQzj7iixIIWLmCW8eFi.r3N8DEheMJ46650-1748374291-1.2.1.1-O7HI6Lq3i2BwyJ3vCo6KhjZ5iKu_R0xr.n74BLkOHBul7UBe81k01QNuRTDAFH8ae_2NAmVLZhM2ozlA7afyXP4NRLKSX9QqE4FMfm1nKv6AqNomAKXKnDJlDSZ2SE7LSI.2NA2C_VxaTBCoorT3FCGE67jS.9fv1OJ7HrIXp7z0QL.bTcRx2tQAeUyIyouk1U1dsHtNpfMekt5QjWhbUqEC2t3kouD4Ny4wAb0dKapSpq9ZhNR61HQX9KEI7UEz6aRtZIBldAMMVLKvehPiiUlYlKLMd8ZGsKGWv7nb98OdEma.9UUwj_d5a51QTXQO4nNYPuGk_U5W3Bw0Z6ZqMAdUkBf8QnGAVZ.cgc.n5.A; intercom-session-lupk8zyo=QWVqNzZQbDVJSGVhTncyRVlaTVo2MHRnWXNtazNPTFF6OEhUa1ozcDNxeWNLOCt1bW0vZFBtZFBmenI0bEl3c2w3NDdxa3d0UFNqckROdTFOS2JndUZ4bzBPc044V0NuejZ2b0VBdVZhdjQ9LS15TDUvU3hZbjRWaWpCd3krendkMUZRPT0=--6dd2535f0a077041d56c71cb70f652253a855360' \\
        -H 'origin: https://claude.ai' \\
        -H 'referer: https://claude.ai/chat/${conversationId}' \\
        -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36' \\
        --data-raw '{
          "prompt": "${content.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
          "parent_message_uuid": ${parentMessageId ? `"${parentMessageId}"` : 'null'},
          "timezone": "America/New_York",
          "personalized_styles": [
            {
              "type": "default",
              "key": "Default", 
              "name": "Normal",
              "nameKey": "normal_style_name",
              "prompt": "Normal",
              "summary": "Default responses from Claude",
              "summaryKey": "normal_style_summary",
              "isDefault": true
            }
          ],
          "locale": "en-US",
          "tools": [
            {"type": "web_search_v0", "name": "web_search"},
            {"type": "artifacts_v0", "name": "artifacts"},
            {"type": "repl_v0", "name": "repl"}
          ],
          "attachments": [],
          "files": [],
          "sync_sources": [],
          "rendering_mode": "messages"
        }'`;

      logger.debug('Executing Claude completion request');
      const { stdout, stderr } = await execAsync(curlCommand);

      if (stderr) {
        logger.warn('Message send stderr detected');
      }

      if (!stdout.trim()) {
        throw new Error('Empty response from Claude');
      }

      // Parse Server-Sent Events response
      const responseContent = this.parseSSEResponse(stdout);
      
      logger.success('Message sent successfully');
      
      return {
        messageId: `msg_${Date.now()}`,
        content: responseContent,
        conversationId
      };

    } catch (error: any) {
      logger.error('Failed to send message to Claude');
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  private parseSSEResponse(sseData: string): string {
    try {
      // Parse Server-Sent Events format from Claude
      const lines = sseData.split('\n');
      let content = '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.substring(6).trim(); // Remove 'data: '
            if (!jsonStr || jsonStr === '[DONE]') continue;
            
            const data = JSON.parse(jsonStr);
            
            // Handle Claude's streaming format
            if (data.type === 'content_block_delta' && data.delta?.text) {
              content += data.delta.text;
            } else if (data.type === 'message_start' && data.message) {
              // Message started, but no content yet
              continue;
            } else if (data.type === 'content_block_start') {
              // Content block started
              continue;
            } else if (data.type === 'content_block_stop') {
              // Content block finished
              continue;
            } else if (data.type === 'message_stop') {
              // Message finished
              break;
            }
          } catch (parseError) {
            // Skip invalid JSON lines
            logger.debug('Skipping invalid JSON line');
            continue;
          }
        }
      }
      
      return content.trim() || 'No response content received';
      
    } catch (error) {
      logger.warn('Failed to parse SSE response, using raw output');
      return sseData.substring(0, 500) + '...'; // Truncate for readability
    }
  }

  async createConversation(title?: string): Promise<string> {
    try {
      logger.info('Creating new conversation...');
      
      // Placeholder - will be updated with real endpoint
      const curlCommand = `curl -s 'https://claude.ai/api/organizations/${this.auth.organizationId}/chat_conversations' \\
        -X POST \\
        -H 'content-type: application/json' \\
        -b 'sessionKey=${this.auth.sessionToken}' \\
        -d '{
          "name": "${title || 'New Conversation'}"
        }'`;

      const { stdout } = await execAsync(curlCommand);
      const response = JSON.parse(stdout);
      
      const conversationId = response.uuid || response.id;
      if (!conversationId) {
        throw new Error('No conversation ID in response');
      }

      logger.success(`Created conversation: ${conversationId}`);
      return conversationId;

    } catch (error: any) {
      logger.error('Failed to create conversation');
      throw new Error(`Failed to create conversation: ${error.message}`);
    }
  }

  // Placeholder for streaming implementation
  async sendMessageStreaming(
    conversationId: string,
    content: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    // This will be implemented once we discover the streaming endpoint
    logger.warn('Streaming not yet implemented, using regular send');
    
    const response = await this.sendMessage(conversationId, content);
    
    // Simulate streaming by chunking the response
    const words = response.content.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunk = words.slice(0, i + 1).join(' ');
      onChunk(chunk);
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate typing delay
    }
  }
}