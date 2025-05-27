export interface AuthTokens {
  sessionToken: string;
  organizationId: string;
  userId?: string;
  csrfToken?: string;
  expiresAt?: Date;
  extractedFrom: 'chrome' | 'firefox' | 'safari';
  extractedAt: Date;
}

export interface ChromeStorage {
  localStorageData: Record<string, any>;
  cookies: ChromeCookie[];
  profilePath: string;
}

export interface ChromeCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expiresUtc?: Date;
  httpOnly: boolean;
  secure: boolean;
}