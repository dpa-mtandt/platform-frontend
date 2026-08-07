import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileBarChart, FileSpreadsheet, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Button, Card, Spinner } from '@/components/ui/primitives';

interface ReportType { type: string; title: string; description: string; group: string }
interface Column { key: string; label: string; align?: 'left' | 'right' | 'center' }
interface ReportData {
  type: string;
  title: string;
  description: string;
  generatedAt: string;
  columns: Column[];
  rows: Record<string, string | number | null>[];
  summary?: { label: string; value: string | number }[];
}

export default function ReportsPage() {
  const { can } = useAuth();
  const canExport = can('reports.export');
  const [types, setTypes] = useState<ReportType[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'xlsx' | 'pdf' | null>(null);

  useEffect(() => {
    api.get('/reports/types').then((r) => {
      setTypes(r.data.data);
      if (r.data.data.length) setSelected(r.data.data[0].type);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api.get(`/reports/${selected}`).then((r) => setReport(r.data.data)).finally(() => setLoading(false));
  }, [selected]);

  const grouped = useMemo(() => {
    const g: Record<string, ReportType[]> = {};
    for (const t of types) (g[t.group] ??= []).push(t);
    return g;
  }, [types]);

  const download = useCallback(
    async (format: 'xlsx' | 'pdf') => {
      if (!selected) return;
      setExporting(format);
      try {
        const res = await api.get(`/reports/${selected}/export?format=${format}`, { responseType: 'blob' });
        const url = URL.createObjectURL(res.data as Blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selected}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } finally {
        setExporting(null);
      }
    },
    [selected],
  );

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-600 text-white">
          <FileBarChart className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500">Generate and export reports across the platform.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Report picker */}
        <aside className="space-y-4">
          {Object.entries(grouped).map(([group, list]) => (
            <div key={group}>
              <div className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group}</div>
              <div className="space-y-0.5">
                {list.map((t) => (
                  <button
                    key={t.type}
                    onClick={() => setSelected(t.type)}
                    className={cn('block w-full rounded-lg px-3 py-2 text-left text-sm', selected === t.type ? 'bg-violet-50 font-medium text-violet-700' : 'text-slate-600 hover:bg-slate-50')}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Report content */}
        <div className="min-w-0">
          {loading || !report ? (
            <div className="py-16 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{report.title}</h2>
                  <p className="text-sm text-slate-500">{report.description}</p>
                </div>
                {canExport && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" loading={exporting === 'xlsx'} onClick={() => download('xlsx')}><FileSpreadsheet className="h-4 w-4" /> Excel</Button>
                    <Button variant="outline" size="sm" loading={exporting === 'pdf'} onClick={() => download('pdf')}><FileText className="h-4 w-4" /> PDF</Button>
                  </div>
                )}
              </div>

              {report.summary && report.summary.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-3">
                  {report.summary.map((s) => (
                    <div key={s.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <div className="text-lg font-bold text-slate-900">{s.value}</div>
                      <div className="text-xs text-slate-400">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      <tr>
                        {report.columns.map((c) => (
                          <th key={c.key} className={cn('px-4 py-3', c.align === 'right' && 'text-right')}>{c.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.rows.length === 0 ? (
                        <tr><td colSpan={report.columns.length} className="py-12 text-center text-slate-400">No data for this report yet.</td></tr>
                      ) : (
                        report.rows.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            {report.columns.map((c) => (
                              <td key={c.key} className={cn('px-4 py-2.5 text-slate-700', c.align === 'right' && 'text-right tabular-nums')}>
                                {r[c.key] ?? '—'}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
              <p className="mt-2 text-right text-xs text-slate-300">Generated {new Date(report.generatedAt).toLocaleString()}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
