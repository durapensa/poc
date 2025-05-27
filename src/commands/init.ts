import { Command } from 'commander';
import inquirer from 'inquirer';
import { ChromePathDetector } from '../utils/chrome-paths';
import { ChromeStorageParser } from '../auth/chrome-parser';
import { TokenExtractor } from '../auth/token-extractor';
import { FileManager } from '../storage/file-manager';
import { logger } from '../utils/logger';

export function createInitCommand(): Command {
  return new Command('init')
    .description('Initialize POC by extracting Chrome authentication tokens')
    .option('--force', 'Force re-initialization even if tokens exist')
    .option('--chrome-path <path>', 'Custom Chrome profile path')
    .option('--manual', 'Manually input tokens instead of extracting from Chrome')
    .action(async (options) => {
      try {
        if (FileManager.hasAuthTokens() && !options.force) {
          const { overwrite } = await inquirer.prompt([{
            type: 'confirm',
            name: 'overwrite',
            message: 'Authentication tokens already exist. Overwrite?',
            default: false
          }]);

          if (!overwrite) {
            logger.info('Initialization cancelled');
            return;
          }
        }

        logger.info('Initializing POC...');

        let tokens;

        if (options.manual) {
          tokens = await promptForManualTokens();
        } else {
          tokens = await extractTokensFromChrome(options);
        }

        if (!tokens) {
          logger.error('Failed to obtain authentication tokens');
          process.exit(1);
        }

        if (!TokenExtractor.validateTokens(tokens)) {
          logger.error('Provided tokens appear to be invalid');
          process.exit(1);
        }

        FileManager.saveAuthTokens(tokens);

        logger.success('POC initialization complete!');
        logger.info(`Data directory: ${FileManager.getDataDirectory()}`);
        logger.info('You can now use other POC commands like "poc sync" and "poc chat"');

      } catch (error) {
        logger.error('Initialization failed', error as Error);
        process.exit(1);
      }
    });
}

export async function performTokenAuthentication(forceManual: boolean = false): Promise<void> {
  logger.info('Initializing POC...');

  let tokens;

  if (forceManual) {
    tokens = await promptForManualTokens();
  } else {
    tokens = await extractTokensFromChrome({});
  }

  if (!tokens) {
    throw new Error('Failed to obtain authentication tokens');
  }

  if (!TokenExtractor.validateTokens(tokens)) {
    throw new Error('Provided tokens appear to be invalid');
  }

  FileManager.saveAuthTokens(tokens);
  logger.success('Authentication tokens saved successfully!');
}

async function promptForManualTokens() {
  logger.info('Manual token input mode');
  logger.info('You will need to extract tokens from your browser.');
  logger.info('See MANUAL_TOKEN_GUIDE.md for detailed instructions.');
  
  const { showInstructions } = await inquirer.prompt([{
    type: 'confirm',
    name: 'showInstructions',
    message: 'Would you like to see quick extraction instructions?',
    default: true
  }]);

  if (showInstructions) {
    logger.info('Quick Token Extraction Instructions:');
    console.log(`
1. Open claude.ai in your browser and ensure you're logged in
2. Press F12 (or Cmd+Option+I on Mac) to open Developer Tools
3. Go to Application > Cookies > https://claude.ai
4. Find the 'sessionKey' cookie and copy its value
5. Look at your URL for the organization ID (starts with 'org-')

For detailed instructions, see: MANUAL_TOKEN_GUIDE.md
`);
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'sessionToken',
      message: 'Enter your session token:',
      validate: (input: string) => {
        if (!input || input.length < 10) {
          return 'Session token must be at least 10 characters long';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'organizationId',
      message: 'Enter your organization ID (or "unknown" if not found):',
      default: 'unknown',
      validate: (input: string) => {
        if (!input) {
          return 'Organization ID cannot be empty';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'csrfToken',
      message: 'Enter CSRF token (optional, press Enter to skip):',
      default: ''
    }
  ]);

  const tokens = {
    sessionToken: answers.sessionToken.trim(),
    organizationId: answers.organizationId.trim(),
    csrfToken: answers.csrfToken.trim() || undefined,
    extractedFrom: 'chrome' as const,
    extractedAt: new Date()
  };

  logger.success('Tokens entered successfully');
  return tokens;
}

async function extractTokensFromChrome(options: any) {
  let chromeInstallation;
  if (options.chromePath) {
    logger.info(`Using custom Chrome path: ${options.chromePath}`);
    chromeInstallation = { profilePath: options.chromePath };
  } else {
    logger.info('Detecting Chrome installation...');
    chromeInstallation = ChromePathDetector.detectChrome();
  }

  if (!chromeInstallation) {
    logger.error('Chrome installation not found');
    logger.info('Please ensure Chrome is installed and has been used to visit claude.ai');
    logger.info('Or use --manual flag to input tokens manually');
    logger.info('Or specify a custom profile path with --chrome-path');
    
    const { useManual } = await inquirer.prompt([{
      type: 'confirm',
      name: 'useManual',
      message: 'Would you like to switch to manual token input instead?',
      default: true
    }]);

    if (useManual) {
      return await promptForManualTokens();
    }
    
    return null;
  }

  logger.success(`Found Chrome profile: ${chromeInstallation.profilePath}`);

  const parser = new ChromeStorageParser(chromeInstallation.profilePath);
  const storage = await parser.getFullStorage();

  logger.info('Extracting authentication tokens...');
  const tokens = TokenExtractor.extractTokens(storage);

  if (!tokens) {
    logger.error('Failed to extract authentication tokens');
    logger.info('This is likely due to Chrome cookie encryption.');
    
    const { useManual } = await inquirer.prompt([{
      type: 'confirm',
      name: 'useManual',
      message: 'Would you like to input tokens manually instead?',
      default: true
    }]);

    if (useManual) {
      return await promptForManualTokens();
    }
    
    return null;
  }

  return tokens;
}