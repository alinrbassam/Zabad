import React, { useState } from 'react';
import { Dialog } from '@components/ui/Dialog';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';
import { useUserStore } from '@stores/useUserStore';
import { useAuthStore } from '@stores/useAuthStore';
import { UserEntity } from '@shared/types';
import { OwnerPasswordSchema } from '@shared/validation';

export const ResetPasswordModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  targetUser: (UserEntity & { role_name: string }) | null;
}> = ({ isOpen, onClose, targetUser }) => {
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { resetUserPassword } = useUserStore();
  const { user: currentUser } = useAuthStore();

  if (!targetUser) return null;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      OwnerPasswordSchema.parse(newPassword);
      if (currentUser) {
        const ok = await resetUserPassword(targetUser.id, newPassword, currentUser.id);
        if (ok) {
          onClose();
          setNewPassword('');
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} title={`Reset Password: ${targetUser.username}`} onClose={onClose}>
      <form onSubmit={handleReset} className="space-y-4">
        {error && <Alert variant="danger">{error}</Alert>}

        <p className="text-xs text-slate-600 dark:text-slate-300">
          Set a new administrative password for{' '}
          <span className="font-bold">{targetUser.full_name}</span>.
        </p>

        <Input
          label="New Password *"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <div className="pt-2 flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} variant="danger">
            Reset Password
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
