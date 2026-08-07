import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Eye, EyeOff, FolderTree, Pencil, Plus, Trash2, UserMinus, UserPlus } from 'lucide-react';
import { api } from '@/lib/api';
import { apiErrorMessage, formatDate } from '@/lib/utils';
import { Badge, Button, Card, Input, Label, Select, Spinner } from '@/components/ui/primitives';
import { Dialog } from '@/components/ui/dialog';
import { CategoriesDialog } from './categories-dialog';

interface Person {
  id: string;
  name: string;
  email: string;
}

interface Assignment {
  userId: string;
  user: { id: string; name: string; email: string; department: { name: string } | null };
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
  progressPercent: number;
  dueDate: string | null;
  completedAt: string | null;
  lastAccessedAt: string | null;
  overdue: boolean;
}

interface CourseRow {
  id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  difficulty: string;
  category?: { name: string } | null;
  sectionCount: number;
  enrollmentCount: number;
  overdueCount: number;
}

const statusTone = { PUBLISHED: 'green', DRAFT: 'amber', ARCHIVED: 'slate' } as const;

export default function ManageCourses() {
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<CourseRow | null>(null);
  const [assigning, setAssigning] = useState<CourseRow | null>(null);
  const [viewingAssignments, setViewingAssignments] = useState<CourseRow | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/lms/courses?limit=50');
      setRows(res.data.data);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function togglePublish(c: CourseRow) {
    setError('');
    try {
      await api.patch(`/lms/courses/${c.id}`, { status: c.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' });
      void load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manage Courses</h1>
          <p className="text-sm text-slate-500">Create and edit training content.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCategories(true)}>
            <FolderTree className="h-4 w-4" /> Categories
          </Button>
          <Link to="/lms/manage/courses/new">
            <Button>
              <Plus className="h-4 w-4" /> New course
            </Button>
          </Link>
        </div>
      </div>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Sections</th>
                <th className="px-4 py-3">Enrolled</th>
                <th className="px-4 py-3">Overdue</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">No courses yet. Create your first one.</td></tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{c.title}</div>
                      <div className="text-xs capitalize text-slate-400">{c.difficulty.toLowerCase()}</div>
                    </td>
                    <td className="px-4 py-3"><Badge tone={statusTone[c.status]}>{c.status}</Badge></td>
                    <td className="px-4 py-3 text-slate-600">{c.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{c.sectionCount}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setViewingAssignments(c)}
                        className="rounded-md px-2 py-0.5 font-medium text-blue-600 hover:bg-blue-50"
                        title="View assigned users"
                      >
                        {c.enrollmentCount}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {c.overdueCount > 0 ? (
                        <button onClick={() => setViewingAssignments(c)} title="View overdue assignees">
                          <Badge tone="red"><AlertTriangle className="h-3 w-3" /> {c.overdueCount}</Badge>
                        </button>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" title={c.status === 'PUBLISHED' ? 'Assign to users' : 'Publish the course first to assign it'} disabled={c.status !== 'PUBLISHED'} onClick={() => setAssigning(c)}>
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title={c.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'} onClick={() => togglePublish(c)}>
                          {c.status === 'PUBLISHED' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Link to={`/lms/manage/courses/${c.slug}/edit`}>
                          <Button size="icon" variant="ghost" title="Edit"><Pencil className="h-4 w-4" /></Button>
                        </Link>
                        <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" title="Delete" onClick={() => setDeleting(c)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {deleting && (
        <Dialog
          open
          onClose={() => setDeleting(null)}
          title={`Delete "${deleting.title}"?`}
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="danger" onClick={async () => { await api.delete(`/lms/courses/${deleting.id}`); setDeleting(null); void load(); }}>Delete course</Button>
            </>
          }
        >
          <p className="text-sm text-slate-600">This permanently deletes the course and all its sections, lessons and enrollments.</p>
        </Dialog>
      )}

      {assigning && (
        <AssignDialog
          course={assigning}
          onClose={() => setAssigning(null)}
          onDone={(n) => {
            const title = assigning.title;
            setAssigning(null);
            setNotice(`Assigned "${title}" to ${n} user${n === 1 ? '' : 's'}. They'll now see it and were notified.`);
            void load();
          }}
        />
      )}

      {viewingAssignments && (
        <AssignmentsDialog course={viewingAssignments} onClose={() => setViewingAssignments(null)} onChanged={() => void load()} />
      )}

      {showCategories && <CategoriesDialog onClose={() => setShowCategories(false)} onChanged={() => void load()} />}
    </div>
  );
}

// ── Assign a course to users / a department ──────────────────────
function AssignDialog({ course, onClose, onDone }: { course: CourseRow; onClose: () => void; onDone: (assigned: number) => void }) {
  const [users, setUsers] = useState<Person[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [departmentId, setDepartmentId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignAll, setAssignAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      const [u, d] = await Promise.all([api.get('/meta/managers'), api.get('/meta/departments')]);
      setUsers(u.data.data);
      setDepartments(d.data.data);
      setLoading(false);
    })();
  }, []);

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });
  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function submit() {
    if (!assignAll && selected.size === 0 && !departmentId) {
      setError('Pick at least one user, a department, or choose "everyone".');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body: { userIds?: string[]; departmentId?: string; all?: boolean; dueDate?: string } = {};
      if (assignAll) {
        body.all = true;
      } else {
        if (selected.size) body.userIds = [...selected];
        if (departmentId) body.departmentId = departmentId;
      }
      if (dueDate) body.dueDate = new Date(`${dueDate}T23:59:59`).toISOString();
      const res = await api.post(`/lms/courses/${course.id}/assign`, body);
      onDone(res.data.data.assigned);
    } catch (err) {
      setError(apiErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Assign "${course.title}"`}
      description="Assigned users see this course in their catalog and get a notification. Only assigned users can open it."
      className="max-w-lg"
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={saving} onClick={submit}><UserPlus className="h-4 w-4" /> {assignAll ? 'Assign to everyone' : `Assign${selected.size ? ` (${selected.size})` : ''}`}</Button>
      </>}
    >
      {loading ? (
        <div className="py-8 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>
      ) : (
        <div className="space-y-4">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <input type="checkbox" checked={assignAll} onChange={(e) => setAssignAll(e.target.checked)} className="rounded border-slate-300" />
            <span className="font-medium text-slate-700">Assign to everyone</span>
            <span className="text-xs text-slate-400">all active users with LMS access</span>
          </label>

          <div className={assignAll ? 'pointer-events-none space-y-4 opacity-40' : 'space-y-4'}>
            <div>
              <Label>Users</Label>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email…" disabled={assignAll} />
              <div className="mt-2 max-h-48 space-y-0.5 overflow-y-auto rounded-lg border border-slate-200 p-1">
                {filtered.length === 0 ? (
                  <p className="px-2 py-3 text-center text-xs text-slate-400">No users found.</p>
                ) : (
                  filtered.map((u) => (
                    <label key={u.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                      <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)} className="rounded border-slate-300" />
                      <span className="text-slate-700">{u.name}</span>
                      <span className="ml-auto text-xs text-slate-400">{u.email}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div>
              <Label>…or a whole department</Label>
              <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">— None —</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </div>
          </div>

          <div className="max-w-[12rem]">
            <Label>Due date (optional)</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>
      )}
    </Dialog>
  );
}

// ── View / manage assigned users (status, progress, overdue, unassign) ──
function AssignmentsDialog({ course, onClose, onChanged }: { course: CourseRow; onClose: () => void; onChanged: () => void }) {
  const [rows, setRows] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [editingDue, setEditingDue] = useState<string | null>(null);
  const [dueValue, setDueValue] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/lms/courses/${course.id}/assignments`);
      setRows(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [course.id]);
  useEffect(() => { void load(); }, [load]);

  async function saveDue(userId: string) {
    setBusyId(userId);
    setError('');
    try {
      await api.patch(`/lms/courses/${course.id}/assignments/${userId}`, {
        dueDate: dueValue ? new Date(`${dueValue}T23:59:59`).toISOString() : null,
      });
      setEditingDue(null);
      await load();
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function unassign(userId: string) {
    setBusyId(userId);
    setError('');
    try {
      await api.delete(`/lms/courses/${course.id}/assignments/${userId}`);
      await load();
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const tone = (s: Assignment['status']) => (s === 'COMPLETED' ? 'green' : s === 'IN_PROGRESS' ? 'blue' : 'amber');
  const overdueCount = rows.filter((r) => r.overdue).length;

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Assigned users — ${course.title}`}
      description={loading ? undefined : `${rows.length} assigned · ${rows.filter((r) => r.status === 'COMPLETED').length} completed${overdueCount ? ` · ${overdueCount} overdue` : ''}`}
      className="max-w-3xl"
    >
      {loading ? (
        <div className="py-8 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No one is assigned yet. Close this and use “Assign” to add users.</p>
      ) : (
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-2 py-2">User</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Progress</th>
                <th className="px-2 py-2">Due</th>
                <th className="px-2 py-2">Last active</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.userId} className="hover:bg-slate-50/50">
                  <td className="px-2 py-2">
                    <div className="font-medium text-slate-800">{r.user.name}</div>
                    <div className="text-xs text-slate-400">{r.user.email}{r.user.department ? ` · ${r.user.department.name}` : ''}</div>
                  </td>
                  <td className="px-2 py-2"><Badge tone={tone(r.status)}>{r.status.replace('_', ' ').toLowerCase()}</Badge></td>
                  <td className="px-2 py-2 text-slate-600">{Math.round(r.progressPercent)}%</td>
                  <td className="px-2 py-2">
                    {editingDue === r.userId ? (
                      <div className="flex items-center gap-1">
                        <input type="date" value={dueValue} onChange={(e) => setDueValue(e.target.value)} className="rounded border border-slate-300 px-1.5 py-0.5 text-xs" />
                        <Button size="sm" loading={busyId === r.userId} onClick={() => saveDue(r.userId)}>Save</Button>
                        <button onClick={() => setEditingDue(null)} className="text-xs text-slate-400 hover:text-slate-700">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        {r.dueDate ? (
                          <span className={r.overdue ? 'inline-flex items-center gap-1 font-medium text-red-600' : 'text-slate-600'}>
                            {r.overdue && <AlertTriangle className="h-3.5 w-3.5" />}{formatDate(r.dueDate)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                        <button title="Edit due date" onClick={() => { setEditingDue(r.userId); setDueValue(r.dueDate ? r.dueDate.slice(0, 10) : ''); }} className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2 text-slate-500">{r.lastAccessedAt ? formatDate(r.lastAccessedAt) : '—'}</td>
                  <td className="px-2 py-2 text-right">
                    <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" loading={busyId === r.userId} onClick={() => unassign(r.userId)} title="Unassign">
                      <UserMinus className="h-4 w-4" /> Unassign
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </Dialog>
  );
}
