import React, { useState } from 'react';
import { useAuthStore } from '@stores/useAuthStore';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';
import { Lock } from 'lucide-react';

export const ScreenLockModal: React.FC = () => {
  const { isScreenLocked, user, setScreenLocked, logout } = useAuthStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isScreenLocked || !user) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (window.api?.login) {
        const res = await window.api.login({ username: user.username, password });
        if (res.success) {
          setScreenLocked(false);
          setPassword('');
        } else {
          setError('Incorrect password');
        }
      } else {
        setScreenLocked(false);
      }
    } catch {
      setError('Incorrect password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
        <div className="mx-auto h-12 w-12 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500">
          <Lock className="h-6 w-6" />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-100">Screen Locked</h3>
          <p className="text-xs text-slate-400">Terminal locked due to inactivity.</p>
        </div>

        <div className="bg-slate-800 p-3 rounded-lg text-left">
          <p className="text-xs font-bold text-slate-200">{user.full_name}</p>
          <p className="text-[10px] text-slate-400">@{user.username}</p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <form onSubmit={handleUnlock} className="space-y-3">
          <Input
            type="password"
            placeholder="Enter password to unlock"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" isLoading={isLoading} className="w-full">
            Unlock Terminal
          </Button>
        </form>

        <button
          onClick={() => logout()}
          className="text-xs text-slate-500 hover:text-rose-400 font-medium transition-colors"
        >
          Sign Out Completely
        </button>
      </div>
    </div>
  );
};
