import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@stores/useAuthStore';
import { useThemeStore } from '@stores/useThemeStore';
import { useLanguageStore } from '@stores/useLanguageStore';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';
import { Tabs } from '@components/ui/Tabs';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { Sun, Moon } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth, rememberedUsername, setRememberedUsername } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();

  const [activeTab, setActiveTab] = useState<'password' | 'pin'>('password');
  const [username, setUsername] = useState(rememberedUsername || '');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [remember, setRemember] = useState(Boolean(rememberedUsername));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (window.api?.login) {
        const res = await window.api.login({ username, password, rememberUsername: remember });
        if (res.success && res.data) {
          if (remember) setRememberedUsername(username);
          else setRememberedUsername('');

          setAuth(res.data);
          navigate('/');
          return;
        } else {
          setError(res.error?.message || 'Invalid username or password');
        }
      } else {
        navigate('/');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (window.api?.loginPin) {
        const res = await window.api.loginPin({ username, pin });
        if (res.success && res.data) {
          setAuth(res.data);
          navigate('/');
          return;
        } else {
          setError(res.error?.message || 'Invalid PIN code');
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 select-none">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-700 pb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-sky-600 rounded-xl flex items-center justify-center text-white font-black text-lg">
              RMS
            </div>
            <div>
              <h2 className="text-base font-bold text-white">RMS Enterprise</h2>
              <span className="text-[10px] text-sky-400 font-medium">v1.0.0 Offline Desktop</span>
            </div>
          </div>

          <div className="flex space-x-1">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 text-xs font-bold"
            >
              {language === 'en' ? 'AR' : 'EN'}
            </button>
          </div>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <Tabs
          tabs={[
            { id: 'password', label: 'Password Login' },
            { id: 'pin', label: 'Cashier PIN Login' },
          ]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as 'password' | 'pin')}
        />

        {activeTab === 'password' ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-slate-600 text-sky-600 focus:ring-sky-500"
                />
                <span>Remember Username</span>
              </label>

              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-sky-400 hover:underline font-medium"
              >
                Forgot Password?
              </button>
            </div>

            <Button type="submit" isLoading={isLoading} size="lg" className="w-full">
              Sign In →
            </Button>
          </form>
        ) : (
          <form onSubmit={handlePinLogin} className="space-y-4">
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Cashier username"
              required
            />
            <Input
              label="Quick PIN Code (4-6 digits)"
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              required
            />

            <Button type="submit" isLoading={isLoading} size="lg" className="w-full">
              Unlock Terminal →
            </Button>
          </form>
        )}

        <div className="text-[10px] text-center text-slate-500 border-t border-slate-700/50 pt-3">
          Local SQLite Protected Operating System
        </div>
      </div>

      <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} />
    </div>
  );
};
