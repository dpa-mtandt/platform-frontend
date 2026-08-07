import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Award } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Card, Spinner } from '@/components/ui/primitives';

interface Cert {
  id: string;
  certificateNo: string;
  completionDate: string;
  issuedAt: string;
  course: { title: string; slug: string; category?: { name: string } | null };
}

export default function Certificates() {
  const [certs, setCerts] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/lms/certificates').then((r) => setCerts(r.data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Link to="/lms" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Catalog
      </Link>
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-500 text-white">
          <Award className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Certificates</h1>
          <p className="text-sm text-slate-500">Courses you've completed.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>
      ) : certs.length === 0 ? (
        <Card className="p-10 text-center">
          <Award className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">No certificates yet</p>
          <p className="mt-1 text-sm text-slate-500">Complete a course to earn your first certificate.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certs.map((c) => (
            <Link key={c.id} to={`/lms/certificates/${c.certificateNo}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center gap-3 bg-gradient-to-br from-amber-400 to-orange-500 p-4 text-white">
                <Award className="h-8 w-8" />
                <div>
                  <div className="text-xs uppercase tracking-wide text-white/80">Certificate</div>
                  <div className="font-mono text-xs text-white/90">{c.certificateNo}</div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 group-hover:text-amber-700">{c.course.title}</h3>
                {c.course.category && <p className="text-xs text-slate-400">{c.course.category.name}</p>}
                <p className="mt-2 text-xs text-slate-500">Issued {formatDate(c.issuedAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
