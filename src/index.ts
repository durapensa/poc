#!/usr/bin/env node

import { Command } from 'commander';
import { createInitCommand } from './commands/init';

const program = new Command();

program
  .name('poc')
  .description('Claude Web Interface CLI Tool')
  .version('1.0.0');

program.addCommand(createInitCommand());

program.parse();