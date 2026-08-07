import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, Button, Card, Spinner } from '@/components/ui/primitives';
import { Dialog } from '@/components/ui/dialog';

interface CompAvg { id: string; name: string; average: number | null }
interface Row { recipient: { id: string; name: string; designation?: string | null; department?: { name: string } | null }; responses: number; overall: number | null; belowThreshold: boolean; competencies: CompAvg[] }
interface ReportsData { minN: number; competencies: { id: string; name: string }[]; data: Row[] }

function Bar({ value }: { value: number | null }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-amber-400" style={{ width: `${((value ?? 0) / 5) * 100}%` }} />
      </div>
      <span className="w-7 text-xs text-slate-500">{value ?? '—'}</span>
    </div>
  );
}

export default function FeedbackReports() {
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    api.get('/feedback/reports').then((r) => setReports(r.data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Link to="/feedback" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" /> Feedback</Link>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-slate-900">Feedback Reports</h1>
      <p className="mb-5 text-sm text-slate-500">Aggregated ratings by person. Individual comments appear once someone has at least {reports?.minN ?? 3} responses; givers are never identified.</p>

      {loading ? (
        <div className="py-16 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>
      ) : !reports || reports.data.length === 0 ? (
        <Card className="p-10 text-center text-slate-400">No feedback has been submitted yet.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Person</th>
                  <th className="px-4 py-3">Responses</th>
                  <th className="px-4 py-3">Overall</th>
                  {reports.competencies.map((c) => <th key={c.id} className="px-4 py-3">{c.name}</th>)}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.data.map((r) => (
                  <tr key={r.recipient.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{r.recipient.name}</div>
                      {r.recipient.designation && <div className="text-xs text-slate-400">{r.recipient.designation}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">{r.responses}{r.belowThreshold && <Lock className="h-3 w-3 text-slate-300" />}</span>
                    </td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1 font-semibold text-amber-600"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {r.overall ?? '—'}</span></td>
                    {r.competencies.map((c) => <td key={c.id} className="px-4 py-3"><Bar value={c.average} /></td>)}
                    <td className="px-4 py-3 text-right"><Button size="sm" variant="ghost" onClick={() => setDetailId(r.recipient.id)}>Details</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {detailId && <PersonDetail userId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}

interface Detail {
  recipient: { name: string; designation?: string | null };
  responses: number;
  overall: number | null;
  belowThreshold: boolean;
  thresholdMessage?: string | null;
  competencies: { id: string; name: string; average: number | null; responses: number }[];
  trend: { month: string; average: number }[];
  comments: { comment: string; month: string }[];
}

function PersonDetail({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [d, setD] = useState<Detail | null>(null);
  useEffect(() => {
    api.get(`/feedback/reports/${userId}`).then((r) => setD(r.data.data));
  }, [userId]);

  return (
    <Dialog open onClose={onClose} title={d ? d.recipient.name : 'Loading…'} description={d?.recipient.designation ?? undefined} className="max-w-lg">
      {!d ? (
        <div className="py-8 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-center">
              <div className="text-2xl font-bold text-amber-600">{d.overall ?? '—'}</div>
              <div className="text-xs text-slate-400">overall</div>
            </div>
            <div className="text-sm text-slate-500">{d.responses} response{d.responses === 1 ? '' : 's'}</div>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">By competency</div>
            <div className="space-y-1.5">
              {d.competencies.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  <span className="w-32 text-slate-600">{c.name}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-400" style={{ width: `${((c.average ?? 0) / 5) * 100}%` }} /></div>
                  <span className="w-8 text-right text-xs text-slate-500">{c.average ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Comments</div>
            {d.belowThreshold ? (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">{d.thresholdMessage}</p>
            ) : d.comments.length === 0 ? (
              <p className="text-sm text-slate-400">No written comments.</p>
            ) : (
              <div className="space-y-2">
                {d.comments.map((c, i) => (
                  <div key={i} className="rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-600">
                    "{c.comment}" <span className="ml-1 text-xs text-slate-300">{c.month}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}
