import { useCallback, useEffect, useState } from 'react';
import { Building2, Network, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { apiErrorMessage } from '@/lib/utils';
import { Badge, Button, Card, Input, Label, Select, Spinner, Textarea } from '@/components/ui/primitives';
import { Dialog } from '@/components/ui/dialog';

interface Company {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  userCount: number;
  departmentCount: number;
  branchCount: number;
}
interface Department {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  companyId: string | null;
  company: { id: string; name: string } | null;
  managerId: string | null;
  manager: { id: string; name: string; email: string } | null;
  userCount: number;
}
interface Person {
  id: string;
  name: string;
  email: string;
}

export default function AdminOrg() {
  const { can } = useAuth();
  const canManage = can('platform.org.manage');

  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  const [companyDialog, setCompanyDialog] = useState<Company | 'new' | null>(null);
  const [deptDialog, setDeptDialog] = useState<Department | 'new' | null>(null);
  const [remove, setRemove] = useState<{ kind: 'company' | 'department'; row: Company | Department } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, d, m] = await Promise.all([api.get('/org/companies'), api.get('/org/departments'), api.get('/meta/managers')]);
      setCompanies(c.data.data);
      setDepartments(d.data.data);
      setManagers(m.data.data);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <div className="py-16 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>;

  return (
    <div className="space-y-8">
      {/* ── Companies ─────────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Companies</h2>
          {canManage && (
            <Button size="sm" className="ml-auto" onClick={() => setCompanyDialog('new')}>
              <Plus className="h-4 w-4" /> Add company
            </Button>
          )}
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Departments</th>
                  <th className="px-4 py-3">Members</th>
                  {canManage && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.length === 0 ? (
                  <tr><td colSpan={5} className="py-10 text-center text-slate-400">No companies yet. Add your first company.</td></tr>
                ) : (
                  companies.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{c.name}</div>
                        {c.description && <div className="text-xs text-slate-400">{c.description}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{c.code ?? '—'}</td>
                      <td className="px-4 py-3"><Badge tone="slate">{c.departmentCount}</Badge></td>
                      <td className="px-4 py-3"><Badge tone="slate">{c.userCount}</Badge></td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" title="Edit" onClick={() => setCompanyDialog(c)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" title="Delete" className="text-red-500 hover:bg-red-50" onClick={() => setRemove({ kind: 'company', row: c })}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* ── Departments ───────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Network className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Departments</h2>
          {canManage && (
            <Button size="sm" className="ml-auto" onClick={() => setDeptDialog('new')}>
              <Plus className="h-4 w-4" /> Add department
            </Button>
          )}
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Manager</th>
                  <th className="px-4 py-3">Members</th>
                  {canManage && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-slate-400">No departments yet. Add your first department.</td></tr>
                ) : (
                  departments.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{d.name}</div>
                        {d.description && <div className="text-xs text-slate-400">{d.description}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{d.code ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{d.company?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{d.manager?.name ?? '—'}</td>
                      <td className="px-4 py-3"><Badge tone="slate">{d.userCount}</Badge></td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" title="Edit" onClick={() => setDeptDialog(d)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" title="Delete" className="text-red-500 hover:bg-red-50" onClick={() => setRemove({ kind: 'department', row: d })}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {companyDialog && (
        <CompanyDialog company={companyDialog === 'new' ? null : companyDialog} onClose={() => setCompanyDialog(null)} onSaved={() => { setCompanyDialog(null); void load(); }} />
      )}
      {deptDialog && (
        <DepartmentDialog department={deptDialog === 'new' ? null : deptDialog} companies={companies} managers={managers} onClose={() => setDeptDialog(null)} onSaved={() => { setDeptDialog(null); void load(); }} />
      )}
      {remove && (
        <DeleteDialog target={remove} onClose={() => setRemove(null)} onDeleted={() => { setRemove(null); void load(); }} />
      )}
    </div>
  );
}

// ── Company create/edit ──────────────────────────────────────────
function CompanyDialog({ company, onClose, onSaved }: { company: Company | null; onClose: () => void; onSaved: () => void }) {
  const isNew = !company;
  const [name, setName] = useState(company?.name ?? '');
  const [code, setCode] = useState(company?.code ?? '');
  const [description, setDescription] = useState(company?.description ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = { name, code: code || null, description: description || null };
      if (isNew) await api.post('/org/companies', body);
      else await api.patch(`/org/companies/${company!.id}`, body);
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
      title={isNew ? 'Add company' : `Edit ${company!.name}`}
      className="max-w-md"
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button form="company-form" type="submit" loading={saving}>{isNew ? 'Create company' : 'Save'}</Button>
      </>}
    >
      <form id="company-form" onSubmit={submit} className="space-y-4">
        <div>
          <Label>Company name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder="e.g. MTANDT Pvt Ltd" />
        </div>
        <div>
          <Label>Code</Label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Optional short code, e.g. MT" />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>
    </Dialog>
  );
}

// ── Department create/edit ───────────────────────────────────────
function DepartmentDialog({
  department,
  companies,
  managers,
  onClose,
  onSaved,
}: {
  department: Department | null;
  companies: Company[];
  managers: Person[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !department;
  const [name, setName] = useState(department?.name ?? '');
  const [code, setCode] = useState(department?.code ?? '');
  const [description, setDescription] = useState(department?.description ?? '');
  const [companyId, setCompanyId] = useState(department?.companyId ?? '');
  const [managerId, setManagerId] = useState(department?.managerId ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = { name, code: code || null, description: description || null, companyId: companyId || null, managerId: managerId || null };
      if (isNew) await api.post('/org/departments', body);
      else await api.patch(`/org/departments/${department!.id}`, body);
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
      title={isNew ? 'Add department' : `Edit ${department!.name}`}
      className="max-w-lg"
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button form="dept-form" type="submit" loading={saving}>{isNew ? 'Create department' : 'Save'}</Button>
      </>}
    >
      <form id="dept-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Department name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder="e.g. Sales" />
          </div>
          <div>
            <Label>Code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Company</Label>
            <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              <option value="">— None —</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Manager</Label>
            <Select value={managerId} onChange={(e) => setManagerId(e.target.value)}>
              <option value="">— None —</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>
    </Dialog>
  );
}

// ── Delete confirm ───────────────────────────────────────────────
function DeleteDialog({
  target,
  onClose,
  onDeleted,
}: {
  target: { kind: 'company' | 'department'; row: Company | Department };
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const path = target.kind === 'company' ? '/org/companies' : '/org/departments';

  async function confirm() {
    setSaving(true);
    setError('');
    try {
      await api.delete(`${path}/${target.row.id}`);
      onDeleted();
    } catch (err) {
      setError(apiErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Delete ${target.row.name}?`}
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="danger" loading={saving} onClick={confirm}>Delete {target.kind}</Button>
      </>}
    >
      <p className="text-sm text-slate-600">
        {target.kind === 'company'
          ? 'Members and departments in this company will be detached (not deleted). This cannot be undone.'
          : 'Members of this department will be detached (not deleted). This cannot be undone.'}
      </p>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </Dialog>
  );
}
