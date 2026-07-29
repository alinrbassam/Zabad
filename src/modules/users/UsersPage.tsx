import React, { useEffect, useState } from 'react';
import { useUserStore } from '@stores/useUserStore';
import { useAuthStore } from '@stores/useAuthStore';
import { Table, Column } from '@components/ui/Table';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { SearchBox } from '@components/ui/SearchBox';
import { Card } from '@components/ui/Card';
import { UserFormModal } from './UserFormModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { UserEntity } from '@shared/types';
import { UserPlus, Key, Edit } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { users, loadUsers, loadRoles, toggleUserStatus } = useUserStore();
  const { user: currentUser } = useAuthStore();

  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<(UserEntity & { role_name: string }) | null>(null);
  const [resetTarget, setResetTarget] = useState<(UserEntity & { role_name: string }) | null>(null);

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, [loadUsers, loadRoles]);

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<UserEntity & { role_name: string }>[] = [
    {
      key: 'full_name',
      header: 'User Details',
      render: (u) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block">{u.full_name}</span>
          <span className="text-[10px] text-slate-500">@{u.username}</span>
        </div>
      ),
    },
    {
      key: 'role_name',
      header: 'Role',
      render: (u) => (
        <Badge variant={u.role_name === 'Owner' ? 'info' : 'neutral'}>{u.role_name}</Badge>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (u) => (
        <Badge variant={u.is_active ? 'success' : 'danger'}>
          {u.is_active ? 'Active' : 'Deactivated'}
        </Badge>
      ),
    },
    {
      key: 'pin_code_hash',
      header: 'PIN Mode',
      render: (u) =>
        u.pin_code_hash ? (
          <Badge variant="success">PIN Set</Badge>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (u) => (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => setEditTarget(u)} title="Edit User">
            <Edit className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setResetTarget(u)}
            title="Reset Password"
          >
            <Key className="h-3.5 w-3.5 text-amber-500" />
          </Button>

          {u.id !== currentUser?.id ? (
            <Button
              variant={u.is_active ? 'outline' : 'primary'}
              size="sm"
              onClick={() => currentUser && toggleUserStatus(u.id, !u.is_active, currentUser.id)}
            >
              {u.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
              Current Session
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">User Management</h1>
          <p className="text-xs text-slate-500">
            Manage cashier terminals, role permissions, PIN access, and user accounts.
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          size="md"
          className="flex items-center space-x-2"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add New User</span>
        </Button>
      </div>

      <Card>
        <div className="mb-4 max-w-xs">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search users by name or username..."
          />
        </div>

        <Table columns={columns} data={filteredUsers} keyExtractor={(u) => u.id} />
      </Card>

      <UserFormModal
        isOpen={isAddOpen || Boolean(editTarget)}
        onClose={() => {
          setIsAddOpen(false);
          setEditTarget(null);
        }}
        editUser={editTarget}
      />

      <ResetPasswordModal
        isOpen={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        targetUser={resetTarget}
      />
    </div>
  );
};
