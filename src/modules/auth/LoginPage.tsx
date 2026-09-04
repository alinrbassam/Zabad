import React, { useState, useEffect } from 'react';
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
  const [usersList, setUsersList] = useState<{ id: string; username: string; fullName: string }[]>([]);

  const handleDevBypass = () => {
    setAuth({
      token: 'dev-token',
      user: {
        id: 'dev-admin-id',
        username: 'admin',
        email: 'admin@ghazal.com',
        roleId: 'admin',
        isActive: 1,
        firstName: 'Dev',
        lastName: 'Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any,
      role: { id: 'admin', name: 'Administrator' } as any,
      permissions: ['*'],
    });
    navigate('/');
  };

  useEffect(() => {
    if (window.api?.getUsersList) {
      window.api.getUsersList().then((res) => {
        if (res.success && res.data) {
          const mapped = res.data.map((u: any) => ({
            id: u.id,
            username: u.username,
            fullName: u.full_name || u.username,
          }));
          setUsersList(mapped);
          if (mapped.length > 0 && !username) {
            setUsername(mapped[0].username);
          }
        }
      });
    }

    if (import.meta.env.DEV) {
      handleDevBypass();
    }
  }, []);

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
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="h-10 w-10 bg-gradient-to-tr from-sky-500 via-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-cyan-500/25">
              🐟
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-wide">
                {language === 'ar' ? 'نظام زَبَد للأسماك' : 'Zabad POS'}
              </h2>
              <span className="text-[10px] text-cyan-400 font-medium block">
                {language === 'ar' ? 'نظام إدارة مبيعات الأسماك الطازجة' : 'Fresh Seafood Retail System'}
              </span>
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
              onClick={() => {
                if (language === 'fr') setLanguage('en');
                else if (language === 'en') setLanguage('ar');
                else setLanguage('fr');
              }}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 text-xs font-bold uppercase"
              title="Changer de langue / Switch Language"
            >
              {language.toUpperCase()}
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
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                Select Cashier / User
              </label>
              <select
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="" disabled>-- Choose User --</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.username} className="bg-slate-800 text-slate-100">
                    {u.fullName} ({u.username})
                  </option>
                ))}
              </select>
            </div>
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

        <div className="text-[10px] text-center text-slate-500 border-t border-slate-700/50 pt-3 flex flex-col space-y-2 items-center">
          <span>Local SQLite Protected Operating System</span>
          <button
            type="button"
            onClick={handleDevBypass}
            className="text-xs text-sky-400 hover:text-sky-300 hover:underline font-bold mt-1"
          >
            ⚡ Developer Auto-Login (Bypass Login)
          </button>
        </div>
      </div>

      <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} />
    </div>
  );
};
