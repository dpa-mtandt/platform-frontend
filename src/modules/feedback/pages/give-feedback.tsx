import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Send, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { apiErrorMessage, cn } from '@/lib/utils';
import { Badge, Button, Card, Label, Select, Spinner, Textarea } from '@/components/ui/primitives';

interface Recipient { id: string; name: string; email: string; designation?: string | null; department?: { name: string } | null }
interface Competency { id: string; name: string; description?: string | null }

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} onMouseEnter={() => setHover(n)} className="p-0.5" aria-label={`${n} star`}>
          <Star className={cn('h-6 w-6 transition-colors', (hover || value) >= n ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} />
        </button>
      ))}
    </div>
  );
}

export default function GiveFeedback() {
  const navigate = useNavigate();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);

  const [recipientId, setRecipientId] = useState('');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [r, c] = await Promise.all([
          api.get('/feedback/recipients'), 
          api.get('/feedback/competencies')
        ]);
        
        setRecipients(r.data.data || []);
        setCompetencies(c.data.data || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const allRated = competencies.length > 0 && competencies.every((c) => ratings[c.id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!recipientId) return setError('Choose a colleague');
    if (!allRated) return setError('Please rate every competency');
    setSaving(true);
    setError('');
    try {
      await api.post('/feedback', { 
        recipientId, 
        isAnonymous, 
        comment: comment || null, 
        scores: competencies.map((c) => ({ competencyId: c.id, rating: ratings[c.id]! })) 
      });
      setDone(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="py-16 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>;

  if (done) {
    const name = recipients.find((r) => r.id === recipientId)?.name ?? 'your colleague';
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-500"><CheckCircle2 className="h-8 w-8" /></div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">Feedback submitted</h1>
        <p className="mt-1 text-sm text-slate-500">Thank you for recognising {name}.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Button variant="outline" onClick={() => { setDone(false); setRecipientId(''); setRatings({}); setComment(''); setIsAnonymous(false); }}>Give more</Button>
          <Button onClick={() => navigate('/feedback')}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/feedback" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Feedback
      </Link>
      <h1 className="mb-4 text-2xl font-bold tracking-tight text-slate-900">Give feedback</h1>

      <form onSubmit={submit} className="space-y-5">
        <Card className="p-5">
          <Label required>Colleague</Label>
          <Select value={recipientId} onChange={(e) => setRecipientId(e.target.value)} required>
            <option value="">Select a colleague…</option>
            {recipients.map((r) => (
              <option key={r.id} value={r.id}>{r.name}{r.designation ? ` — ${r.designation}` : ''}</option>
            ))}
          </Select>
        </Card>

        <Card className="p-5">
          <div className="mb-3 text-sm font-semibold text-slate-700">
            Rate each competency <span className="ml-1 text-red-500 text-base font-bold" aria-hidden="true">*</span>
          </div>
          <div className="space-y-3">
            {competencies.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                <div>
                  <div className="font-medium text-slate-800">{c.name}</div>
                  {c.description && <div className="text-xs text-slate-400">{c.description}</div>}
                </div>
                <StarRating value={ratings[c.id] ?? 0} onChange={(v) => setRatings((cur) => ({ ...cur, [c.id]: v }))} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <Label>Comment (optional)</Label>
          <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What does this person do well? Any suggestions?" />
          <label className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="rounded border-slate-300" />
            Submit anonymously
            <Badge tone="slate">your name is hidden from everyone, including managers</Badge>
          </label>
        </Card>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={saving} disabled={!recipientId || !allRated}><Send className="h-4 w-4" /> Submit feedback</Button>
        </div>
      </form>
    </div>
  );
}
