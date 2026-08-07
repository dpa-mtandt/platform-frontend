import { useEffect, useState } from 'react';
import { Plus, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { apiErrorMessage } from '@/lib/utils';
import type { PermissionGroup, Role } from '@/lib/types';
import { Badge, Button, Card, Input, Label, Spinner, Textarea } from '@/components/ui/primitives';
import { Dialog } from '@/components/ui/dialog';

export default function AdminRoles() {
  const { can } = useAuth();
  const canManage = can('platform.roles.manage');
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Role | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/roles');
      setRoles(res.data.data);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">Roles bundle permissions. Assign roles to users to grant module & action access.</p>
        {canManage && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New role
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <Spinner className="mx-auto h-6 w-6 text-slate-300" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {roles.map((r) => (
            <Card key={r.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{r.name}</div>
                    <div className="font-mono text-xs text-slate-400">{r.key}</div>
                  </div>
                </div>
                {r.isSuperAdmin && <Badge tone="violet">super</Badge>}
              </div>
              <p className="mt-2 flex-1 text-sm text-slate-500">{r.description}</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>
                  {r.isSuperAdmin ? 'All permissions' : `${r.permissionCount ?? 0} permissions`} · {r.userCount ?? 0} users
                </span>
                {canManage && !r.isSuperAdmin && (
                  <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>
                    <SlidersHorizontal className="h-3.5 w-3.5" /> Permissions
                  </Button>
                )}
              </div>
              <div className="mt-1">{r.isSystem && <Badge>system</Badge>}</div>
            </Card>
          ))}
        </div>
      )}

      {editing && <RolePermissionsDialog role={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load(); }} />}
      {creating && <CreateRoleDialog onClose={() => setCreating(false)} onSaved={() => { setCreating(false); void load(); }} />}
    </div>
  );
}

function RolePermissionsDialog({ role, onClose, onSaved }: { role: Role; onClose: () => void; onSaved: () => void }) {
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      const [g, detail] = await Promise.all([api.get('/permissions/grouped'), api.get(`/roles/${role.id}`)]);
      setGroups(g.data.data);
      setSelected(new Set((detail.data.data.permissions as { id: string }[]).map((p) => p.id)));
      setLoading(false);
    })();
  }, [role.id]);

  function toggle(id: string) {
    setSelected((cur) => {
      const next = new Set(cur);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleGroup(g: PermissionGroup, on: boolean) {
    setSelected((cur) => {
      const next = new Set(cur);
      g.permissions.forEach((p) => (on ? next.add(p.id) : next.delete(p.id)));
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      await api.put(`/roles/${role.id}/permissions`, { permissionIds: [...selected] });
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Permissions — ${role.name}`}
      description="Tick the capabilities this role grants. Users with the role inherit them immediately."
      className="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={save}>
            Save permissions
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="py-10 text-center">
          <Spinner className="mx-auto h-6 w-6 text-slate-300" />
        </div>
      ) : (
        <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
          {groups.map((g) => {
            const allOn = g.permissions.every((p) => selected.has(p.id));
            return (
              <div key={g.module.key}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{g.module.name}</span>
                  <button className="text-xs text-slate-400 hover:text-slate-700" onClick={() => toggleGroup(g, !allOn)}>
                    {allOn ? 'Clear all' : 'Select all'}
                  </button>
                </div>
                <div className="grid gap-1 rounded-lg border border-slate-100 p-2 sm:grid-cols-2">
                  {g.permissions.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="rounded border-slate-300" />
                      <span className="text-slate-700">{p.name}</span>
                      <span className="ml-auto font-mono text-[10px] text-slate-300">{p.key}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>
      )}
    </Dialog>
  );
}

function CreateRoleDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/roles', { key: key.toUpperCase().replace(/[^A-Z0-9_]/g, '_'), name, description: description || null });
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="New role"
      description="Create a role, then open its permissions to grant capabilities."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button form="role-form" type="submit" loading={saving}>
            Create role
          </Button>
        </>
      }
    >
      <form id="role-form" onSubmit={submit} className="space-y-3">
        <div>
          <Label>Key</Label>
          <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="e.g. PROJECT_MANAGER" required />
          <p className="mt-1 text-xs text-slate-400">UPPER_SNAKE_CASE machine key.</p>
        </div>
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Project Manager" required />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>
    </Dialog>
  );
}
