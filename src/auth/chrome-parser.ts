import sqlite3 from 'sqlite3';
import { Level } from 'level';
import { join } from 'path';
import { existsSync } from 'fs';
import { ChromeStorage, ChromeCookie } from '../types/auth';
import { logger } from '../utils/logger';

export class ChromeStorageParser {
  constructor(private profilePath: string) {}

  async parseLocalStorage(): Promise<Record<string, any>> {
    const levelDbPath = join(this.profilePath, 'Local Storage', 'leveldb');
    
    if (!existsSync(levelDbPath)) {
      logger.warn(`LevelDB not found at ${levelDbPath}, skipping localStorage parsing`);
      return {};
    }

    try {
      logger.debug('Attempting to parse LevelDB', levelDbPath);
      
      logger.warn('LevelDB parsing requires Chrome to be closed. Skipping localStorage for now.');
      return {};
    } catch (error) {
      logger.warn('Failed to parse localStorage, continuing with cookies only');
      return {};
    }
  }

  async parseCookies(): Promise<ChromeCookie[]> {
    const cookiesPath = join(this.profilePath, 'Cookies');
    
    if (!existsSync(cookiesPath)) {
      throw new Error(`Cookies database not found at ${cookiesPath}`);
    }

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(cookiesPath, sqlite3.OPEN_READONLY);
      const cookies: ChromeCookie[] = [];

      const query = `
        SELECT name, value, host_key, path, expires_utc, is_httponly, is_secure
        FROM cookies 
        WHERE host_key LIKE '%claude.ai%' OR host_key LIKE '%anthropic%'
      `;
      
      logger.debug('Querying cookies database', cookiesPath);

      db.all(query, (err, rows) => {
        if (err) {
          logger.error('Failed to query cookies database', err);
          reject(err);
          return;
        }

        logger.debug(`Found ${rows.length} cookies from database`);
        
        for (const row of rows as any[]) {
          logger.debug('Raw cookie row', { name: row.name, valueLength: row.value?.length || 0, domain: row.host_key });
          
          const cookie: ChromeCookie = {
            name: row.name,
            value: row.value || '',
            domain: row.host_key,
            path: row.path || '/',
            httpOnly: Boolean(row.is_httponly),
            secure: Boolean(row.is_secure),
          };

          if (row.expires_utc && row.expires_utc > 0) {
            cookie.expiresUtc = new Date((row.expires_utc / 1000000) - 11644473600000);
          }

          cookies.push(cookie);
        }

        db.close();
        resolve(cookies);
      });
    });
  }

  async getFullStorage(): Promise<ChromeStorage> {
    logger.info('Parsing Chrome storage...');
    
    try {
      const [localStorageData, cookies] = await Promise.all([
        this.parseLocalStorage(),
        this.parseCookies()
      ]);

      logger.debug('Storage parsing complete', {
        localStorageKeys: Object.keys(localStorageData).length,
        cookieCount: cookies.length
      });

      return {
        localStorageData,
        cookies,
        profilePath: this.profilePath
      };
    } catch (error) {
      logger.error('Failed to parse Chrome storage', error as Error);
      throw error;
    }
  }
}