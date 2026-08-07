import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getAccessToken, setAccessToken } from '@/lib/api';
import type { SessionProfile } from '@/lib/types';

interface AuthContextValue {
  profile: SessionProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** True if the user holds a permission (super admins hold everything). */
  can: (permission: string) => boolean;
  canAny: (...permissions: string[]) => boolean;
  /** True if the user may open a module. */
  hasModule: (moduleKey: string) => boolean;
  hasRole: (roleKey: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toProfile(data: any): SessionProfile {
  return {
    user: data.user,
    roles: data.roles ?? [],
    isSuperAdmin: !!data.isSuperAdmin,
    permissions: data.permissions ?? [],
    modules: data.modules ?? [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!getAccessToken()) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setProfile(toProfile(res.data.data));
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMe();
    const onExpired = () => setProfile(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [loadMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    setAccessToken(res.data.data.accessToken);
    setProfile(toProfile(res.data.data));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const res = await api.get('/auth/me');
    setProfile(toProfile(res.data.data));
  }, []);

  const can = useCallback(
    (permission: string) => !!profile && (profile.isSuperAdmin || profile.permissions.includes(permission)),
    [profile],
  );
  const canAny = useCallback(
    (...permissions: string[]) => !!profile && (profile.isSuperAdmin || permissions.some((p) => profile.permissions.includes(p))),
    [profile],
  );
  const hasModule = useCallback(
    (moduleKey: string) => !!profile && (profile.isSuperAdmin || profile.modules.some((m) => m.key === moduleKey)),
    [profile],
  );
  const hasRole = useCallback((roleKey: string) => !!profile && profile.roles.includes(roleKey), [profile]);

  return (
    <AuthContext.Provider value={{ profile, loading, login, logout, refreshProfile, can, canAny, hasModule, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
