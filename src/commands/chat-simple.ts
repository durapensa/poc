import { Command } from 'commander';
import { SessionStore } from '../storage/session-store';
import { MessageClient } from '../sync/message-client';
import { FileManager } from '../storage/file-manager';
import { logger } from '../utils/logger';
import inquirer from 'inquirer';

export function createChatCommand(): Command {
  return new Command('chat')
    .description('Start interactive chat with Claude')
    .argument('[conversation-id]', 'Resume an existing conversation by ID')
    .option('--new', 'Force create a new conversation')
    .option('--title <title>', 'Title for new conversation')
    .action(async (conversationId, options) => {
      try {
        await startSimpleChatSession(conversationId, options);
      } catch (error: any) {
        logger.error('Chat session failed');
        
        if (error.message.includes('No authentication tokens')) {
          logger.info('Run "poc init" to set up authentication first');
        }
        
        process.exit(1);
      }
    });
}

async function startSimpleChatSession(conversationId?: string, options?: any) {
  // Load authentication
  const auth = FileManager.loadAuthTokens();
  if (!auth) {
    throw new Error('No authentication tokens found. Run "poc init" first.');
  }

  const sessionStore = new SessionStore();
  const messageClient = new MessageClient(auth);
  
  let currentConversationId = conversationId;

  // Load existing conversation or create new one
  if (conversationId && !options.new) {
    logger.info(`Loading conversation: ${conversationId}`);
    
    const conversation = await sessionStore.loadFullConversation(conversationId);
    if (!conversation) {
      logger.warn(`Conversation ${conversationId} not found locally`);
      logger.info('Creating new conversation instead...');
      currentConversationId = undefined;
    } else {
      // Display conversation history
      console.log(`\n📝 ${conversation.title}\n`);
      if (conversation.messages && conversation.messages.length > 0) {
        conversation.messages.forEach(msg => {
          const prefix = msg.role === 'human' ? '💬 You' : '🤖 Claude';
          console.log(`${prefix}: ${msg.content}\n`);
        });
      }
    }
  }

  // Create new conversation if needed
  if (!currentConversationId || options.new) {
    logger.info('Creating new conversation...');
    
    // For now, use one of the existing conversations from our list
    const existingConversations = [
      '835dc1bf-a19d-44a8-a52b-c61fc587aac0',
      'a6b3fd95-e1b4-4dcf-a0d5-61a1c7d5ee34',
      'b55a8fb2-6a8c-4d47-8c5e-7b2a1c3d4e5f'
    ];
    
    currentConversationId = existingConversations[0]; // Use the first one from your list
    logger.success(`Using existing conversation: ${currentConversationId}`);
    console.log(`📝 Interactive Chat with Claude (${currentConversationId})\n`);
  }

  // Simple chat loop
  console.log('🤖 Claude CLI Chat Interface');
  console.log('Type "exit" to quit\n');

  while (true) {
    const { message } = await inquirer.prompt([{
      type: 'input',
      name: 'message',
      message: '💬 You:',
    }]);

    if (message.toLowerCase() === 'exit') {
      logger.info('Chat session ended');
      break;
    }

    if (!message.trim()) {
      continue;
    }

    // Send real message to Claude!
    try {
      console.log('🤖 Claude: ...');
      const response = await messageClient.sendMessage(currentConversationId, message);
      console.log(`🤖 Claude: ${response.content}\n`);
    } catch (error: any) {
      console.log(`🤖 Claude: ❌ Error: ${error.message}\n`);
    }
  }
}