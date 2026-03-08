import { useState } from 'react';
import { updatePassword } from '../lib/supabase';
import { navigate } from '../App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GeminiIcon } from '@/components/GeminiIcon';
import { ICON_KEYS } from '@/lib/gemini';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await updatePassword(password);
      if (err) {
        setError(err.message);
      } else {
        setDone(true);
        setTimeout(() => navigate('/parent/dashboard'), 2000);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-3">
              <GeminiIcon iconKey={ICON_KEYS.APP_LOGO} size={64} className="rounded-2xl" />
            </div>
            <CardTitle className="text-2xl">Set new password</CardTitle>
            <CardDescription>Choose a strong password for your KidQuest account.</CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {done ? (
              <div className="rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm font-semibold p-4 text-center">
                Password updated! Redirecting to your dashboard...
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold p-3">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Repeat your new password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? 'Saving...' : 'Update Password'}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
