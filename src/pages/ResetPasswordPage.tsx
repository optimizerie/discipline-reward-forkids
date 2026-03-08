import { useState } from 'react';
import { updatePassword } from '../lib/supabase';
import { navigate } from '../App';

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
    <div className="auth-page">
      <div className="auth-card">
        <span className="auth-logo">🔐</span>
        <h1 className="auth-title">Set new password</h1>
        <p className="auth-sub">Choose a strong password for your KidQuest account.</p>

        {done ? (
          <div className="alert alert-success">
            ✅ Password updated! Redirecting to your dashboard...
          </div>
        ) : (
          <>
            {error && <div className="alert alert-error">{error}</div>}
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  className="form-input"
                  placeholder="Repeat your new password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                className="btn-primary btn-full"
                disabled={loading}
                style={{ marginTop: 8 }}
              >
                {loading
                  ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Saving...</>
                  : '✅ Update Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
