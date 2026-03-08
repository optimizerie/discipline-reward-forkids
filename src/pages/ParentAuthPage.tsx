import { useState } from 'react';
import { signIn, signUp, resetPassword } from '../lib/supabase';
import { navigate } from '../App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GeminiIcon } from '@/components/GeminiIcon';
import { ICON_KEYS } from '@/lib/gemini';

type Mode = 'login' | 'signup' | 'forgot';

export function ParentAuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error: err } = await signIn(email, password);
        if (err) {
          setError(err.message === 'Invalid login credentials'
            ? 'Incorrect email or password. Please try again.'
            : err.message);
        } else {
          navigate('/parent/dashboard');
        }
      } else if (mode === 'signup') {
        const { error: err } = await signUp(email, password);
        if (err) {
          setError(err.message);
        } else {
          setSuccessMsg('Account created! You can now log in.');
          setMode('login');
        }
      } else {
        const redirectTo = window.location.origin;
        const { error: err } = await resetPassword(email, redirectTo);
        if (err) {
          setError(err.message);
        } else {
          setSuccessMsg('Check your email for a password reset link!');
        }
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
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>

        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-3">
              <GeminiIcon iconKey={ICON_KEYS.PARENT_DASHBOARD} size={64} className="rounded-2xl" />
            </div>
            <CardTitle className="text-2xl">
              {mode === 'login' ? 'Welcome back!' : mode === 'signup' ? 'Create account' : 'Reset password'}
            </CardTitle>
            <CardDescription>
              {mode === 'login'
                ? "Log in to manage your kids' quests and progress."
                : mode === 'signup'
                ? 'Set up KidQuest for your family today!'
                : "Enter your email and we'll send you a reset link."}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {mode !== 'forgot' && (
              <Tabs value={mode} onValueChange={(v) => { setMode(v as Mode); setError(''); setSuccessMsg(''); }} className="mb-6">
                <TabsList>
                  <TabsTrigger value="login">Log In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="login" />
                <TabsContent value="signup" />
              </Tabs>
            )}

            {error && (
              <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold p-3">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm font-semibold p-3">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                </div>
              )}

              {mode === 'login' && (
                <div className="text-right -mt-2">
                  <button
                    type="button"
                    className="text-sm text-primary font-bold hover:underline"
                    onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading
                  ? 'Working...'
                  : mode === 'login' ? 'Log In'
                  : mode === 'signup' ? 'Create Account'
                  : 'Send Reset Link'}
              </Button>
            </form>

            <div className="mt-5 text-center text-sm text-muted-foreground font-semibold">
              {mode === 'forgot' ? (
                <>Remember your password?{' '}
                  <button
                    className="text-primary font-bold hover:underline"
                    onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                  >
                    Back to login
                  </button>
                </>
              ) : mode === 'login' ? (
                <>Don't have an account?{' '}
                  <button
                    className="text-primary font-bold hover:underline"
                    onClick={() => { setMode('signup'); setError(''); }}
                  >
                    Sign up free
                  </button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button
                    className="text-primary font-bold hover:underline"
                    onClick={() => { setMode('login'); setError(''); }}
                  >
                    Log in
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
