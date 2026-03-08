import { useState, useEffect, createContext, useContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { getChildSession, setChildSession as storeChildSession, clearChildSession } from './lib/auth';
import type { ChildSession } from './types';

// Pages
import { LandingPage } from './pages/LandingPage';
import { ParentAuthPage } from './pages/ParentAuthPage';
import { ParentDashboard } from './pages/ParentDashboard';
import { ChildAccessPage } from './pages/ChildAccessPage';
import { ChildDashboard } from './pages/ChildDashboard';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

// ── Auth Context ───────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

// ── Child Context ──────────────────────────────────────────

interface ChildContextType {
  childSession: ChildSession | null;
  setChildSession: (s: ChildSession | null) => void;
}

export const ChildContext = createContext<ChildContextType>({
  childSession: null,
  setChildSession: () => {},
});

export const useChildSession = () => useContext(ChildContext);

// ── Router ─────────────────────────────────────────────────

type Route =
  | { page: 'landing' }
  | { page: 'parent-auth' }
  | { page: 'parent-dashboard' }
  | { page: 'child-access' }
  | { page: 'child-dashboard' }
  | { page: 'reset-password' };

function parseRoute(): Route {
  const hash = window.location.hash.replace('#', '') || '/';
  if (hash === '/' || hash === '') return { page: 'landing' };
  if (hash === '/parent/auth') return { page: 'parent-auth' };
  if (hash === '/parent/dashboard') return { page: 'parent-dashboard' };
  if (hash === '/child') return { page: 'child-access' };
  if (hash === '/child/dashboard') return { page: 'child-dashboard' };
  if (hash === '/reset-password') return { page: 'reset-password' };
  return { page: 'landing' };
}

export function navigate(path: string) {
  window.location.hash = path;
}

// ── App ────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<Route>(parseRoute());
  const [childSession, setChildSessionState] = useState<ChildSession | null>(getChildSession());

  const setChildSession = (s: ChildSession | null) => {
    setChildSessionState(s);
    if (s) storeChildSession(s);
    else clearChildSession();
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(parseRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const renderPage = () => {
    if (loading) return <LoadingScreen />;

    switch (route.page) {
      case 'landing':
        return <LandingPage />;

      case 'parent-auth':
        return <ParentAuthPage />;

      case 'parent-dashboard':
        if (!user) { navigate('/parent/auth'); return <LoadingScreen />; }
        return <ParentDashboard />;

      case 'child-access':
        return <ChildAccessPage />;

      case 'child-dashboard':
        if (!childSession) { navigate('/child'); return <LoadingScreen />; }
        return <ChildDashboard />;

      case 'reset-password':
        return <ResetPasswordPage />;

      default:
        navigate('/');
        return <LoadingScreen />;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      <ChildContext.Provider value={{ childSession, setChildSession }}>
        <div className="app-root">
          {renderPage()}
        </div>
      </ChildContext.Provider>
    </AuthContext.Provider>
  );
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-logo">🌟</div>
      <div className="loading-spinner" />
      <div className="loading-text">Loading KidQuest...</div>
    </div>
  );
}
