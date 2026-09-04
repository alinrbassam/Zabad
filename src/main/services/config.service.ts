import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { AppConfig } from '../../shared/types';
import { AppConfigSchema } from '../../shared/validation';
import { logger } from './logger.service';

const defaultConfig: AppConfig = {
  theme: 'system',
  language: 'en',
  currency: 'FCFA',
  businessName: 'My Enterprise Store',
  businessType: 'Supermarket',
  taxRate: 15.0,
  taxNumber: '',
  address: '',
  phone: '',
  backupPath: '',
  receiptHeader: 'Welcome to our store',
  receiptFooter: 'Thank you for shopping with us!',
  appVersion: '1.0.0',
};

export class ConfigService {
  private static instance: ConfigService;
  private configFilePath: string;
  private currentConfig: AppConfig;

  private constructor() {
    const userDataPath = app ? app.getPath('userData') : process.cwd();
    this.configFilePath = path.join(userDataPath, 'config.json');
    this.currentConfig = this.loadConfig();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public getConfig(): AppConfig {
    return { ...this.currentConfig };
  }

  public updateConfig(partialConfig: Partial<AppConfig>): AppConfig {
    const updated = { ...this.currentConfig, ...partialConfig };
    const validated = AppConfigSchema.parse(updated);
    this.currentConfig = validated;
    this.saveConfig();
    logger.info('ConfigService', 'App configuration updated successfully');
    return this.currentConfig;
  }

  private loadConfig(): AppConfig {
    try {
      if (fs.existsSync(this.configFilePath)) {
        const fileContent = fs.readFileSync(this.configFilePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        return AppConfigSchema.parse({ ...defaultConfig, ...parsed });
      }
    } catch (err) {
      logger.error('ConfigService', 'Error loading config, falling back to defaults', err);
    }
    return defaultConfig;
  }

  private saveConfig(): void {
    try {
      fs.writeFileSync(this.configFilePath, JSON.stringify(this.currentConfig, null, 2), 'utf-8');
    } catch (err) {
      logger.error('ConfigService', 'Failed to save config to disk', err);
    }
  }
}

export const configService = ConfigService.getInstance();
