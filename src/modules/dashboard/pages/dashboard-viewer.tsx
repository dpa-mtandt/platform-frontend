import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Info, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, Button, Spinner } from '@/components/ui/primitives';
import { DashboardIcon } from '../dashboard-icon';

interface Embed {
  mode: 'mock' | 'secure' | 'real';
  embedUrl: string | null;
  secureEmbedUrl: string | null;
  message?: string;
}
interface Meta {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  category?: string | null;
  icon?: string | null;
  color?: string | null;
}

export default function DashboardViewer() {
  const { id } = useParams();
  const [data, setData] = useState<{ dashboard: Meta; embed: Embed } | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'ok' | 'forbidden' | 'notfound'>('ok');

  useEffect(() => {
    setLoading(true);
    setStatus('ok');
    api
      .get(`/dashboard/${id}/embed`)
      .then((r) => setData(r.data.data))
      .catch((err) => setStatus(err?.response?.status === 403 ? 'forbidden' : 'notfound'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="py-16 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>;

  if (status !== 'ok' || !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-500"><ShieldAlert className="h-8 w-8" /></div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">{status === 'forbidden' ? 'Access denied' : 'Dashboard not found'}</h1>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          {status === 'forbidden' ? "You aren't assigned to this dashboard. Contact an administrator to request access." : 'This dashboard does not exist or is inactive.'}
        </p>
        <Link to="/dashboard" className="mt-5"><Button variant="outline">Back to dashboards</Button></Link>
      </div>
    );
  }

  const { dashboard: d, embed } = data;
  const iframeSrc = embed.secureEmbedUrl || (embed.mode === 'real' ? embed.embedUrl : null);

  return (
    <div>
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Dashboards
      </Link>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ backgroundColor: d.color || '#64748b' }}>
          <DashboardIcon name={d.icon} className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{d.name}</h1>
          {d.description && <p className="text-sm text-slate-500">{d.description}</p>}
        </div>
        <Badge tone={embed.mode === 'mock' ? 'amber' : 'green'} className="ml-auto">{embed.mode === 'mock' ? 'Sample data' : embed.mode === 'secure' ? 'Live (secure)' : 'Live'}</Badge>
      </div>

      {iframeSrc ? (
        <iframe title={d.name} src={iframeSrc} className="h-[75vh] w-full rounded-2xl border border-slate-200 bg-white shadow-sm" allowFullScreen />
      ) : (
        <>
          {embed.mode === 'mock' && (
            <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 ring-1 ring-amber-200">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Showing sample data. An administrator can connect a live Power BI report (a "Website or portal" embed URL, or a service principal).</span>
            </div>
          )}
          <MockDashboard name={d.name} color={d.color || '#2563eb'} seedKey={d.key} />
        </>
      )}
    </div>
  );
}

// ── A realistic BI placeholder rendered from deterministic pseudo-data ────────
function seededRng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CATS = ['North', 'South', 'East', 'West', 'Central'];

function MockDashboard({ name, color, seedKey }: { name: string; color: string; seedKey: string }) {
  const { kpis, bars, cats } = useMemo(() => {
    const rand = seededRng(seedKey);
    const kpis = [
      { label: 'Total', value: Math.round(1200 + rand() * 8000) },
      { label: 'This month', value: Math.round(80 + rand() * 900) },
      { label: 'Active', value: Math.round(20 + rand() * 400) },
      { label: 'Growth', value: `${(rand() * 30 - 5).toFixed(1)}%` },
    ];
    const bars = MONTHS.map((m) => ({ m, v: Math.round(20 + rand() * 100) }));
    const cats = CATS.map((c) => ({ c, v: Math.round(10 + rand() * 100) })).sort((a, b) => b.v - a.v);
    return { kpis, bars, cats };
  }, [seedKey]);
  const maxBar = Math.max(...bars.map((b) => b.v));
  const maxCat = Math.max(...cats.map((c) => c.v));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">{k.label}</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{typeof k.value === 'number' ? k.value.toLocaleString() : k.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-2 text-sm font-semibold text-slate-700">Monthly trend</div>
          <div className="flex h-52 items-end gap-1.5 rounded-xl border border-slate-100 p-3">
            {bars.map((b) => (
              <div key={b.m} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t" style={{ height: `${(b.v / maxBar) * 100}%`, backgroundColor: color, opacity: 0.85 }} title={`${b.m}: ${b.v}`} />
                <span className="text-[10px] text-slate-400">{b.m}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-sm font-semibold text-slate-700">By region</div>
          <div className="space-y-2 rounded-xl border border-slate-100 p-3">
            {cats.map((c) => (
              <div key={c.c}>
                <div className="flex justify-between text-xs text-slate-500"><span>{c.c}</span><span>{c.v}</span></div>
                <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${(c.v / maxCat) * 100}%`, backgroundColor: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-slate-300">{name} · sample visualisation</p>
    </div>
  );
}
