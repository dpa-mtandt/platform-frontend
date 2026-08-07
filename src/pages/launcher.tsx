import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Lock } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { ModuleIcon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/primitives';

export default function LauncherPage() {
  const { profile } = useAuth();
  if (!profile) return null;

  const modules = [...profile.modules].sort((a, b) => a.sortOrder - b.sortOrder);
  const firstName = profile.user.name.split(' ')[0];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-slate-500">
          You have access to <span className="font-medium text-slate-700">{modules.length}</span>{' '}
          {modules.length === 1 ? 'module' : 'modules'}. Choose one to get started.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.isSuperAdmin && <Badge tone="violet">Super Admin</Badge>}
          {profile.roles.map((r) => (
            <Badge key={r} tone="slate">
              {r}
            </Badge>
          ))}
        </div>
      </div>

      {modules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Lock className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">No modules assigned yet</p>
          <p className="mt-1 text-sm text-slate-500">An administrator needs to grant you access. Please check back later.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map((m) => {
            const external = !!(m.isExternal && m.externalUrl);
            const cardClass =
              'group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md';
            const inner = (
              <>
                <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: m.color || '#64748b' }} />
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl text-white" style={{ backgroundColor: m.color || '#64748b' }}>
                  <ModuleIcon name={m.icon} className="h-6 w-6" />
                </div>
                <h3 className="flex items-center justify-between text-base font-semibold text-slate-900">
                  {m.name}
                  {external ? (
                    <ExternalLink className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-500" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
                  )}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{m.description}</p>
              </>
            );
            return external ? (
              <a key={m.key} href={m.externalUrl!} target="_blank" rel="noopener noreferrer" className={cardClass}>
                {inner}
              </a>
            ) : (
              <Link key={m.key} to={m.path || '/'} className={cardClass}>
                {inner}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
