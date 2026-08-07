import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Pagination } from '@/lib/types';
import { Badge, Button, Card, Input, Select, Spinner } from '@/components/ui/primitives';

interface AuditRow {
  id: string;
  action: string;
  module: string;
  status: 'SUCCESS' | 'FAILURE';
  description?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export default function AdminAudit() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);
      params.set('page', String(page));
      params.set('limit', '25');
      const res = await api.get(`/audit?${params.toString()}`);
      setRows(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-auto">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Search action, user, description…" className="w-full pl-8 sm:w-72" />
        </div>
        <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="w-full sm:w-40">
          <option value="">All outcomes</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILURE">Failure</option>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">No audit entries.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-2.5">
                      <div className="text-slate-800">{r.userName ?? '—'}</div>
                      <div className="text-xs text-slate-400">{r.userEmail}</div>
                    </td>
                    <td className="px-4 py-2.5"><span className="font-mono text-xs text-slate-700">{r.action}</span></td>
                    <td className="px-4 py-2.5 text-slate-600">{r.module}</td>
                    <td className="px-4 py-2.5"><Badge tone={r.status === 'SUCCESS' ? 'green' : 'red'}>{r.status}</Badge></td>
                    <td className="max-w-xs truncate px-4 py-2.5 text-slate-600">{r.description}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{r.ipAddress}</td>
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
    </div>
  );
}
