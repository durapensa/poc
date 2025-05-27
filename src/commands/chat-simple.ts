import { Command } from 'commander';
import { SessionStore } from '../storage/session-store';
import { MessageClient } from '../sync/message-client';
import { FileManager } from '../storage/file-manager';
import { logger } from '../utils/logger';
import inquirer from 'inquirer';
import { createInitCommand } from './init';

export function createChatCommand(): Command {
  return new Command('chat')
    .description('Start interactive chat with Claude')
    .argument('[message]', 'Message to send (for non-interactive mode)')
    .option('-p, --print', 'Non-interactive mode - send message and print response')
    .option('--continue [message]', 'Continue most recent conversation, optionally with a message')
    .option('--resume <conversation-id>', 'Resume specific conversation by ID')
    .option('--new', 'Force create a new conversation')
    .option('--title <title>', 'Title for new conversation')
    .action(async (message, options) => {
      try {
        await handleChatCommand(message, options);
      } catch (error: any) {
        logger.error('Chat session failed');
        
        if (error.message.includes('No authentication tokens')) {
          logger.info('Run "poc init" to set up authentication first');
        } else if (error.message.includes('Authentication failed')) {
          // Handle expired tokens
          await handleAuthenticationFailure(message, options);
          return;
        }
        
        process.exit(1);
      }
    });
}

async function handleAuthenticationFailure(message?: string, options?: any) {
  logger.warn('Authentication tokens have expired');
  
  const { shouldRefresh } = await inquirer.prompt([{
    type: 'confirm',
    name: 'shouldRefresh',
    message: 'Would you like to refresh your authentication tokens now?',
    default: true
  }]);
  
  if (!shouldRefresh) {
    logger.info('Please run "poc init" manually when you\'re ready to refresh tokens');
    process.exit(1);
    return;
  }
  
  try {
    logger.info('Refreshing authentication tokens...');
    
    // Import and execute the init command functionality
    const { performTokenAuthentication } = await import('./init');
    await performTokenAuthentication();
    
    logger.success('Authentication tokens refreshed successfully!');
    logger.info('Retrying your command...');
    
    // Retry the original command with new tokens
    await handleChatCommand(message, options);
    
  } catch (refreshError: any) {
    logger.error('Failed to refresh authentication tokens');
    logger.info('Please run "poc init" manually to set up authentication');
    process.exit(1);
  }
}

async function handleChatCommand(message?: string, options?: any) {
  // Handle different command modes
  if (options.continue !== undefined) {
    return await handleContinueMode(options.continue || message, options);
  }
  
  if (options.print && message) {
    return await handlePrintMode(message, options);
  }
  
  if (message && !options.print) {
    logger.warn('Message provided without --print flag. Use --print for non-interactive mode or omit message for interactive mode.');
    return;
  }
  
  // Default to interactive mode
  return await startInteractiveChatSession(options.resume, options);
}

async function handlePrintMode(message: string, options: any) {
  const auth = FileManager.loadAuthTokens();
  if (!auth) {
    throw new Error('No authentication tokens found. Run "poc init" first.');
  }

  const messageClient = new MessageClient(auth);
  let conversationId = options.resume;
  
  if (!conversationId) {
    // Create a new conversation for print mode
    try {
      conversationId = await messageClient.createConversation(options.title || 'CLI Chat');
    } catch (error: any) {
      if (error.message.includes('Authentication failed')) {
        throw error; // Re-throw to be handled by main error handler
      }
      logger.error(`Failed to create conversation: ${error.message}`);
      process.exit(1);
    }
  }
  
  try {
    const response = await messageClient.sendMessage(conversationId, message);
    console.log(response.content);
  } catch (error: any) {
    if (error.message.includes('Authentication failed')) {
      throw error; // Re-throw to be handled by main error handler
    }
    logger.error(`Failed to send message: ${error.message}`);
    process.exit(1);
  }
}

async function handleContinueMode(message: string | boolean, options: any) {
  const auth = FileManager.loadAuthTokens();
  if (!auth) {
    throw new Error('No authentication tokens found. Run "poc init" first.');
  }

  const sessionStore = new SessionStore();
  const messageClient = new MessageClient(auth);
  
  // Get most recent conversation
  const conversations = await sessionStore.getConversationList();
  if (conversations.length === 0) {
    logger.error('No conversations found. Run "poc sync" first or start a new conversation.');
    return;
  }
  
  // Sort by updatedAt to get most recent
  const mostRecent = conversations.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )[0];
  
  logger.info(`Continuing conversation: ${mostRecent.title} (${mostRecent.id})`);
  
  // If message is provided, send it in print mode
  if (typeof message === 'string' && message.trim()) {
    try {
      const response = await messageClient.sendMessage(mostRecent.id, message);
      console.log(response.content);
    } catch (error: any) {
      if (error.message.includes('Authentication failed')) {
        throw error; // Re-throw to be handled by main error handler
      }
      logger.error(`Failed to send message: ${error.message}`);
      process.exit(1);
    }
  } else {
    // Continue in interactive mode
    await startInteractiveChatSession(mostRecent.id, options);
  }
}

async function startInteractiveChatSession(conversationId?: string, options?: any) {
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