import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, KeyRound, Pencil, Plus, Search, Trash2, Upload, UserCog } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { apiErrorMessage, formatDate } from '@/lib/utils';
import type { AdminUser, Pagination } from '@/lib/types';
import { Badge, Button, Card, Input, Label, Select, Spinner } from '@/components/ui/primitives';
import { Dialog } from '@/components/ui/dialog';

interface ImportRowResult {
  row: number;
  name: string;
  email: string;
  status: 'created' | 'error';
  message?: string;
  password?: string;
}
interface ImportSummary {
  total: number;
  created: number;
  failed: number;
  results: ImportRowResult[];
}

interface MetaRole {
  id: string;
  key: string;
  name: string;
  isSuperAdmin: boolean;
}
interface MetaDept {
  id: string;
  name: string;
}
interface MetaCompany {
  id: string;
  name: string;
}

export default function AdminUsers() {
  const { can, profile } = useAuth();
  const canManage = can('platform.users.manage');

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const [roles, setRoles] = useState<MetaRole[]>([]);
  const [departments, setDepartments] = useState<MetaDept[]>([]);
  const [companies, setCompanies] = useState<MetaCompany[]>([]);

  const [editing, setEditing] = useState<AdminUser | 'new' | null>(null);
  const [resetting, setResetting] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (roleFilter) params.set('role', roleFilter);
      params.set('page', String(page));
      params.set('limit', '20');
      const res = await api.get(`/users?${params.toString()}`);
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => {
    void (async () => {
      const [r, d, c] = await Promise.all([api.get('/meta/roles'), api.get('/meta/departments'), api.get('/meta/companies')]);
      setRoles(r.data.data);
      setDepartments(d.data.data);
      setCompanies(c.data.data);
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-auto">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search name, email, employee ID…"
            className="w-full pl-8 sm:w-64"
          />
        </div>
        <Select
          value={roleFilter}
          onChange={(e) => {
            setPage(1);
            setRoleFilter(e.target.value);
          }}
          className="w-full sm:w-48"
        >
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.key}>
              {r.name}
            </option>
          ))}
        </Select>
        <div className="ml-auto flex items-center gap-2">
          {canManage && (
            <>
              <Button variant="outline" onClick={() => setImporting(true)}>
                <FileSpreadsheet className="h-4 w-4" /> Import
              </Button>
              <Button onClick={() => setEditing('new')}>
                <Plus className="h-4 w-4" /> New user
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Last login</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Spinner className="mx-auto h-6 w-6 text-slate-300" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(u.userRoles ?? []).map((ur) => (
                          <Badge key={ur.role.id} tone={ur.role.isSuperAdmin ? 'violet' : 'slate'}>
                            {ur.role.name}
                          </Badge>
                        ))}
                        {(u.userRoles ?? []).length === 0 && <span className="text-xs text-slate-400">No roles</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={u.status === 'ACTIVE' ? 'green' : u.status === 'SUSPENDED' ? 'red' : 'amber'}>{u.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {u.department?.name ?? '—'}
                      {u.company?.name && <div className="text-xs text-slate-400">{u.company.name}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(u.lastLoginAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {canManage && (
                          <>
                            <Button size="icon" variant="ghost" title="Edit" onClick={() => setEditing(u)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" title="Reset password" onClick={() => setResetting(u)}>
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Delete"
                              className="text-red-500 hover:bg-red-50"
                              onClick={() => setDeleting(u)}
                              disabled={u.id === profile?.user.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-sm">
            <span className="text-slate-500">
              {pagination.total} users · page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button size="sm" variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {editing && (
        <UserEditor
          user={editing === 'new' ? null : editing}
          roles={roles}
          departments={departments}
          companies={companies}
          canAssignSuperAdmin={!!profile?.isSuperAdmin}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
      {resetting && <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />}
      {deleting && (
        <DeleteUserDialog
          user={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            void load();
          }}
        />
      )}
      {importing && <ImportUsersDialog onClose={() => setImporting(false)} onImported={() => void load()} />}
    </div>
  );
}

// ── Bulk import from Excel ────────────────────────────────────────────────
function ImportUsersDialog({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function downloadTemplate() {
    setDownloading(true);
    setError('');
    try {
      const res = await api.get('/users/import/template', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mtandt-users-import-template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setUploading(true);
    setError('');
    setSummary(null);
    try {
      const res = await api.post('/users/import', file, { headers: { 'Content-Type': file.type || 'application/octet-stream' } });
      setSummary(res.data.data);
      onImported();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Import users from Excel"
      description="Download the template, fill in the Users sheet, then upload it. Existing emails are skipped."
      className="max-w-2xl"
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <Button variant="secondary" size="sm" loading={downloading} onClick={downloadTemplate}>
            <Download className="h-4 w-4" /> Download template
          </Button>
          <span className="text-xs text-slate-500">Fill the <b>Users</b> sheet — the <b>Reference</b> tab lists valid roles, departments &amp; companies. Leave <b>Password</b> blank to auto-generate.</span>
        </div>

        <div className="flex items-center gap-3">
          <input ref={fileRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={onFile} />
          <Button loading={uploading} onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Upload filled file
          </Button>
          {fileName && <span className="truncate text-xs text-slate-500">{fileName}</span>}
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {summary && (
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <Badge tone="green">{summary.created} created</Badge>
              {summary.failed > 0 && <Badge tone="red">{summary.failed} failed</Badge>}
              <span className="text-slate-500">of {summary.total} rows</span>
            </div>
            <div className="max-h-72 overflow-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.results.map((r, i) => (
                    <tr key={i} className={r.status === 'error' ? 'bg-red-50/40' : undefined}>
                      <td className="px-3 py-2 text-slate-400">{r.row}</td>
                      <td className="px-3 py-2 text-slate-700">{r.email || r.name || '—'}</td>
                      <td className="px-3 py-2">
                        {r.status === 'created' ? (
                          <span className="text-emerald-700">
                            Created{r.password && <> · temp password <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">{r.password}</code></>}
                          </span>
                        ) : (
                          <span className="text-red-600">{r.message}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {summary.results.some((r) => r.password) && (
              <p className="mt-2 text-xs text-amber-600">⚠ Copy the auto-generated temporary passwords now — they aren’t stored and won’t be shown again.</p>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}

// ── User create/edit dialog ───────────────────────────────────────────────
function UserEditor({
  user,
  roles,
  departments,
  companies,
  canAssignSuperAdmin,
  onClose,
  onSaved,
}: {
  user: AdminUser | null;
  roles: MetaRole[];
  departments: MetaDept[];
  companies: MetaCompany[];
  canAssignSuperAdmin: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !user;
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState(user?.employeeId ?? '');
  const [designation, setDesignation] = useState(user?.designation ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [status, setStatus] = useState(user?.status ?? 'ACTIVE');
  const [departmentId, setDepartmentId] = useState(user?.departmentId ?? '');
  const [companyId, setCompanyId] = useState(user?.companyId ?? '');
  const [roleIds, setRoleIds] = useState<string[]>((user?.userRoles ?? []).map((ur) => ur.role.id));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function toggleRole(id: string) {
    setRoleIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const base = {
        name,
        employeeId: employeeId || null,
        designation: designation || null,
        phone: phone || null,
        status,
        departmentId: departmentId || null,
        companyId: companyId || null,
        roleIds,
      };
      if (isNew) {
        await api.post('/users', { ...base, email, password });
      } else {
        await api.patch(`/users/${user!.id}`, base);
      }
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <UserCog className="h-5 w-5" /> {isNew ? 'New user' : `Edit ${user!.name}`}
        </span>
      }
      description="Assign roles to control which modules and actions this user can access."
      className="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button form="user-form" type="submit" loading={saving}>
            {isNew ? 'Create user' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isNew} required />
          </div>
        </div>
        {isNew && (
          <div>
            <Label>Temporary password</Label>
            <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 chars, upper/lower/number" required />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Employee ID</Label>
            <Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <Label>Designation</Label>
            <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as AdminUser['status'])}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </Select>
          </div>
          <div>
            <Label>Company</Label>
            <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              <option value="">— None —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Department</Label>
            <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">— None —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label>Roles (access)</Label>
          <div className="grid max-h-48 gap-1 overflow-y-auto rounded-lg border border-slate-200 p-2 sm:grid-cols-2">
            {roles.map((r) => {
              const disabled = r.isSuperAdmin && !canAssignSuperAdmin;
              return (
                <label
                  key={r.id}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${disabled ? 'opacity-40' : 'hover:bg-slate-50'}`}
                >
                  <input type="checkbox" checked={roleIds.includes(r.id)} onChange={() => toggleRole(r.id)} disabled={disabled} className="rounded border-slate-300" />
                  <span className="text-slate-700">{r.name}</span>
                  {r.isSuperAdmin && <Badge tone="violet">super</Badge>}
                </label>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-slate-400">The modules a user sees on their launcher are derived from the roles you assign here.</p>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>
    </Dialog>
  );
}

// ── Reset password ────────────────────────────────────────────────────────
function ResetPasswordDialog({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post(`/users/${user.id}/reset-password`, { newPassword: pw });
      setDone(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Reset password — ${user.name}`}
      description="The user's active sessions will be revoked."
      footer={
        done ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button form="reset-form" type="submit" loading={saving}>
              Reset password
            </Button>
          </>
        )
      }
    >
      {done ? (
        <p className="text-sm text-emerald-700">Password reset successfully.</p>
      ) : (
        <form id="reset-form" onSubmit={submit} className="space-y-3">
          <div>
            <Label>New password</Label>
            <Input type="text" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Min 8 chars, upper/lower/number" required />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </form>
      )}
    </Dialog>
  );
}

// ── Delete ────────────────────────────────────────────────────────────────
function DeleteUserDialog({ user, onClose, onDeleted }: { user: AdminUser; onClose: () => void; onDeleted: () => void }) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function confirm() {
    setSaving(true);
    setError('');
    try {
      await api.delete(`/users/${user.id}`);
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
      title={`Delete ${user.name}?`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" loading={saving} onClick={confirm}>
            Delete user
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">
        This permanently removes <span className="font-medium">{user.email}</span> and all their access. This cannot be undone.
      </p>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </Dialog>
  );
}
