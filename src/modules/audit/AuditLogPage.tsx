import React, { useEffect, useState } from 'react';
import { Card } from '@components/ui/Card';
import { Table, Column } from '@components/ui/Table';
import { Badge } from '@components/ui/Badge';
import { SearchBox } from '@components/ui/SearchBox';
import { AuditLogEntity } from '@shared/types';
import { ShieldCheck } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntity[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    if (window.api?.getAuditLogs) {
      window.api.getAuditLogs(100).then((res) => {
        if (res.success && res.data) {
          setLogs(res.data);
        }
        setIsLoading(false);
      });
    }
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.module.toLowerCase().includes(search.toLowerCase()) ||
      (l.username && l.username.toLowerCase().includes(search.toLowerCase())),
  );

  const columns: Column<AuditLogEntity>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (l) => (
        <span className="text-slate-500 font-mono text-[11px]">
          {new Date(l.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'username',
      header: 'User',
      render: (l) => (
        <span className="font-bold text-slate-800 dark:text-slate-200">
          {l.username || 'System / Setup'}
        </span>
      ),
    },
    {
      key: 'module',
      header: 'Module',
      render: (l) => <Badge variant="info">{l.module}</Badge>,
    },
    {
      key: 'action',
      header: 'Action',
      render: (l) => (
        <span className="font-semibold text-slate-700 dark:text-slate-300">{l.action}</span>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (l) => <span className="text-slate-500 text-xs">{l.details || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <ShieldCheck className="h-6 w-6 text-sky-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Audit Logs</h1>
          <p className="text-xs text-slate-500">
            Immutable security event audit trail for user authentication, password changes, and
            system settings.
          </p>
        </div>
      </div>

      <Card>
        <div className="mb-4 max-w-xs">
          <SearchBox value={search} onChange={setSearch} placeholder="Search audit logs..." />
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading audit records...</div>
        ) : (
          <Table columns={columns} data={filteredLogs} keyExtractor={(l) => l.id} />
        )}
      </Card>
    </div>
  );
};
