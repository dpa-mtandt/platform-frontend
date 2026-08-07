import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { apiErrorMessage } from '@/lib/utils';
import { ModuleIcon } from '@/components/ui/icon';
import { Badge, Button, Card, Spinner } from '@/components/ui/primitives';

interface ModuleRow {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  path?: string | null;
  color?: string | null;
  sortOrder: number;
  isActive: boolean;
  isCore: boolean;
  isExternal?: boolean;
  externalUrl?: string | null;
  permissionCount: number;
}

export default function AdminModules() {
  const { can } = useAuth();
  const canManage = can('platform.modules.manage');
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [urlDrafts, setUrlDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/modules');
      setModules(res.data.data);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function toggle(m: ModuleRow) {
    setError('');
    try {
      await api.patch(`/modules/${m.id}`, { isActive: !m.isActive });
      setModules((cur) => cur.map((x) => (x.id === m.id ? { ...x, isActive: !x.isActive } : x)));
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function saveUrl(m: ModuleRow) {
    setError('');
    setNotice('');
    setSavingId(m.id);
    try {
      const url = (urlDrafts[m.id] ?? m.externalUrl ?? '').trim();
      await api.patch(`/modules/${m.id}`, { externalUrl: url || null });
      setModules((cur) => cur.map((x) => (x.id === m.id ? { ...x, externalUrl: url || null } : x)));
      setNotice(url ? `${m.name} link saved — it now appears for everyone.` : `${m.name} link cleared — hidden from users.`);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  }

  if (loading)
    return (
      <div className="py-12 text-center">
        <Spinner className="mx-auto h-6 w-6 text-slate-300" />
      </div>
    );

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        The module registry drives the launcher. New business modules are added here without any schema change.
      </p>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
      <div className="grid gap-3">
        {modules.map((m) => (
          <Card key={m.id} className="p-4">
            <div className="flex items-center gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white" style={{ backgroundColor: m.color || '#64748b' }}>
                <ModuleIcon name={m.icon} className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="truncate font-semibold text-slate-900">{m.name}</span>
                  <span className="font-mono text-xs text-slate-400">{m.key}</span>
                  {m.isCore && <Badge tone="blue">core</Badge>}
                  {m.isExternal && <Badge tone="violet">external app</Badge>}
                </div>
                <p className="truncate text-sm text-slate-500">{m.description}</p>
              </div>
              <div className="hidden text-right text-xs text-slate-500 sm:block">
                <div>{m.permissionCount} permissions</div>
                <div className="font-mono text-slate-400">{m.isExternal ? '↗ external' : m.path}</div>
              </div>
              <div>
                {m.isCore ? (
                  <Badge tone="green">Always on</Badge>
                ) : canManage ? (
                  <button
                    onClick={() => toggle(m)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${m.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    title={m.isActive ? 'Active — click to disable' : 'Disabled — click to enable'}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${m.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                ) : (
                  <Badge tone={m.isActive ? 'green' : 'slate'}>{m.isActive ? 'Active' : 'Disabled'}</Badge>
                )}
              </div>
            </div>

            {m.isExternal && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="shrink-0 text-xs font-medium text-slate-500">App link</span>
                {canManage ? (
                  <>
                    <input
                      type="url"
                      value={urlDrafts[m.id] ?? m.externalUrl ?? ''}
                      onChange={(e) => setUrlDrafts((d) => ({ ...d, [m.id]: e.target.value }))}
                      placeholder="https://crm.yourcompany.com/login"
                      className="min-w-0 flex-1 basis-64 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none"
                    />
                    <Button size="sm" loading={savingId === m.id} onClick={() => saveUrl(m)}>Save link</Button>
                  </>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-500">{m.externalUrl || '—'}</span>
                )}
                {!m.externalUrl && <Badge tone="amber">Hidden until link set</Badge>}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
