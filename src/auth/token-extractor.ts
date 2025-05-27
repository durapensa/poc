import { ChromeStorage, AuthTokens } from '../types/auth';
import { logger } from '../utils/logger';

export class TokenExtractor {
  static extractTokens(storage: ChromeStorage): AuthTokens | null {
    logger.debug('Extracting authentication tokens from Chrome storage');

    const { localStorageData, cookies } = storage;
    
    let sessionToken: string | undefined;
    let organizationId: string | undefined;
    let userId: string | undefined;
    let csrfToken: string | undefined;

    for (const [key, value] of Object.entries(localStorageData)) {
      try {
        if (key.includes('session') || key.includes('auth') || key.includes('token')) {
          logger.debug('Found potential auth data in localStorage', key);
          
          if (typeof value === 'object' && value !== null) {
            if (value.sessionToken || value.session_token) {
              sessionToken = value.sessionToken || value.session_token;
            }
            if (value.organizationId || value.organization_id) {
              organizationId = value.organizationId || value.organization_id;
            }
            if (value.userId || value.user_id) {
              userId = value.userId || value.user_id;
            }
          } else if (typeof value === 'string') {
            if (key.includes('session') && value.length > 20) {
              sessionToken = value;
            }
            if (key.includes('org') && value.startsWith('org-')) {
              organizationId = value;
            }
          }
        }
      } catch (error) {
        logger.debug('Error processing localStorage entry', { key, error });
      }
    }

    logger.debug('Processing cookies', { count: cookies.length });
    
    for (const cookie of cookies) {
      try {
        logger.debug('Found cookie', { name: cookie.name, domain: cookie.domain, valueLength: cookie.value.length });
        
        if (cookie.name.includes('session') && cookie.value.length > 20) {
          sessionToken = sessionToken || cookie.value;
          logger.debug('Found session token in cookies', cookie.name);
        }
        
        if (cookie.name.includes('csrf') || cookie.name.includes('xsrf')) {
          csrfToken = cookie.value;
          logger.debug('Found CSRF token in cookies', cookie.name);
        }

        if (cookie.name.includes('org') && cookie.value.startsWith('org-')) {
          organizationId = organizationId || cookie.value;
          logger.debug('Found organization ID in cookies', cookie.name);
        }
      } catch (error) {
        logger.debug('Error processing cookie', { cookie: cookie.name, error });
      }
    }

    if (!sessionToken) {
      logger.warn('No session token found in Chrome storage');
      logger.info('Make sure you are logged in to claude.ai in Chrome and try again');
      return null;
    }

    if (!organizationId) {
      logger.warn('No organization ID found, this may cause issues with API calls');
      organizationId = 'unknown';
    }

    const authTokens: AuthTokens = {
      sessionToken,
      organizationId,
      userId,
      csrfToken,
      extractedFrom: 'chrome',
      extractedAt: new Date()
    };

    logger.success('Successfully extracted authentication tokens');
    logger.debug('Token details', {
      hasSessionToken: !!sessionToken,
      hasOrganizationId: !!organizationId,
      hasUserId: !!userId,
      hasCsrfToken: !!csrfToken
    });

    return authTokens;
  }

  static validateTokens(tokens: AuthTokens): boolean {
    if (!tokens.sessionToken || tokens.sessionToken.length < 10) {
      logger.error('Invalid session token');
      return false;
    }

    if (!tokens.organizationId) {
      logger.error('Missing organization ID');
      return false;
    }

    const age = Date.now() - tokens.extractedAt.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (age > maxAge) {
      logger.warn('Tokens are older than 24 hours, may be expired');
    }

    return true;
  }
}