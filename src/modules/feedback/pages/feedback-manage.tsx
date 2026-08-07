import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Search, Star, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { apiErrorMessage, formatDate } from '@/lib/utils';
import type { Pagination } from '@/lib/types';
import { Badge, Button, Card, Input, Label, Select, Spinner, Textarea } from '@/components/ui/primitives';
import { Dialog } from '@/components/ui/dialog';

interface Row {
  id: string;
  recipient: { id: string; name: string };
  giver: { id: string; name: string } | null;
  isAnonymous: boolean;
  periodMonth: string;
  comment?: string | null;
  average: number;
  createdAt: string;
}

export default function FeedbackManage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      params.set('page', String(page));
      params.set('limit', '20');
      const res = await api.get(`/feedback/manage?${params.toString()}`);
      setRows(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <Link to="/feedback" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" /> Feedback</Link>
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Feedback Management</h1>
      </div>
      <p className="mb-4 text-sm text-slate-500">Review, edit and remove feedback. Anonymous submissions never reveal their author — even here.</p>

      <div className="mb-4 relative w-full sm:w-72">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
        <Input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Search recipient or comment…" className="pl-8" />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Avg</th>
                <th className="px-4 py-3">Comment</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400">No feedback found.</td></tr>
              ) : (
                rows.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">{f.recipient.name}</td>
                    <td className="px-4 py-3">{f.giver ? <span className="text-slate-600">{f.giver.name}</span> : <Badge tone="slate">Anonymous</Badge>}</td>
                    <td className="px-4 py-3 text-slate-500">{f.periodMonth}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-amber-600"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {f.average}</span></td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-600">{f.comment}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" title="Edit" onClick={() => setEditing(f)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" title="Delete" onClick={() => setDeleting(f)}><Trash2 className="h-4 w-4" /></Button>
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
            <span className="text-slate-500">{pagination.total} entries · page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {editing && <EditDialog id={editing.id} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load(); }} />}
      {deleting && (
        <Dialog open onClose={() => setDeleting(null)} title={`Delete feedback for ${deleting.recipient.name}?`}
          footer={<><Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><Button variant="danger" onClick={async () => { await api.delete(`/feedback/manage/${deleting.id}`); setDeleting(null); void load(); }}>Delete</Button></>}>
          <p className="text-sm text-slate-600">This permanently removes the feedback and its ratings.</p>
        </Dialog>
      )}
    </div>
  );
}

interface DetailScore { competencyId: string; competency: string; rating: number }
interface FeedbackDetail { recipient: { name: string }; giver: { name: string } | null; isAnonymous: boolean; periodMonth: string; comment?: string | null; scores: DetailScore[] }

function EditDialog({ id, onClose, onSaved }: { id: string; onClose: () => void; onSaved: () => void }) {
  const [detail, setDetail] = useState<FeedbackDetail | null>(null);
  const [comment, setComment] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/feedback/manage/${id}`).then((r) => {
      const d: FeedbackDetail = r.data.data;
      setDetail(d);
      setComment(d.comment ?? '');
      setScores(Object.fromEntries(d.scores.map((s) => [s.competencyId, s.rating])));
    });
  }, [id]);

  async function save() {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/feedback/manage/${id}`, { comment: comment || null, scores: Object.entries(scores).map(([competencyId, rating]) => ({ competencyId, rating })) });
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title="Edit feedback" description={detail ? `${detail.recipient.name} · ${detail.periodMonth} · from ${detail.isAnonymous ? 'Anonymous' : detail.giver?.name}` : undefined} className="max-w-lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={saving} onClick={save} disabled={!detail}>Save</Button></>}>
      {!detail ? (
        <div className="py-8 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {detail.scores.map((s) => (
              <div key={s.competencyId} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{s.competency}</span>
                <Select value={scores[s.competencyId] ?? s.rating} onChange={(e) => setScores((cur) => ({ ...cur, [s.competencyId]: Number(e.target.value) }))} className="w-20">
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                </Select>
              </div>
            ))}
          </div>
          <div><Label>Comment</Label><Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} /></div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>
      )}
    </Dialog>
  );
}
