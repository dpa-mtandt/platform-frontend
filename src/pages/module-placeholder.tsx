import { Link } from 'react-router-dom';
import { ArrowLeft, Hammer } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { ModuleIcon } from '@/components/ui/icon';
import { Button } from '@/components/ui/primitives';

/**
 * Temporary landing for a module whose features arrive in a later phase. It is
 * mounted behind the RequireModule guard, so reaching it at all already proves
 * the user has access — unauthorized users get the 403 page instead.
 */
export default function ModulePlaceholder({ moduleKey, phase }: { moduleKey: string; phase: string }) {
  const { profile } = useAuth();
  const module = profile?.modules.find((m) => m.key === moduleKey);
  const name = module?.name ?? moduleKey;

  return (
    <div>
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>

      <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl text-white" style={{ backgroundColor: module?.color || '#64748b' }}>
          <ModuleIcon name={module?.icon} className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{name}</h1>
        <p className="mt-2 max-w-md text-sm text-slate-500">{module?.description}</p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 ring-1 ring-amber-200">
          <Hammer className="h-4 w-4" /> Arrives in {phase}
        </div>
        <p className="mt-6 max-w-md text-sm text-slate-400">
          You have access to this module. Its full functionality is being migrated into the unified platform and will
          appear here without any change to your access.
        </p>
        <Link to="/" className="mt-6">
          <Button variant="outline">Back to launcher</Button>
        </Link>
      </div>
    </div>
  );
}
