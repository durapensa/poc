export interface ConversationMetadata {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  isDownloaded: boolean;
  hash?: string;
  organizationId: string;
}

export interface Message {
  id: string;
  role: 'human' | 'assistant';
  content: string;
  timestamp: Date;
  conversationId: string;
}

export interface FullConversation extends ConversationMetadata {
  messages: Message[];
  localOnly: boolean;
  placeholder?: boolean;
  needsDownload?: boolean;
}