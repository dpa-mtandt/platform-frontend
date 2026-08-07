import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { Spinner } from '@/components/ui/primitives';
import Forbidden from '@/pages/forbidden';

function FullLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-100">
      <Spinner className="h-8 w-8 text-slate-400" />
    </div>
  );
}

/** Requires an authenticated session; otherwise redirects to /login. */
export function ProtectedRoute() {
  const { profile, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <FullLoader />;
  if (!profile) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <Outlet />;
}

/** Requires access to a specific module; otherwise shows a 403 page. */
export function RequireModule({ moduleKey }: { moduleKey: string }) {
  const { hasModule, loading } = useAuth();
  if (loading) return <FullLoader />;
  if (!hasModule(moduleKey)) return <Forbidden />;
  return <Outlet />;
}

/** Requires at least one of the given permissions; otherwise shows a 403 page. */
export function RequirePermission({ anyOf }: { anyOf: string[] }) {
  const { canAny, loading } = useAuth();
  if (loading) return <FullLoader />;
  if (!canAny(...anyOf)) return <Forbidden />;
  return <Outlet />;
}

/** Already-authenticated users are bounced away from /login. */
export function PublicOnlyRoute() {
  const { profile, loading } = useAuth();
  if (loading) return <FullLoader />;
  if (profile) return <Navigate to="/" replace />;
  return <Outlet />;
}
