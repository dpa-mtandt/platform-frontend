import { useEffect, useState } from 'react';
import { Clock, Download, Eye, FileText, Lock, ShieldCheck, Video } from 'lucide-react';
import { api } from '@/lib/api';
import { apiErrorMessage } from '@/lib/utils';
import { Badge, Button, Spinner, Textarea } from '@/components/ui/primitives';
import { Dialog } from '@/components/ui/dialog';
import { MediaWatermark } from './media-watermark';
import { formatBytes, type LessonDoc } from '../lib/media-types';

/** Documents attached to a lesson: view-only in-app, with a request→approve→download flow. */
export function LessonDocuments({ documents, onChanged }: { documents: LessonDoc[]; onChanged?: () => void }) {
  const [viewing, setViewing] = useState<LessonDoc | null>(null);
  const [requesting, setRequesting] = useState<LessonDoc | null>(null);

  if (!documents.length) return null;

  return (
    <div className="mt-6 border-t border-slate-100 pt-5">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <FileText className="h-4 w-4 text-slate-400" /> Documents
      </div>
      <ul className="space-y-2">
        {documents.map((d) => (
          <DocRow key={d.id} doc={d} onView={() => setViewing(d)} onRequest={() => setRequesting(d)} />
        ))}
      </ul>
      <p className="mt-2 text-xs text-slate-400">Documents open view-only. Downloading needs approval; videos can never be downloaded.</p>

      {viewing && <DocViewer doc={viewing} onClose={() => setViewing(null)} />}
      {requesting && (
        <RequestDialog
          doc={requesting}
          onClose={() => setRequesting(null)}
          onDone={() => {
            setRequesting(null);
            onChanged?.();
          }}
        />
      )}
    </div>
  );
}

