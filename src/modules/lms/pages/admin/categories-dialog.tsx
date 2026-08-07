import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { apiErrorMessage } from '@/lib/utils';
import { Badge, Button, Input, Spinner } from '@/components/ui/primitives';
import { Dialog } from '@/components/ui/dialog';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface Category { id: string; name: string; slug: string; description: string | null; courseCount: number }

/** Full CRUD for course categories (used to group courses in the catalog). */
export function CategoriesDialog({ onClose, onChanged }: { onClose: () => void; onChanged?: () => void }) {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const { confirm, confirmNode } = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows((await api.get('/lms/categories')).data.data);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  function changed() { void load(); onChanged?.(); }

  async function add() {
    const n = name.trim();
    if (n.length < 2) return setError('Name must be at least 2 characters.');
    setBusy(true);
    setError('');
    try {
      await api.post('/lms/categories', { name: n });
      setName('');
      changed();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function rename(id: string) {
    const n = renameValue.trim();
    if (n.length < 2) { setRenamingId(null); return; }
    setError('');
    try {
      await api.patch(`/lms/categories/${id}`, { name: n });
      setRenamingId(null);
      changed();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function remove(id: string) {
    setError('');
    try {
      await api.delete(`/lms/categories/${id}`);
      changed();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <>
      <Dialog
        open
        onClose={onClose}
        title="Course categories"
        description="Group courses in the catalog. Deleting a category leaves its courses uncategorized."
        className="max-w-lg"
      >
        {loading ? (
          <div className="py-8 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>
        ) : (
          <div className="space-y-3">
            {rows.length > 0 ? (
              <ul className="space-y-1.5">
                {rows.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-1.5 text-sm">
                    {renamingId === c.id ? (
                      <>
                        <Input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void rename(c.id); } if (e.key === 'Escape') setRenamingId(null); }}
                          autoFocus
                          className="h-7 min-w-0 flex-1 py-0"
                        />
                        <Button size="sm" onClick={() => rename(c.id)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setRenamingId(null)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{c.name}</span>
                        <Badge tone="slate">{c.courseCount} course{c.courseCount === 1 ? '' : 's'}</Badge>
                        <Button size="icon" variant="ghost" title="Rename" onClick={() => { setRenamingId(c.id); setRenameValue(c.name); }}><Pencil className="h-4 w-4" /></Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-50"
                          title="Delete"
                          onClick={() => confirm({
                            title: `Delete category “${c.name}”?`,
                            message: c.courseCount > 0 ? `${c.courseCount} course${c.courseCount === 1 ? '' : 's'} will become uncategorized (the courses are not deleted).` : 'This category has no courses.',
                            onConfirm: () => remove(c.id),
                          })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-400">No categories yet. Add your first one below.</p>
            )}

            <div className="flex gap-2 border-t border-slate-100 pt-3">
              <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="New category name…" />
              <Button loading={busy} onClick={add}><Plus className="h-4 w-4" /> Add</Button>
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          </div>
        )}
      </Dialog>
      {confirmNode}
    </>
  );
}
