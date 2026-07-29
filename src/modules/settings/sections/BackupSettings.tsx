import React, { useEffect, useState } from 'react';
import { useCommercialStore } from '@stores/useCommercialStore';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Alert } from '@components/ui/Alert';
import { Table, Column } from '@components/ui/Table';
import { Badge } from '@components/ui/Badge';
import { HardDrive, Cloud } from 'lucide-react';

export const BackupSettings: React.FC = () => {
  const { backups, loadBackups, createFullBackup, createAutoBackup, isLoading, error } =
    useCommercialStore();
  const [folderPath, setFolderPath] = useState('C:\\POS Cloud Backups');
  const [retention, setRetention] = useState(7);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  const handleCreateFull = async () => {
    setSuccessMsg(null);
    const ok = await createFullBackup(folderPath);
    if (ok) {
      setSuccessMsg(`Full backup created successfully in ${folderPath}`);
    }
  };

  const handleCreateAuto = async () => {
    setSuccessMsg(null);
    const ok = await createAutoBackup(folderPath, retention);
    if (ok) {
      setSuccessMsg(`Cloud-Sync database backup created in ${folderPath}`);
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'fileName',
      header: 'Backup File',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200 block">
            {String(r.fileName)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">{String(r.filePath)}</span>
        </div>
      ),
    },
    {
      key: 'fileSize',
      header: 'Size',
      render: (r) => <span>{(Number(r.fileSize) / 1024 / 1024).toFixed(2)} MB</span>,
    },
    {
      key: 'backupType',
      header: 'Type',
      render: (r) => (
        <Badge variant={r.isAutomatic ? 'info' : 'success'}>{String(r.backupType)}</Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (r) => <span>{new Date(String(r.createdAt)).toLocaleString()}</span>,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Backup & Disaster Recovery
        </h2>
        <p className="text-xs text-slate-500">
          Configure full system backups, cloud-sync folder exports, and retention rules.
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      <Card title="1. Backup Destinations & Automated Cloud-Sync">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1 w-full">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cloud-Sync Folder Path
              </label>
              <div className="flex space-x-2">
                <Input
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    if (window.api?.selectDirectory) {
                      const res = await window.api.selectDirectory();
                      if (res.success && res.data) {
                        setFolderPath(res.data);
                      }
                    }
                  }}
                  className="px-4 py-2 text-xs font-medium"
                >
                  Browse...
                </Button>
              </div>
            </div>
            <Input
              label="Retention Count (Keep N Backups)"
              type="number"
              value={retention}
              onChange={(e) => setRetention(Number(e.target.value))}
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <Button
              onClick={handleCreateFull}
              isLoading={isLoading}
              className="flex items-center space-x-2"
            >
              <HardDrive className="h-4 w-4" />
              <span>Create Full System Backup (.db)</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleCreateAuto}
              isLoading={isLoading}
              className="flex items-center space-x-2"
            >
              <Cloud className="h-4 w-4 text-sky-500" />
              <span>Run Automated Cloud-Sync Backup</span>
            </Button>
          </div>
        </div>
      </Card>

      <Card title="2. Recent Backup History Log">
        <Table
          columns={columns}
          data={backups as unknown as Record<string, unknown>[]}
          keyExtractor={(r) => String(r.id)}
        />
      </Card>
    </div>
  );
};
