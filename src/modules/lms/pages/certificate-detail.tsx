import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Award, Printer } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button, Spinner } from '@/components/ui/primitives';

interface CertDetail {
  certificateNo: string;
  holderName: string;
  courseTitle: string;
  courseCategory?: string | null;
  completionDate: string;
  issuedAt: string;
}

export default function CertificateDetail() {
  const { certificateNo } = useParams();
  const [cert, setCert] = useState<CertDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/lms/certificates/${certificateNo}`).then((r) => setCert(r.data.data)).catch(() => setMissing(true)).finally(() => setLoading(false));
  }, [certificateNo]);

  if (loading) return <div className="py-16 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>;
  if (missing || !cert)
    return (
      <div className="py-16 text-center">
        <p className="text-slate-500">Certificate not found.</p>
        <Link to="/lms/certificates" className="mt-3 inline-block"><Button variant="outline">My certificates</Button></Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between no-print">
        <Link to="/lms/certificates" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> My certificates
        </Link>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print
        </Button>
      </div>

      {/* Certificate */}
      <div className="cert-print relative overflow-hidden rounded-2xl border-4 border-amber-400 bg-white p-6 sm:p-10 text-center shadow-sm">
        <div className="pointer-events-none absolute inset-0 opacity-5">
          <Award className="absolute -right-10 -top-10 h-64 w-64" />
        </div>
        <div className="relative">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-ink text-brand">
            <span className="text-2xl font-black">M</span>
          </div>
          <p className="mt-4 text-sm font-medium uppercase tracking-[0.3em] text-amber-600">Certificate of Completion</p>
          <p className="mt-8 text-sm text-slate-500">This certifies that</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{cert.holderName}</h1>
          <p className="mt-6 text-sm text-slate-500">has successfully completed</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-800">{cert.courseTitle}</h2>
          {cert.courseCategory && <p className="mt-1 text-sm text-slate-400">{cert.courseCategory}</p>}

          <div className="mt-10 flex items-end justify-between border-t border-slate-100 pt-6 text-left">
            <div>
              <p className="text-xs text-slate-400">Certificate No.</p>
              <p className="font-mono text-sm text-slate-700">{cert.certificateNo}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Issued</p>
              <p className="text-sm text-slate-700">{formatDate(cert.issuedAt)}</p>
            </div>
          </div>
          <p className="mt-6 text-xs text-slate-400">MTANDT Enterprise Platform · Training</p>
        </div>
      </div>
    </div>
  );
}
