import { useState } from 'react';
import { signIn, signUp } from '../lib/supabase';
import { navigate } from '../App';

type Mode = 'login' | 'signup';

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
      } else {
        const { error: err } = await signUp(email, password);
        if (err) {
          setError(err.message);
        } else {
          setSuccessMsg('Account created! Check your email to confirm, then log in.');
          setMode('login');
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button className="auth-back" onClick={() => navigate('/')}>
          ← Back to Home
        </button>

        <span className="auth-logo">🔑</span>
        <h1 className="auth-title">
          {mode === 'login' ? 'Welcome back!' : 'Create account'}
        </h1>
        <p className="auth-sub">
          {mode === 'login'
            ? 'Log in to manage your kids\' quests and progress.'
            : 'Set up KidQuest for your family today!'}
        </p>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 24 }}>
          <button
            className={`tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
          >
            Log In
          </button>
          <button
            className={`tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
          >
            Sign Up
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading
              ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Working...</>
              : mode === 'login' ? '🚀 Log In' : '✨ Create Account'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <button onClick={() => { setMode('signup'); setError(''); }}>Sign up free</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(''); }}>Log in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
