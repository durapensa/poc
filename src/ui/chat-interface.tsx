import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, Newline, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import { FullConversation, Message } from '../types/conversation';

interface ChatInterfaceProps {
  conversation?: FullConversation;
  onSendMessage: (message: string) => Promise<void>;
  onExit: () => void;
  isLoading?: boolean;
  currentResponse?: string;
}

export function ChatInterface({ 
  conversation, 
  onSendMessage, 
  onExit, 
  isLoading = false,
  currentResponse = ''
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(conversation?.messages || []);
  const { exit } = useApp();

  useInput((input, key) => {
    if ((key.ctrl && input === 'c') || (key.ctrl && input === 'd')) {
      onExit();
      exit();
    }
  });

  const handleSubmit = useCallback(async (message: string) => {
    if (!message.trim()) return;
    
    // Add user message to display
    const userMessage: Message = {
      id: `temp_${Date.now()}`,
      role: 'human',
      content: message.trim(),
      timestamp: new Date(),
      conversationId: conversation?.id || 'new'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Send message
    await onSendMessage(message.trim());
  }, [onSendMessage, conversation?.id]);

  // Update messages when conversation changes
  useEffect(() => {
    if (conversation?.messages) {
      setMessages(conversation.messages);
    }
  }, [conversation?.messages]);

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="single" borderColor="blue" padding={1}>
        <Text color="blue" bold>
          🤖 Claude CLI Chat
        </Text>
        <Text color="gray">
          {conversation ? ` - ${conversation.title}` : ' - New Conversation'}
        </Text>
      </Box>
      
      <Newline />

      {/* Messages */}
      <Box flexDirection="column" marginBottom={1}>
        {messages.map((message, index) => (
          <MessageComponent key={message.id || index} message={message} />
        ))}
        
        {/* Current streaming response */}
        {isLoading && (
          <Box marginTop={1}>
            <Text color="cyan" bold>🤖 Claude: </Text>
            <Text color="gray">{currentResponse || '...'}</Text>
            <Text color="yellow">▋</Text>
          </Box>
        )}
      </Box>

      {/* Input */}
      <Box borderStyle="single" borderColor="green" padding={1}>
        <Text color="green" bold>💬 You: </Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder={isLoading ? 'Waiting for Claude...' : 'Type your message...'}
          disabled={isLoading}
        />
      </Box>

      {/* Help */}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Press Ctrl+C to exit • Type your message and press Enter to send
        </Text>
      </Box>
    </Box>
  );
}

interface MessageComponentProps {
  message: Message;
}

function MessageComponent({ message }: MessageComponentProps) {
  const isHuman = message.role === 'human';
  
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color={isHuman ? 'green' : 'cyan'} bold>
          {isHuman ? '💬 You' : '🤖 Claude'}: 
        </Text>
        <Text color="gray"> {formatTime(message.timestamp)}</Text>
      </Box>
      <Box paddingLeft={2}>
        <Text>{message.content}</Text>
      </Box>
    </Box>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}