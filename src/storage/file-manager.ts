import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { AuthTokens } from '../types/auth';
import { logger } from '../utils/logger';

export class FileManager {
  private static readonly DATA_DIR = join(homedir(), '.poc');
  private static readonly AUTH_FILE = join(this.DATA_DIR, 'auth.json');
  private static readonly SESSIONS_FILE = join(this.DATA_DIR, 'sessions.json');
  private static readonly CONFIG_FILE = join(this.DATA_DIR, 'config.json');
  private static readonly SESSIONS_DIR = join(this.DATA_DIR, 'sessions');

  static ensureDataDirectory(): void {
    if (!existsSync(this.DATA_DIR)) {
      logger.info(`Creating data directory: ${this.DATA_DIR}`);
      mkdirSync(this.DATA_DIR, { recursive: true, mode: 0o700 });
    }

    if (!existsSync(this.SESSIONS_DIR)) {
      logger.debug('Creating sessions directory');
      mkdirSync(this.SESSIONS_DIR, { recursive: true, mode: 0o700 });
    }
  }

  static saveAuthTokens(tokens: AuthTokens): void {
    this.ensureDataDirectory();
    
    try {
      const authData = JSON.stringify(tokens, null, 2);
      writeFileSync(this.AUTH_FILE, authData, { mode: 0o600 });
      logger.success(`Authentication tokens saved to ${this.AUTH_FILE}`);
    } catch (error) {
      logger.error('Failed to save authentication tokens', error as Error);
      throw error;
    }
  }

  static loadAuthTokens(): AuthTokens | null {
    if (!existsSync(this.AUTH_FILE)) {
      logger.debug('No authentication file found');
      return null;
    }

    try {
      const authData = readFileSync(this.AUTH_FILE, 'utf8');
      const tokens = JSON.parse(authData);
      
      if (tokens.extractedAt) {
        tokens.extractedAt = new Date(tokens.extractedAt);
      }
      if (tokens.expiresAt) {
        tokens.expiresAt = new Date(tokens.expiresAt);
      }

      logger.debug('Authentication tokens loaded');
      return tokens;
    } catch (error) {
      logger.error('Failed to load authentication tokens', error as Error);
      return null;
    }
  }

  static getDataDirectory(): string {
    return this.DATA_DIR;
  }

  static getAuthFilePath(): string {
    return this.AUTH_FILE;
  }

  static getSessionsDirectory(): string {
    return this.SESSIONS_DIR;
  }

  static hasAuthTokens(): boolean {
    return existsSync(this.AUTH_FILE);
  }
}