function DocRow({ doc, onView, onRequest }: { doc: LessonDoc; onView: () => void; onRequest: () => void }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const req = doc.request;

  async function download() {
    setDownloading(true);
    setError('');
    try {
      if (doc.download === 'external') {
        // Private SharePoint/URL file: open the source link so the browser downloads
        // it via the user's own login (our server can't fetch a non-public link).
        const res = await api.get(`/media/doc/${doc.id}/download`);
        const url = res.data?.data?.url as string | undefined;
        if (!url) throw new Error('No download link available');
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const res = await api.get(`/media/doc/${doc.id}/download`, { responseType: 'blob' });
        const url = URL.createObjectURL(res.data as Blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.originalName || doc.title;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm">
      {isVideoDoc(doc) ? <Video className="h-4 w-4 shrink-0 text-slate-400" /> : <FileText className="h-4 w-4 shrink-0 text-slate-400" />}
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-slate-800">{doc.title}</div>
        {doc.sizeBytes > 0 && <div className="text-xs text-slate-400">{formatBytes(doc.sizeBytes)}</div>}
        {error && <div className="text-xs text-red-600">{error}</div>}
      </div>

      <Button size="sm" variant="ghost" onClick={onView}>
        <Eye className="h-4 w-4" /> {isVideoDoc(doc) ? 'Play' : 'View'}
      </Button>

      {isVideoDoc(doc) ? (
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
          <Lock className="h-3 w-3" /> Video · view-only
        </span>
      ) : req?.canDownload ? (
        <Button size="sm" variant="secondary" loading={downloading} onClick={download}>
          <Download className="h-4 w-4" /> Download
        </Button>
      ) : req?.status === 'PENDING' ? (
        <Badge tone="amber">
          <Clock className="h-3 w-3" /> Awaiting approval
        </Badge>
      ) : (
        <Button size="sm" variant="outline" onClick={onRequest}>
          <Download className="h-4 w-4" /> {req?.status === 'DENIED' ? 'Request again' : 'Request download'}
        </Button>
      )}
    </li>
  );
}

const isPdfDoc = (doc: LessonDoc) => (doc.mimeType || '').toLowerCase().includes('pdf') || doc.originalName.toLowerCase().endsWith('.pdf');
const isImageDoc = (doc: LessonDoc) => (doc.mimeType || '').toLowerCase().startsWith('image/') || /\.(png|jpe?g|gif|webp)$/.test(doc.originalName.toLowerCase());
const isVideoDoc = (doc: LessonDoc) => !!doc.isVideo || (doc.mimeType || '').toLowerCase().startsWith('video/') || /\.(mp4|webm|ogg|mov|m4v|mkv)$/.test(doc.originalName.toLowerCase());

/** Resolve relative media paths when VITE_API_URL is set (same as ProtectedVideo). */
function resolveMediaSrc(src: string): string {
  if (!src) return src;
  if (/^https?:\/\//i.test(src) || src.startsWith('blob:') || src.startsWith('data:')) return src;
  const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ?? '';
  if (!base) return src;
  return src.startsWith('/') ? `${base}${src}` : `${base}/${src}`;
}

function DocViewer({ doc, onClose }: { doc: LessonDoc; onClose: () => void }) {
  const p = doc.preview;
  // Hide the browser PDF toolbar (download/print) for view-only, but keep the
  // scrollbar so the document can be scrolled on desktop and mobile.
  const rawInline = p.mode === 'inline' ? resolveMediaSrc(p.url) : '';
  const inlineSrc =
    p.mode === 'inline' && isPdfDoc(doc)
      ? `${rawInline}#toolbar=0&navpanes=0&statusbar=0&messages=0`
      : rawInline;
  // 'embed' (SharePoint via the viewer's sign-in) and 'office' both render an iframe.
  const framedSrc = p.mode === 'embed' || p.mode === 'office' ? p.url : '';

  // Deterrents while the viewer is open: block common save/print shortcuts.
  // (Native PDF iframe context menus are owned by the browser plugin — limited control.)
  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (key === 's' || key === 'p')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const blockPrint = (e: Event) => {
      e.preventDefault();
    };
    window.addEventListener('keydown', block, true);
    window.addEventListener('beforeprint', blockPrint);
    return () => {
      window.removeEventListener('keydown', block, true);
      window.removeEventListener('beforeprint', blockPrint);
    };
  }, []);

  return (
    <Dialog open onClose={onClose} title={doc.title} className="max-w-4xl">
      <div
        className="relative h-[68vh] w-full select-none overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        {p.mode === 'inline' && isVideoDoc(doc) ? (
          <video
            src={inlineSrc}
            controls
            controlsList="nodownload noremoteplayback noplaybackrate"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            className="h-full w-full select-none bg-black"
          >
            Your browser does not support video playback.
          </video>
        ) : p.mode === 'inline' && isImageDoc(doc) ? (
          <img
            src={inlineSrc}
            alt={doc.title}
            draggable={false}
            className="h-full w-full select-none object-contain"
            onContextMenu={(e) => e.preventDefault()}
          />
        ) : p.mode === 'inline' ? (
          <>
            <iframe
              src={inlineSrc}
              title={doc.title}
              className="h-full w-full border-0"
              // Restrict iframe capabilities; allow scripts only as needed for PDF rendering.
            />
            {/*
              Pointer-events-none so wheel / touch scroll reach the iframe (and the
              browser PDF viewer). Context-menu / drag are still blocked on the
              outer container above. Native PDF plugin menus remain limited by the
              browser — we cannot fully suppress them without breaking scroll.
            */}
            <div
              className="pointer-events-none absolute inset-0 z-[5]"
              aria-hidden
            />
          </>
        ) : framedSrc ? (
          <iframe src={framedSrc} title={doc.title} className="h-full w-full border-0" allowFullScreen />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-slate-500">
            <FileText className="h-8 w-8 text-slate-300" />
            <p>This file can’t be previewed in the browser. Request download access to open it in its native app.</p>
          </div>
        )}
        <MediaWatermark />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <Lock className="h-3 w-3" />
          {isVideoDoc(doc)
            ? 'View-only video. This cannot be downloaded.'
            : p.mode === 'embed'
              ? 'Rendered read-only through your sign-in.'
              : p.mode === 'office'
                ? 'Rendered read-only in the document viewer.'
                : 'View-only. To keep a copy, request download approval.'}
        </p>
        {/* Escape hatch: if the tenant blocks framing, open it in a new tab (still gated by the user's own sign-in). */}
        {(p.mode === 'embed' || p.mode === 'office') && doc.openUrl && (
          <a
            href={doc.openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
          >
            <Eye className="h-3.5 w-3.5" /> Not loading? Open in new tab
          </a>
        )}
      </div>
    </Dialog>
  );
}

function RequestDialog({ doc, onClose, onDone }: { doc: LessonDoc; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setSaving(true);
    setError('');
    try {
      await api.post(`/media/doc/${doc.id}/requests`, { reason: reason.trim() || null });
      onDone();
    } catch (err) {
      setError(apiErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Request download"
      description={doc.title}
      className="max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button loading={saving} onClick={submit}>
            <ShieldCheck className="h-4 w-4" /> Send request
          </Button>
        </>
      }
    >
      <p className="mb-3 text-sm text-slate-500">An administrator will review your request. If approved, you’ll be able to download this document for 7 days.</p>
      <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional) — why do you need a copy?" />
      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </Dialog>
  );
}
