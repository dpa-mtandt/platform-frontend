import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Clock, FileText, X } from 'lucide-react';
import { api } from '@/lib/api';
import { apiErrorMessage } from '@/lib/utils';
import { Badge, Button, Card, Spinner, Textarea } from '@/components/ui/primitives';
import { formatBytes, type DownloadRequestStatus } from '../../lib/media-types';

interface AdminReq {
  id: string;
  status: DownloadRequestStatus;
  reason: string | null;
  decisionNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  expiresAt: string | null;
  requester: { id: string; name: string; email: string };
  reviewedBy: { id: string; name: string } | null;
  document: { id: string; title: string; originalName: string; sizeBytes: number; lessonTitle: string; courseTitle: string; courseSlug: string };
}

const TABS: { key: 'PENDING' | 'APPROVED' | 'DENIED' | 'ALL'; label: string }[] = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'DENIED', label: 'Denied' },
  { key: 'ALL', label: 'All' },
];

const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

export default function DownloadRequests() {
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'DENIED' | 'ALL'>('PENDING');
  const [rows, setRows] = useState<AdminReq[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get('/media/requests', { params: filter === 'ALL' ? {} : { status: filter } });
    setRows(res.data.data.data);
    setPendingCount(res.data.data.pendingCount);
    setLoading(false);
  }, [filter]);
  useEffect(() => { void load(); }, [load]);

  return (
    <div>
      <Link to="/lms/manage/courses" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" /> Manage LMS</Link>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-slate-900">Document download requests</h1>
      <p className="mb-5 text-sm text-slate-500">Approve or deny learner requests to download protected documents. Approval grants a 7-day download window. Videos are never downloadable.</p>

      <div className="mb-4 flex flex-wrap rounded-lg border border-slate-200 bg-white p-0.5 text-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 ${filter === t.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {t.label}
            {t.key === 'PENDING' && pendingCount > 0 && (
              <span className={`rounded-full px-1.5 text-xs ${filter === t.key ? 'bg-white/20' : 'bg-amber-100 text-amber-700'}`}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-slate-400">No {filter === 'ALL' ? '' : filter.toLowerCase()} requests.</Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => <RequestCard key={r.id} req={r} onDecided={load} />)}
        </div>
      )}
    </div>
  );
}

function statusTone(s: DownloadRequestStatus): 'amber' | 'green' | 'red' {
  return s === 'PENDING' ? 'amber' : s === 'APPROVED' ? 'green' : 'red';
}

function RequestCard({ req, onDecided }: { req: AdminReq; onDecided: () => void }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function decide(status: 'APPROVED' | 'DENIED') {
    setBusy(true);
    setError('');
    try {
      await api.patch(`/media/requests/${req.id}`, { status, decisionNote: note.trim() || null });
      onDecided();
    } catch (err) {
      setError(apiErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start gap-3">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">{req.document.title}</span>
            <Badge tone={statusTone(req.status)}>{req.status.toLowerCase()}</Badge>
            {req.document.sizeBytes > 0 && <span className="text-xs text-slate-400">{formatBytes(req.document.sizeBytes)}</span>}
          </div>
          <div className="text-xs text-slate-500">{req.document.courseTitle} · {req.document.lessonTitle}</div>
          <div className="mt-1 text-sm text-slate-600">
            Requested by <span className="font-medium text-slate-800">{req.requester.name}</span> <span className="text-slate-400">({req.requester.email})</span> · {fmtDate(req.createdAt)}
          </div>
          {req.reason && <p className="mt-1 rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-600">“{req.reason}”</p>}

          {req.status === 'PENDING' ? (
            <div className="mt-3 space-y-2">
              <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note to the requester…" />
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" loading={busy} onClick={() => decide('APPROVED')}><Check className="h-4 w-4" /> Approve</Button>
                <Button size="sm" variant="outline" loading={busy} onClick={() => decide('DENIED')}><X className="h-4 w-4" /> Deny</Button>
                <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Clock className="h-3 w-3" /> Approval grants a 7-day download window</span>
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
          ) : (
            <div className="mt-2 text-xs text-slate-500">
              {req.status === 'APPROVED' ? 'Approved' : 'Denied'} by {req.reviewedBy?.name ?? '—'} · {fmtDate(req.reviewedAt)}
              {req.status === 'APPROVED' && req.expiresAt && <> · expires {fmtDate(req.expiresAt)}</>}
              {req.decisionNote && <div className="mt-1 text-slate-600">Note: {req.decisionNote}</div>}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
