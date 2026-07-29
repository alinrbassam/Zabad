export interface BackupMetadata {
  id: string;
  filename: string;
  createdAt: string;
  sizeBytes: number;
}

export interface IBackupService {
  createBackup(
    destinationFolder?: string,
  ): Promise<{ success: boolean; path?: string; error?: string }>;
  restoreBackup(backupFilePath: string): Promise<{ success: boolean; error?: string }>;
  listBackups(): Promise<BackupMetadata[]>;
}
