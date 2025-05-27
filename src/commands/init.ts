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
          logger.info('Or specify a custom profile path with --chrome-path');
          process.exit(1);
        }

        logger.success(`Found Chrome profile: ${chromeInstallation.profilePath}`);

        const parser = new ChromeStorageParser(chromeInstallation.profilePath);
        const storage = await parser.getFullStorage();

        logger.info('Extracting authentication tokens...');
        const tokens = TokenExtractor.extractTokens(storage);

        if (!tokens) {
          logger.error('Failed to extract authentication tokens');
          logger.info('Please ensure you are logged in to claude.ai in Chrome');
          process.exit(1);
        }

        if (!TokenExtractor.validateTokens(tokens)) {
          logger.error('Extracted tokens appear to be invalid');
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