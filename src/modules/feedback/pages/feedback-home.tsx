import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, MessageSquareHeart, PlusCircle, Shield, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Badge, Button, Card, Spinner } from '@/components/ui/primitives';

interface Given {
  id: string;
  recipient: { id: string; name: string; designation?: string | null };
  isAnonymous: boolean;
  comment?: string | null;
  periodMonth: string;
  createdAt: string;
  average: number;
}

export default function FeedbackHome() {
  const { can } = useAuth();
  const [given, setGiven] = useState<Given[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (can('feedback.submit')) api.get('/feedback/mine').then((r) => setGiven(r.data.data)).finally(() => setLoading(false));
    else setLoading(false);
  }, [can]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-500 text-white">
          <MessageSquareHeart className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Feedback</h1>
          <p className="text-sm text-slate-500">Recognise your colleagues and help them grow.</p>
        </div>
        <div className="ml-auto flex gap-2">
          {can('feedback.view') && <Link to="/feedback/reports"><Button variant="outline" size="sm"><BarChart3 className="h-4 w-4" /> Reports</Button></Link>}
          {can('feedback.manage') && <Link to="/feedback/manage"><Button variant="outline" size="sm"><Shield className="h-4 w-4" /> Manage</Button></Link>}
        </div>
      </div>

      {can('feedback.submit') && (
        <Card className="mb-6 flex flex-col items-start gap-4 bg-gradient-to-br from-amber-50 to-orange-50 p-6 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">Give feedback</h2>
            <p className="mt-1 text-sm text-slate-600">Rate a colleague across the competencies. You can give feedback to each person once a month, anonymously if you prefer.</p>
          </div>
          <Link to="/feedback/give"><Button size="lg"><PlusCircle className="h-4 w-4" /> New feedback</Button></Link>
        </Card>
      )}

      {can('feedback.submit') && (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Feedback you've given</h2>
          {loading ? (
            <div className="py-10 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>
          ) : given.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-400">You haven't given any feedback yet.</Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {given.map((g) => (
                <Card key={g.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-slate-900">{g.recipient.name}</div>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {g.average}</span>
                  </div>
                  {g.recipient.designation && <div className="text-xs text-slate-400">{g.recipient.designation}</div>}
                  {g.comment && <p className="mt-2 text-sm text-slate-600">"{g.comment}"</p>}
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    <span>{g.periodMonth}</span>
                    {g.isAnonymous && <Badge tone="slate">anonymous</Badge>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
