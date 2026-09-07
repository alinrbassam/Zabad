import { create } from 'zustand';

interface LicenseInfo {
  customerName: string;
  businessName: string;
  deviceId: string;
  issueDate: string;
  expirationDate?: string | null;
  licenseType: string;
  enabledModules: string[];
  status: string;
}

interface BackupRecord {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  backupType: string;
  isAutomatic: boolean;
  createdAt: string;
}

interface DiagnosticsData {
  appVersion: string;
  electronVersion: string;
  nodeVersion: string;
  sqliteVersion: string;
  osPlatform: string;
  osRelease: string;
  totalMemoryMB: number;
  freeMemoryMB: number;
  productCount: number;
  salesCount: number;
  purchaseCount: number;
  lastBackupDate?: string | null;
}

interface CommercialState {
  deviceId: string;
  license: LicenseInfo | null;
  backups: BackupRecord[];
  diagnostics: DiagnosticsData | null;
  updateStatus: {
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion: string;
    releaseNotes?: string;
    downloadUrl?: string;
  } | null;
  isLoading: boolean;
  error: string | null;

  loadDeviceId: () => Promise<void>;
  loadActiveLicense: () => Promise<void>;
  activateLicense: (payloadStr: string) => Promise<boolean>;
  selectAndActivateLicense: () => Promise<boolean>;
  activateWithSecretKey: (secretKey: string) => Promise<boolean>;
  loadBackups: () => Promise<void>;
  createFullBackup: (folder: string) => Promise<boolean>;
  createAutoBackup: (folder: string, retention?: number) => Promise<boolean>;
  runVacuum: () => Promise<boolean>;
  runIntegrityCheck: () => Promise<{ status: string; result: string } | null>;
  loadDiagnostics: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
}

export const useCommercialStore = create<CommercialState>((set, get) => ({
  deviceId: '',
  license: null,
  backups: [],
  diagnostics: null,
  updateStatus: null,
  isLoading: false,
  error: null,

  loadDeviceId: async () => {
    try {
      if (window.api?.getDeviceFingerprint) {
        const res = await window.api.getDeviceFingerprint();
        if (res.success && res.data) {
          set({ deviceId: res.data });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  loadActiveLicense: async () => {
    try {
      if (window.api?.getActiveLicense) {
        const res = await window.api.getActiveLicense();
        if (res.success && res.data) {
          set({ license: res.data as LicenseInfo });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  activateLicense: async (payloadStr) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.activateLicenseFile) {
        const res = await window.api.activateLicenseFile(payloadStr);
        if (res.success && res.data) {
          set({ license: res.data as LicenseInfo });
          return true;
        } else {
          set({ error: res.error?.message || 'Activation failed' });
        }
      }
      return false;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  selectAndActivateLicense: async () => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.selectLicenseFile) {
        const fileRes = await window.api.selectLicenseFile();
        if (!fileRes.success || !fileRes.data) {
          set({ isLoading: false });
          return false;
        }
        return await get().activateLicense(fileRes.data);
      }
      return false;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  activateWithSecretKey: async (secretKey) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.activateWithSecretKey) {
        const res = await window.api.activateWithSecretKey(secretKey);
        if (res.success && res.data) {
          set({ license: res.data as LicenseInfo });
          return true;
        } else {
          set({ error: res.error?.message || 'Code secret incorrect / Invalid secret code' });
        }
      }
      return false;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  loadBackups: async () => {
    try {
      if (window.api?.getBackupsList) {
        const res = await window.api.getBackupsList();
        if (res.success && res.data) {
          set({ backups: res.data as BackupRecord[] });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  createFullBackup: async (folder) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.createFullBackup) {
        const res = await window.api.createFullBackup(folder);
        if (res.success) {
          await get().loadBackups();
          return true;
        }
      }
      return false;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  createAutoBackup: async (folder, retention) => {
    try {
      if (window.api?.createAutoBackup) {
        const res = await window.api.createAutoBackup(folder, retention);
        if (res.success) {
          await get().loadBackups();
          return true;
        }
      }
      return false;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    }
  },

  runVacuum: async () => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.runVacuum) {
        const res = await window.api.runVacuum();
        return res.success;
      }
      return false;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  runIntegrityCheck: async () => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.runIntegrityCheck) {
        const res = await window.api.runIntegrityCheck();
        if (res.success && res.data) {
          return res.data;
        }
      }
      return null;
    } catch (err) {
      set({ error: (err as Error).message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  loadDiagnostics: async () => {
    try {
      if (window.api?.getDiagnosticsMetrics) {
        const res = await window.api.getDiagnosticsMetrics();
        if (res.success && res.data) {
          set({ diagnostics: res.data });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  checkForUpdates: async () => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.checkForUpdatesGithub) {
        const res = await window.api.checkForUpdatesGithub();
        if (res.success && res.data) {
          set({ updateStatus: res.data });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
}));
