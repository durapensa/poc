import chalk from 'chalk';

export const logger = {
  debug: (message: string, data?: any) => {
    if (process.env.POC_DEBUG) {
      console.log(chalk.gray(`[DEBUG] ${message}`), data || '');
    }
  },
  info: (message: string) => console.log(chalk.blue(`[INFO] ${message}`)),
  warn: (message: string) => console.log(chalk.yellow(`[WARN] ${message}`)),
  error: (message: string, error?: Error) => {
    console.log(chalk.red(`[ERROR] ${message}`));
    if (error && process.env.POC_DEBUG) {
      console.log(error.stack);
    }
  },
  success: (message: string) => console.log(chalk.green(`[SUCCESS] ${message}`))
};