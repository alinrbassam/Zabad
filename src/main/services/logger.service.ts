import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export class LoggerService {
  private static instance: LoggerService;
  private logDir: string;
  private currentLogFile: string;
  private maxFileSize = 5 * 1024 * 1024; // 5 MB

  private constructor() {
    const userDataPath = app ? app.getPath('userData') : process.cwd();
    this.logDir = path.join(userDataPath, 'logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    const today = new Date().toISOString().split('T')[0];
    this.currentLogFile = path.join(this.logDir, `zabad-${today}.log`);
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  public log(level: LogLevel, module: string, message: string, details?: unknown): void {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${level.toUpperCase()}] [${module}]: ${message} ${
      details ? JSON.stringify(details) : ''
    }\n`;

    try {
      this.rotateIfNeeded();
      fs.appendFileSync(this.currentLogFile, formatted, 'utf-8');
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(formatted.trim());
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed writing to log file:', err);
    }
  }

  public info(module: string, message: string, details?: unknown): void {
    this.log('info', module, message, details);
  }

  public warn(module: string, message: string, details?: unknown): void {
    this.log('warn', module, message, details);
  }

  public error(module: string, message: string, details?: unknown): void {
    this.log('error', module, message, details);
  }

  private rotateIfNeeded(): void {
    if (fs.existsSync(this.currentLogFile)) {
      const stats = fs.statSync(this.currentLogFile);
      if (stats.size >= this.maxFileSize) {
        const timestamp = Date.now();
        const rotated = this.currentLogFile.replace('.log', `-${timestamp}.log`);
        fs.renameSync(this.currentLogFile, rotated);
      }
    }
  }
}

export const logger = LoggerService.getInstance();
