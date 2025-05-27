export interface PocConfig {
  chromePath?: string;
  chromeProfile?: string;
  apiEndpoints: {
    baseUrl: string;
    conversationsPath: string;
    messagesPath: string;
  };
  storage: {
    dataDir: string;
    maxConversations?: number;
    autoSync: boolean;
  };
  ui: {
    colorOutput: boolean;
    interactive: boolean;
    paginationSize: number;
  };
}