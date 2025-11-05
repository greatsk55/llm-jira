#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init';
import { startCommand } from './commands/start';
import { stopCommand } from './commands/stop';
import { statusCommand } from './commands/status';

const program = new Command();

program
  .name('llm-jira')
  .description('LLM 기반 프로젝트 관리 도구')
  .version('1.0.0');

program
  .command('init')
  .description('프로젝트 초기화')
  .option('-d, --dir <directory>', '프로젝트 디렉토리', process.cwd())
  .action(initCommand);

program
  .command('start')
  .description('서버 시작')
  .option('-p, --port <port>', '포트 번호', '3000')
  .option('-d, --dir <directory>', '프로젝트 디렉토리', process.cwd())
  .action(startCommand);

program
  .command('stop')
  .description('서버 중지')
  .option('-d, --dir <directory>', '프로젝트 디렉토리', process.cwd())
  .action(stopCommand);

program
  .command('status')
  .description('서버 상태 확인')
  .option('-d, --dir <directory>', '프로젝트 디렉토리', process.cwd())
  .action(statusCommand);

program.parse();
