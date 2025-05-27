import React, { useState, useCallback } from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { SessionStore } from '../storage/session-store';
import { MessageClient } from '../sync/message-client';
import { FileManager } from '../storage/file-manager';
import { ChatInterface } from '../ui/chat-interface';
import { FullConversation, Message } from '../types/conversation';
import { logger } from '../utils/logger';

export function createChatCommand(): Command {
  return new Command('chat')
    .description('Start interactive chat with Claude')
    .argument('[conversation-id]', 'Resume an existing conversation by ID')
    .option('--new', 'Force create a new conversation')
    .option('--title <title>', 'Title for new conversation')
    .action(async (conversationId, options) => {
      try {
        await startChatSession(conversationId, options);
      } catch (error: any) {
        logger.error('Chat session failed', error);
        
        if (error.message.includes('No authentication tokens')) {
          logger.info('Run "poc init" to set up authentication first');
        }
        
        process.exit(1);
      }
    });
}

async function startChatSession(conversationId?: string, options?: any) {
  // Load authentication
  const auth = FileManager.loadAuthTokens();
  if (!auth) {
    throw new Error('No authentication tokens found. Run "poc init" first.');
  }

  const sessionStore = new SessionStore();
  const messageClient = new MessageClient(auth);
  
  let conversation: FullConversation | undefined;
  let currentConversationId = conversationId;

  // Load existing conversation or create new one
  if (conversationId && !options.new) {
    logger.info(`Loading conversation: ${conversationId}`);
    
    conversation = await sessionStore.loadFullConversation(conversationId);
    if (!conversation) {
      logger.warn(`Conversation ${conversationId} not found locally`);
      logger.info('Creating new conversation instead...');
      currentConversationId = undefined;
    }
  }

  // Create new conversation if needed
  if (!currentConversationId || options.new) {
    logger.info('Creating new conversation...');
    try {
      currentConversationId = await messageClient.createConversation(options.title);
      logger.success(`Created new conversation: ${currentConversationId}`);
      
      // Create basic conversation object
      conversation = {
        id: currentConversationId,
        title: options.title || 'New Conversation',
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: 0,
        isDownloaded: false,
        organizationId: auth.organizationId,
        messages: [],
        localOnly: false
      };
    } catch (error) {
      logger.error('Failed to create conversation, using local-only mode');
      currentConversationId = `local_${Date.now()}`;
      conversation = {
        id: currentConversationId,
        title: options.title || 'Local Conversation',
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: 0,
        isDownloaded: true,
        organizationId: auth.organizationId,
        messages: [],
        localOnly: true
      };
    }
  }

  if (!currentConversationId) {
    throw new Error('Failed to determine conversation ID');
  }

  // Start the interactive chat interface
  logger.success('Starting interactive chat...');
  logger.info('Press Ctrl+C to exit the chat');

  const ChatApp = () => {
    const [currentConv, setCurrentConv] = useState(conversation);
    const [isLoading, setIsLoading] = useState(false);
    const [currentResponse, setCurrentResponse] = useState('');

    const handleSendMessage = useCallback(async (message: string) => {
      if (!currentConversationId) return;
      
      setIsLoading(true);
      setCurrentResponse('');

      try {
        // Send message with streaming
        let fullResponse = '';
        
        if (messageClient.sendMessageStreaming) {
          await messageClient.sendMessageStreaming(
            currentConversationId,
            message,
            (chunk: string) => {
              fullResponse = chunk;
              setCurrentResponse(chunk);
            }
          );
        } else {
          const response = await messageClient.sendMessage(currentConversationId, message);
          fullResponse = response.content;
          setCurrentResponse(fullResponse);
        }

        // Add assistant message to conversation
        const assistantMessage: Message = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: fullResponse,
          timestamp: new Date(),
          conversationId: currentConversationId
        };

        setCurrentConv(prev => {
          if (!prev) return prev;
          
          const updatedConv = {
            ...prev,
            messages: [...(prev.messages || []), assistantMessage],
            messageCount: (prev.messageCount || 0) + 2, // +2 for user and assistant
            updatedAt: new Date()
          };
          
          // Save to local storage
          sessionStore.saveFullConversation(updatedConv).catch(error => {
            logger.debug('Failed to save conversation locally', error);
          });
          
          return updatedConv;
        });

      } catch (error: any) {
        logger.error('Failed to send message', error);
        setCurrentResponse('❌ Error: ' + error.message);
      } finally {
        setIsLoading(false);
        setTimeout(() => setCurrentResponse(''), 1000);
      }
    }, [currentConversationId]);

    const handleExit = useCallback(() => {
      logger.info('Chat session ended');
    }, []);

    return (
      <ChatInterface
        conversation={currentConv}
        onSendMessage={handleSendMessage}
        onExit={handleExit}
        isLoading={isLoading}
        currentResponse={currentResponse}
      />
    );
  };

  render(<ChatApp />);
}