import React, { useState } from 'react';
import { Dialog } from '@components/ui/Dialog';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';

export const ForgotPasswordModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [username, setUsername] = useState('');
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchQuestion = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (window.api?.getSecurityQuestion) {
        const res = await window.api.getSecurityQuestion(username);
        if (res.success && res.data) {
          setQuestion(res.data.question);
        } else {
          setError('Username not found or no security question set.');
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (window.api?.recoverPassword) {
        const res = await window.api.recoverPassword(username, answer, newPassword);
        if (res.success) {
          setSuccess('Password reset successfully! You can now log in.');
          setTimeout(() => {
            onClose();
            setQuestion(null);
            setSuccess(null);
          }, 2000);
        } else {
          setError(res.error?.message || 'Password reset failed');
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} title="Password Recovery" onClose={onClose}>
      <div className="space-y-4">
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {!question ? (
          <div className="space-y-3">
            <Input
              label="Enter Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
            />
            <Button onClick={fetchQuestion} isLoading={isLoading} className="w-full">
              Find Security Question
            </Button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-3">
            <div className="text-xs bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg border">
              <span className="font-bold block text-slate-800 dark:text-slate-200">
                Security Question:
              </span>
              <p className="text-slate-600 dark:text-slate-300">{question}</p>
            </div>

            <Input
              label="Your Answer *"
              type="password"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
            />
            <Input
              label="New Password *"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Button type="submit" isLoading={isLoading} className="w-full">
              Reset Password →
            </Button>
          </form>
        )}
      </div>
    </Dialog>
  );
};
