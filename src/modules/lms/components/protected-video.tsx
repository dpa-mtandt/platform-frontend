import { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { MediaWatermark } from './media-watermark';

interface ProtectedVideoProps {
  /** Same-origin tokened stream URL (protected) or a raw URL (unprotected passthrough). */
  src: string;
  /**
   * Browser-embeddable fallback (SharePoint/OneDrive/YouTube/… ). Used when the proxy
   * `src` can't be played — e.g. an org-restricted SharePoint link the server can't
   * fetch — so the video renders through the viewer's own sign-in instead.
   */
  embedUrl?: string | null;
  poster?: string | null;
  /** Overlay the viewer's email watermark. On for protected videos. */
  watermark?: boolean;
}

/** Turn a relative API path into an absolute URL when VITE_API_URL is set. */
function resolveMediaSrc(src: string): string {
  if (!src) return src;
  if (/^https?:\/\//i.test(src) || src.startsWith('blob:') || src.startsWith('data:')) return src;
  const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ?? '';
  if (!base) return src; // same-origin / Vite proxy
  return src.startsWith('/') ? `${base}${src}` : `${base}/${src}`;
}

/**
 * View-only video. It streams from the backend proxy (the real source is never
 * exposed), disables the download / picture-in-picture / remote-playback controls,
 * blocks the right-click "save video" menu, and overlays a per-viewer watermark.
 * These are deterrents, not DRM — but combined they make casual exfiltration hard
 * and any leak traceable.
 *
 * If the proxy stream fails and an `embedUrl` is available, it falls back to an
 * <iframe> that renders the source through the viewer's own session (with an "Open"
 * escape hatch in case the host blocks framing).
 */
export function ProtectedVideo({ src, embedUrl, poster, watermark = true }: ProtectedVideoProps) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = useMemo(() => resolveMediaSrc(src), [src]);

  // Reset the fallback whenever the source changes (navigating between lessons).
  useEffect(() => setFailed(false), [resolvedSrc]);

  if (failed && embedUrl) {
    return (
      <div className="relative mb-4 overflow-hidden rounded-xl bg-black" onContextMenu={(e) => e.preventDefault()}>
        <iframe
          key={embedUrl}
          src={embedUrl}
          title="Lesson video"
          className="block aspect-video max-h-[70vh] w-full border-0"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
        />
        {watermark && <MediaWatermark />}
        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white/90 backdrop-blur hover:bg-black/80"
        >
          <ExternalLink className="h-3 w-3" /> Open
        </a>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
        This video couldn’t be loaded. It may have moved or its share link may have expired.
      </div>
    );
  }

  return (
    <div className="relative mb-4 overflow-hidden rounded-xl bg-black" onContextMenu={(e) => e.preventDefault()}>
      <video
        key={resolvedSrc}
        src={resolvedSrc}
        poster={poster ?? undefined}
        controls
        controlsList="nodownload noremoteplayback noplaybackrate"
        disablePictureInPicture
        onError={() => setFailed(true)}
        onContextMenu={(e) => e.preventDefault()}
        className="block max-h-[70vh] w-full select-none"
      >
        Your browser does not support video playback.
      </video>
      {watermark && <MediaWatermark />}
    </div>
  );
}
