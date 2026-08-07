import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { apiErrorMessage } from '@/lib/utils';
import { Badge, Button, Card, Input, Label, Select, Spinner, Textarea } from '@/components/ui/primitives';
import { Dialog } from '@/components/ui/dialog';
import { DASHBOARD_ICON_OPTIONS } from '../dashboard-icon';

interface DashRow {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  category?: string | null;
  icon?: string | null;
  color?: string | null;
  secureEmbedUrl?: string | null;
  workspaceId?: string | null;
  reportId?: string | null;
  isActive: boolean;
  allowExport: boolean;
  sortOrder: number;
  connection: 'mock' | 'secure' | 'real';
  assignedCount: number;
}

const connTone = { real: 'green', secure: 'blue', mock: 'amber' } as const;

export default function ManageDashboards() {
  const [rows, setRows] = useState<DashRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<DashRow | 'new' | null>(null);
  const [assigning, setAssigning] = useState<DashRow | null>(null);
  const [deleting, setDeleting] = useState<DashRow | null>(null);
  const [status, setStatus] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows((await api.get('/dashboard/manage')).data.data);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function testConnection() {
    setStatus('Checking…');
    const r = (await api.get('/dashboard/status')).data.data;
    setStatus(`${r.ok ? '✓' : '•'} Power BI mode: ${r.mode}. ${r.steps.map((s: { detail: string }) => s.detail).join(' ')}`);
  }

  return (
    <div>
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Dashboards
      </Link>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manage Dashboards</h1>
          <p className="text-sm text-slate-500">Register Power BI reports and assign who can see each one.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={testConnection}>Test Power BI</Button>
          <Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> New dashboard</Button>
        </div>
      </div>
      {status && <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">{status}</p>}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Dashboard</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Connection</th>
                <th className="px-4 py-3">Assigned</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400">No dashboards yet.</td></tr>
              ) : (
                rows.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color || '#94a3b8' }} />
                        <div>
                          <div className="font-medium text-slate-900">{d.name}</div>
                          <div className="font-mono text-xs text-slate-400">{d.key}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{d.category ?? '—'}</td>
                    <td className="px-4 py-3"><Badge tone={connTone[d.connection]}>{d.connection}</Badge></td>
                    <td className="px-4 py-3 text-slate-600">{d.assignedCount}</td>
                    <td className="px-4 py-3"><Badge tone={d.isActive ? 'green' : 'slate'}>{d.isActive ? 'Active' : 'Off'}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" title="Assign users" onClick={() => setAssigning(d)}><Users className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" title="Edit" onClick={() => setEditing(d)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" title="Delete" onClick={() => setDeleting(d)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && <DashboardEditor dashboard={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load(); }} />}
      {assigning && <AssignDialog dashboard={assigning} onClose={() => setAssigning(null)} onSaved={() => { setAssigning(null); void load(); }} />}
      {deleting && (
        <Dialog open onClose={() => setDeleting(null)} title={`Delete "${deleting.name}"?`}
          footer={<><Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><Button variant="danger" onClick={async () => { await api.delete(`/dashboard/${deleting.id}`); setDeleting(null); void load(); }}>Delete</Button></>}>
          <p className="text-sm text-slate-600">This removes the dashboard and everyone's access to it.</p>
        </Dialog>
      )}
    </div>
  );
}

function DashboardEditor({ dashboard, onClose, onSaved }: { dashboard: DashRow | null; onClose: () => void; onSaved: () => void }) {
  const isNew = !dashboard;
  const [name, setName] = useState(dashboard?.name ?? '');
  const [description, setDescription] = useState(dashboard?.description ?? '');
  const [category, setCategory] = useState(dashboard?.category ?? '');
  const [icon, setIcon] = useState(dashboard?.icon ?? 'BarChart3');
  const [color, setColor] = useState(dashboard?.color ?? '#2563eb');
  const [secureEmbedUrl, setSecureEmbedUrl] = useState(dashboard?.secureEmbedUrl ?? '');
  const [workspaceId, setWorkspaceId] = useState(dashboard?.workspaceId ?? '');
  const [reportId, setReportId] = useState(dashboard?.reportId ?? '');
  const [isActive, setIsActive] = useState(dashboard?.isActive ?? true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = { name, description: description || null, category: category || null, icon, color, secureEmbedUrl: secureEmbedUrl || null, workspaceId: workspaceId || null, reportId: reportId || null, isActive };
      if (isNew) await api.post('/dashboard', body);
      else await api.patch(`/dashboard/${dashboard!.id}`, body);
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title={isNew ? 'New dashboard' : `Edit ${dashboard!.name}`} className="max-w-xl"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button form="dash-form" type="submit" loading={saving}>{isNew ? 'Create' : 'Save'}</Button></>}>
      <form id="dash-form" onSubmit={submit} className="space-y-4">
        <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div><Label>Description</Label><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><Label>Category</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Operations" /></div>
          <div><Label>Icon</Label><Select value={icon} onChange={(e) => setIcon(e.target.value)}>{DASHBOARD_ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}</Select></div>
          <div><Label>Colour</Label><Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 p-1" /></div>
        </div>
        <div>
          <Label>Secure embed URL (Power BI "Website or portal")</Label>
          <Input value={secureEmbedUrl} onChange={(e) => setSecureEmbedUrl(e.target.value)} placeholder="https://app.powerbi.com/reportEmbed?..." />
          <p className="mt-1 text-xs text-slate-400">Leave blank for a sample-data placeholder. "Publish to web" links are rejected.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Workspace ID (service principal)</Label><Input value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)} placeholder="Optional" /></div>
          <div><Label>Report ID</Label><Input value={reportId} onChange={(e) => setReportId(e.target.value)} placeholder="Optional" /></div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-slate-300" /> Active
        </label>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>
    </Dialog>
  );
}

function AssignDialog({ dashboard, onClose, onSaved }: { dashboard: DashRow; onClose: () => void; onSaved: () => void }) {
  const [users, setUsers] = useState<{ id: string; name: string; email: string; department?: { name: string } | null }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    void (async () => {
      const [u, a] = await Promise.all([api.get('/dashboard/users'), api.get(`/dashboard/${dashboard.id}/access`)]);
      setUsers(u.data.data);
      setSelected(new Set(a.data.data.assignedUserIds));
      setLoading(false);
    })();
  }, [dashboard.id]);

  const toggle = (id: string) => setSelected((cur) => { const n = new Set(cur); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const filtered = users.filter((u) => !q || `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()));

  async function save() {
    setSaving(true);
    try {
      await api.put(`/dashboard/${dashboard.id}/access`, { userIds: [...selected] });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title={`Who can see "${dashboard.name}"`} description="Only ticked users will see this dashboard." className="max-w-lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={saving} onClick={save}>Save access ({selected.size})</Button></>}>
      {loading ? (
        <div className="py-8 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>
      ) : (
        <>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" className="mb-2" />
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {filtered.map((u) => (
              <label key={u.id} className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} className="rounded border-slate-300" />
                <span className="text-slate-700">{u.name}</span>
                <span className="truncate text-xs text-slate-400">{u.email}</span>
                {u.department && <span className="ml-auto text-xs text-slate-400">{u.department.name}</span>}
              </label>
            ))}
          </div>
        </>
      )}
    </Dialog>
  );
}
