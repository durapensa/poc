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
      throw new Error(`LevelDB not found at ${levelDbPath}`);
    }

    let db: Level | undefined;
    try {
      logger.debug('Opening LevelDB', levelDbPath);
      db = new Level(levelDbPath, { valueEncoding: 'utf8' });
      
      const storageData: Record<string, any> = {};
      
      const iterator = db.iterator();
      
      try {
        for await (const [key, value] of iterator) {
          try {
            if (key.includes('claude.ai') || key.includes('anthropic')) {
              logger.debug('Found Claude-related localStorage entry', key);
              
              if (typeof value === 'string') {
                try {
                  storageData[key] = JSON.parse(value);
                } catch {
                  storageData[key] = value;
                }
              } else {
                storageData[key] = value;
              }
            }
          } catch (error) {
            logger.debug('Error parsing localStorage entry', { key, error });
          }
        }
      } finally {
        await iterator.close();
      }
      
      return storageData;
    } catch (error) {
      logger.error('Failed to parse localStorage', error as Error);
      throw error;
    } finally {
      if (db) {
        await db.close();
      }
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

      db.all(query, (err, rows) => {
        if (err) {
          logger.error('Failed to query cookies database', err);
          reject(err);
          return;
        }

        for (const row of rows as any[]) {
          const cookie: ChromeCookie = {
            name: row.name,
            value: row.value,
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