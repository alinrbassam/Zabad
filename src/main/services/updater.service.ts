import { app } from 'electron';
import { autoUpdater } from 'electron-updater';
import { logger } from './logger.service';

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes?: string;
  downloadUrl?: string;
  isPackaged?: boolean;
}

function compareVersions(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const clean2 = v2.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(clean1.length, clean2.length); i++) {
    const num1 = clean1[i] || 0;
    const num2 = clean2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export class UpdaterService {
  public async checkForUpdates(requestedVersion?: string): Promise<UpdateCheckResult> {
    let currentVersion = requestedVersion || '1.0.0';
    try {
      if (typeof app !== 'undefined' && app.getVersion) {
        currentVersion = app.getVersion();
      }
    } catch {
      // fallback
    }

    const isPackaged = typeof app !== 'undefined' ? Boolean(app.isPackaged) : false;

    // In packaged app, trigger electron-updater
    if (isPackaged) {
      try {
        const result = await autoUpdater.checkForUpdates();
        if (result && result.updateInfo) {
          const latestVersion = result.updateInfo.version;
          const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;
          return {
            hasUpdate,
            currentVersion,
            latestVersion,
            releaseNotes: typeof result.updateInfo.releaseNotes === 'string'
              ? result.updateInfo.releaseNotes
              : 'New version available with improvements and fixes.',
            downloadUrl: `https://github.com/alinrbassam/Zabad/releases/tag/v${latestVersion}`,
            isPackaged: true,
          };
        }
      } catch (err) {
        logger.warn('UpdaterService', 'Packaged autoUpdater check failed, trying GitHub API fallback', err);
      }
    }

    // Direct GitHub Releases fallback (works in dev & production)
    try {
      const response = await fetch('https://api.github.com/repos/alinrbassam/Zabad/releases/latest', {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Zabad-POS-Updater',
        },
      });

      if (response.status === 404) {
        return {
          hasUpdate: false,
          currentVersion,
          latestVersion: currentVersion,
          releaseNotes: 'No releases published yet on GitHub. You are running the latest code.',
          isPackaged,
        };
      }

      if (!response.ok) {
        throw new Error(`GitHub API returned status ${response.status}`);
      }

      const release: any = await response.json();
      const latestTag = release.tag_name || '1.0.0';
      const cleanLatest = latestTag.replace(/^v/, '');
      const hasUpdate = compareVersions(cleanLatest, currentVersion) > 0;

      return {
        hasUpdate,
        currentVersion,
        latestVersion: cleanLatest,
        releaseNotes: release.body || 'New features and bug fixes.',
        downloadUrl: release.html_url || `https://github.com/alinrbassam/Zabad/releases/tag/${latestTag}`,
        isPackaged,
      };
    } catch (err: any) {
      logger.info('UpdaterService', 'GitHub check completed with offline fallback', err.message);
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion: currentVersion,
        releaseNotes: 'Could not connect to GitHub (you may be offline or no releases are published yet).',
        isPackaged,
      };
    }
  }
}
