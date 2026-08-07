import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Lock, Settings2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Badge, Button, Card, Spinner } from '@/components/ui/primitives';
import { DashboardIcon } from '../dashboard-icon';

interface DashboardCard {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  category?: string | null;
  icon?: string | null;
  color?: string | null;
}

export default function DashboardHome() {
  const { can } = useAuth();
  const [rows, setRows] = useState<DashboardCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then((r) => setRows(r.data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-green-600 text-white">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboards</h1>
          <p className="text-sm text-slate-500">Your assigned Power BI dashboards & analytics.</p>
        </div>
        {can('dashboard.manage') && (
          <Link to="/dashboard/manage" className="ml-auto">
            <Button variant="outline" size="sm"><Settings2 className="h-4 w-4" /> Manage</Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Lock className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">No dashboards assigned</p>
          <p className="mt-1 text-sm text-slate-500">An administrator needs to grant you access to specific dashboards.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((d) => (
            <Link key={d.id} to={`/dashboard/${d.id}`} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: d.color || '#64748b' }} />
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl text-white" style={{ backgroundColor: d.color || '#64748b' }}>
                <DashboardIcon name={d.icon} className="h-6 w-6" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">{d.name}</h3>
                <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
              </div>
              {d.category && <Badge tone="slate" className="mt-1">{d.category}</Badge>}
              <p className="mt-2 text-sm text-slate-500">{d.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
