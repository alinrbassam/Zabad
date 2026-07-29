export interface UpdateCheckResult {
  updateAvailable: boolean;
  version?: string;
  releaseNotes?: string;
}

export interface IUpdaterService {
  checkForUpdates(): Promise<UpdateCheckResult>;
  downloadUpdate(): Promise<void>;
  installAndRestart(): void;
}
