import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Award, Linkedin, Printer } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button, Spinner } from '@/components/ui/primitives';
import { MtandtLogo } from '@/components/ui/mtandt-logo';

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

  const issued = new Date(cert.issuedAt);
  const linkedInHref =
    'https://www.linkedin.com/profile/add?' +
    new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name: cert.courseTitle,
      organizationName: 'MTANDT Group',
      issueYear: String(issued.getFullYear()),
      issueMonth: String(issued.getMonth() + 1),
      certId: cert.certificateNo,
      certUrl: window.location.href,
    }).toString();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 no-print">
        <Link to="/lms/certificates" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> My certificates
        </Link>
        <div className="flex items-center gap-2">
          <a href={linkedInHref} target="_blank" rel="noopener noreferrer">
            <Button variant="outline"><Linkedin className="h-4 w-4" /> Add to LinkedIn</Button>
          </a>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* Certificate */}
      <div className="cert-print relative overflow-hidden rounded-2xl border-4 border-amber-400 bg-white p-6 text-center shadow-md sm:p-12">
        {/* faint ribbon watermark + inner gold hairline frame */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
          <Award className="absolute -right-12 -top-12 h-72 w-72" />
        </div>
        <div className="pointer-events-none absolute inset-3 rounded-xl border border-amber-200" />

        <div className="relative">
          <MtandtLogo className="mx-auto h-16 w-auto object-contain" />

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.35em] text-amber-600">Certificate of Completion</p>
          <div className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          <p className="mt-8 text-sm text-slate-500">This certifies that</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{cert.holderName}</h1>
          <p className="mt-6 text-sm text-slate-500">has successfully completed</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-800 sm:text-2xl">{cert.courseTitle}</h2>
          {cert.courseCategory && <p className="mt-1 text-sm text-slate-400">{cert.courseCategory}</p>}

          {/* Issue details + authorized signatory */}
          <div className="mt-12 grid grid-cols-1 gap-8 border-t border-slate-100 pt-6 text-left sm:grid-cols-2 sm:items-end">
            <div className="space-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Certificate No.</p>
                <p className="font-mono text-sm text-slate-700">{cert.certificateNo}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Issued</p>
                <p className="text-sm text-slate-700">{formatDate(cert.issuedAt)}</p>
              </div>
            </div>

            <div className="sm:justify-self-end sm:text-center">
              <p className="font-serif text-2xl italic leading-none text-slate-800">Shiv Rattan</p>
              <div className="mx-auto mt-1 w-56 border-t border-slate-400" />
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-600">Authorized by</p>
              <p className="text-sm font-semibold text-slate-800">Shiv Rattan</p>
              <p className="text-xs text-slate-500">Head – IT &amp; ERP</p>
              <p className="text-xs text-slate-500">MTANDT Group</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
