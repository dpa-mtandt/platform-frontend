export type DownloadRequestStatus = 'PENDING' | 'APPROVED' | 'DENIED';

export interface DocRequest {
  id: string;
  status: DownloadRequestStatus;
  canDownload: boolean;
  reason: string | null;
  decisionNote: string | null;
  expiresAt: string | null;
  reviewedAt: string | null;
}

export type DocPreview =
  | { mode: 'inline'; url: string }
  | { mode: 'embed'; url: string }
  | { mode: 'office'; url: string }
  | { mode: 'none' };

export interface LessonDoc {
  id: string;
  title: string;
  originalName: string;
  mimeType: string | null;
  sizeBytes: number;
  viewUrl: string;
  preview: DocPreview;
  // True when this "document" is actually a video file: plays view-only, never downloadable.
  isVideo?: boolean;
  // Open the source in a new tab via the viewer's own sign-in (escape hatch when an
  // embedded preview is blocked from framing). Null for uploaded files.
  openUrl?: string | null;
  download: 'file' | 'external';
  request: DocRequest | null;
}

export interface LessonVideo {
  id: string;
  title: string;
  streamUrl: string;
  // Browser-embeddable fallback for URL-sourced videos (SharePoint/OneDrive/YouTube/…),
  // rendered via the viewer's own sign-in when the proxy stream can't be played.
  embedUrl?: string | null;
  isProtected: boolean;
  duration: number;
  thumbnailUrl: string | null;
  provider: string | null;
  mimeType: string | null;
  // Manager-only (present when authoring), so the editor can show/edit the source.
  sourceUrl?: string;
  fileKey?: string | null;
  sizeBytes?: number;
}

export function formatBytes(n: number): string {
  if (!n) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i > 0 && v < 10 ? 1 : 0)} ${units[i]}`;
}
