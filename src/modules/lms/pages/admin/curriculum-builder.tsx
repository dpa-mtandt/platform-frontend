import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, FileText, GripVertical, Lock, Pencil, Plus, Trash2, Upload, Video } from 'lucide-react';
import { api } from '@/lib/api';
import { apiErrorMessage } from '@/lib/utils';
import { Badge, Button, Card, Input, Label, Select, Spinner, Textarea } from '@/components/ui/primitives';
import { Dialog } from '@/components/ui/dialog';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { formatBytes } from '../../lib/media-types';

/** Upload a file to protected storage; resolves to the stored fileKey + metadata. */
async function uploadProtected(file: File): Promise<{ fileKey: string; originalName: string; mimeType: string; sizeBytes: number }> {
  const res = await api.post('/media/upload', file, {
    headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-File-Name': encodeURIComponent(file.name) },
  });
  return res.data.data;
}

interface Lesson {
  id: string;
  title: string;
  type: string;
  orderIndex: number;
  isPreview: boolean;
  estimatedMinutes: number;
  video?: { id: string; duration: number } | null;
}
interface Section {
  id: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  lessons: Lesson[];
}

export function CurriculumBuilder({ slug }: { slug: string }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [courseId, setCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [newSection, setNewSection] = useState('');
  const [lessonDialog, setLessonDialog] = useState<{ sectionId: string; lessonId: string | null } | null>(null);
  const [error, setError] = useState('');
  const { confirm, confirmNode } = useConfirm();

  const load = useCallback(async () => {
    const res = await api.get(`/lms/courses/${slug}`);
    setCourseId(res.data.data.id);
    setSections(res.data.data.sections);
    setLoading(false);
  }, [slug]);
  useEffect(() => {
    void load();
  }, [load]);

  async function run(fn: () => Promise<unknown>) {
    setError('');
    try {
      await fn();
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  const addSection = () => newSection.trim() && run(async () => { await api.post('/lms/sections', { courseId, title: newSection.trim() }); setNewSection(''); });
  const renameSection = (s: Section, title: string) => title.trim() && title !== s.title && run(() => api.patch(`/lms/sections/${s.id}`, { title: title.trim() }));
  const moveSection = (idx: number, dir: number) => {
    const arr = [...sections];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j]!, arr[idx]!];
    void run(() => api.put('/lms/sections/reorder', { sectionIds: arr.map((s) => s.id) }));
  };
  const moveLesson = (s: Section, idx: number, dir: number) => {
    const arr = [...s.lessons];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j]!, arr[idx]!];
    void run(() => api.put('/lms/lessons/reorder', { sectionId: s.id, lessonIds: arr.map((l) => l.id) }));
  };

  if (loading) return <div className="py-10 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>;

  return (
    <div>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="space-y-3">
        {sections.map((s, si) => (
          <Card key={s.id} className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
              <GripVertical className="h-4 w-4 text-slate-300" />
              <input
                defaultValue={s.title}
                onBlur={(e) => renameSection(s, e.target.value)}
                className="flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold text-slate-800 hover:border-slate-200 focus:border-slate-300 focus:bg-white focus:outline-none"
              />
              <Button size="icon" variant="ghost" title="Move up" onClick={() => moveSection(si, -1)} disabled={si === 0}><ChevronUp className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" title="Move down" onClick={() => moveSection(si, 1)} disabled={si === sections.length - 1}><ChevronDown className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" title="Delete section" onClick={() => confirm({ title: `Delete section “${s.title}”?`, message: 'This removes the section and every lesson, video and document inside it. This cannot be undone.', onConfirm: () => run(() => api.delete(`/lms/sections/${s.id}`)) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <ul className="divide-y divide-slate-50">
              {s.lessons.map((l, li) => (
                <li key={l.id} className="flex flex-wrap items-center gap-2 px-4 py-2 text-sm">
                  <span className="text-xs text-slate-300">{li + 1}</span>
                  {l.type === 'VIDEO' && <Video className="h-3.5 w-3.5 text-slate-400" />}
                  <span className="min-w-0 flex-1 truncate text-slate-700">{l.title}</span>
                  {l.isPreview && <Badge tone="blue">preview</Badge>}
                  <span className="ml-auto text-xs text-slate-400">{l.estimatedMinutes}m</span>
                  <Button size="icon" variant="ghost" title="Move up" onClick={() => moveLesson(s, li, -1)} disabled={li === 0}><ChevronUp className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" title="Move down" onClick={() => moveLesson(s, li, 1)} disabled={li === s.lessons.length - 1}><ChevronDown className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" title="Edit" onClick={() => setLessonDialog({ sectionId: s.id, lessonId: l.id })}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" title="Delete" onClick={() => confirm({ title: `Delete lesson “${l.title}”?`, message: 'This removes the lesson and its video/documents. This cannot be undone.', onConfirm: () => run(() => api.delete(`/lms/lessons/${l.id}`)) })}><Trash2 className="h-4 w-4" /></Button>
                </li>
              ))}
              <li className="px-4 py-2">
                <Button size="sm" variant="ghost" onClick={() => setLessonDialog({ sectionId: s.id, lessonId: null })}>
                  <Plus className="h-4 w-4" /> Add lesson
                </Button>
              </li>
            </ul>
          </Card>
        ))}
      </div>

      {/* Add section */}
      <div className="mt-4 flex gap-2">
        <Input value={newSection} onChange={(e) => setNewSection(e.target.value)} placeholder="New section title…" onKeyDown={(e) => e.key === 'Enter' && addSection()} className="max-w-xs" />
        <Button variant="secondary" onClick={addSection}><Plus className="h-4 w-4" /> Add section</Button>
      </div>

      {lessonDialog && (
        <LessonDialog
          sectionId={lessonDialog.sectionId}
          lessonId={lessonDialog.lessonId}
          onClose={() => setLessonDialog(null)}
          onSaved={() => { setLessonDialog(null); void load(); }}
        />
      )}
      {confirmNode}
    </div>
  );
}

function LessonDialog({ sectionId, lessonId, onClose, onSaved }: { sectionId: string; lessonId: string | null; onClose: () => void; onSaved: () => void }) {
  const isNew = !lessonId;
  const [loading, setLoading] = useState(!isNew);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('RICH_TEXT');
  const [content, setContent] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(5);
  const [isPreview, setIsPreview] = useState(false);
  // Video source: paste a YouTube (or other public) URL OR upload a file. Uploads are
  // always protected; a URL keeps the "protected view-only" choice below.
  const [videoMode, setVideoMode] = useState<'url' | 'upload'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoIsProtected, setVideoIsProtected] = useState(true);
  const [videoFileKey, setVideoFileKey] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState('');
  const [videoMimeType, setVideoMimeType] = useState<string | null>(null);
  const [videoSizeBytes, setVideoSizeBytes] = useState(0);
  const [uploading, setUploading] = useState(false);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const docsRef = useRef<DocsEditorHandle>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    api.get(`/lms/lessons/${lessonId}`).then((r) => {
      const l = r.data.data;
      setTitle(l.title);
      setType(l.type);
      setContent(l.content ?? '');
      setEstimatedMinutes(l.estimatedMinutes);
      setIsPreview(l.isPreview);
      setVideoUrl(l.video?.sourceUrl ?? '');
      setVideoDuration(l.video?.duration ?? 0);
      setVideoIsProtected(l.video?.isProtected ?? true);
      setVideoFileKey(l.video?.fileKey ?? null);
      setVideoMimeType(l.video?.mimeType ?? null);
      setVideoSizeBytes(l.video?.sizeBytes ?? 0);
      if (l.video?.fileKey) {
        setVideoMode('upload');
        setVideoFileName(l.video?.title ?? 'Uploaded video');
      }
    }).finally(() => setLoading(false));
  }, [lessonId, isNew]);

  async function onVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const up = await uploadProtected(file);
      setVideoFileKey(up.fileKey);
      setVideoFileName(up.originalName);
      setVideoMimeType(up.mimeType);
      setVideoSizeBytes(up.sizeBytes);
      setVideoUrl('');
      setVideoIsProtected(true);
      if (!title.trim()) setTitle(up.originalName.replace(/\.[^.]+$/, ''));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setUploading(false);
      if (videoFileRef.current) videoFileRef.current.value = '';
    }
  }

  function buildVideoPayload() {
    if (type !== 'VIDEO' && type !== 'MIXED') return null;
    if (videoMode === 'upload' && videoFileKey) {
      return { title, fileKey: videoFileKey, mimeType: videoMimeType, sizeBytes: videoSizeBytes, duration: videoDuration, isProtected: true };
    }
    if (videoUrl.trim()) {
      return { title, url: videoUrl.trim(), duration: videoDuration, isProtected: videoIsProtected };
    }
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = { title, type, content: content || null, estimatedMinutes, isPreview, video: buildVideoPayload() };
      if (isNew) await api.post('/lms/lessons', { sectionId, ...body });
      else await api.patch(`/lms/lessons/${lessonId}`, body);
      // Commit a document the author typed but didn't explicitly "Add".
      await docsRef.current?.flush();
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={isNew ? 'Add lesson' : 'Edit lesson'}
      className="max-w-xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button form="lesson-form" type="submit" loading={saving}>{isNew ? 'Add lesson' : 'Save lesson'}</Button>
        </>
      }
    >
      {loading ? (
        <div className="py-8 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>
      ) : (
        <form id="lesson-form" onSubmit={submit} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Type</Label>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="RICH_TEXT">Rich text</option>
                <option value="VIDEO">Video</option>
                <option value="PDF">PDF</option>
                <option value="DOCUMENT">Document</option>
                <option value="MIXED">Mixed</option>
              </Select>
            </div>
            <div>
              <Label>Estimated minutes</Label>
              <Input type="number" min={0} value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(Number(e.target.value))} />
            </div>
          </div>
          {(type === 'VIDEO' || type === 'MIXED') && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Video className="h-3.5 w-3.5" /> Video
              </div>
              <div className="mb-3 inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm">
                <button type="button" onClick={() => setVideoMode('url')} className={`rounded-md px-3 py-1 ${videoMode === 'url' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>YouTube / URL</button>
                <button type="button" onClick={() => setVideoMode('upload')} className={`rounded-md px-3 py-1 ${videoMode === 'upload' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>Upload file</button>
              </div>

              {videoMode === 'url' ? (
                <div className="space-y-2">
                  <Input value={videoUrl} onChange={(e) => { setVideoUrl(e.target.value); setVideoFileKey(null); }} placeholder="https://www.youtube.com/watch?v=… or https://youtu.be/…" />
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={videoIsProtected} onChange={(e) => setVideoIsProtected(e.target.checked)} className="rounded border-slate-300" />
                    <Lock className="h-3.5 w-3.5 text-slate-400" /> Protected — stream view-only through the app with a watermark (never downloadable)
                  </label>
                  <p className="text-xs text-slate-400">Paste a YouTube link (recommended). Other public video URLs also work. SharePoint links cannot be embedded and are no longer supported here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <input ref={videoFileRef} type="file" accept="video/*" className="hidden" onChange={onVideoFile} />
                  <Button type="button" variant="outline" size="sm" loading={uploading} onClick={() => videoFileRef.current?.click()}>
                    <Upload className="h-4 w-4" /> {videoFileKey ? 'Replace file' : 'Choose video file'}
                  </Button>
                  {videoFileKey && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Lock className="h-3.5 w-3.5 text-emerald-500" /> {videoFileName} {videoSizeBytes > 0 && <span className="text-slate-400">· {formatBytes(videoSizeBytes)}</span>}
                    </div>
                  )}
                  <p className="text-xs text-slate-400">Uploaded videos are always protected: streamed view-only with a watermark, never downloadable.</p>
                </div>
              )}

              <div className="mt-3 max-w-[12rem]">
                <Label>Duration (seconds)</Label>
                <Input type="number" min={0} value={videoDuration} onChange={(e) => setVideoDuration(Number(e.target.value))} />
              </div>
            </div>
          )}
          <div>
            <Label>Content (HTML)</Label>
            <Textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder="<p>Lesson content…</p>" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={isPreview} onChange={(e) => setIsPreview(e.target.checked)} className="rounded border-slate-300" />
            Free preview (viewable before enrolling)
          </label>

          {/* View-only documents (external URL or upload). Need a saved lesson id. */}
          {isNew ? (
            <p className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-400">Save the lesson, then reopen it to attach view-only documents.</p>
          ) : (
            <LessonDocsEditor lessonId={lessonId!} ref={docsRef} />
          )}

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </form>
      )}
    </Dialog>
  );
}

interface EditorDoc { id: string; title: string; originalName: string; sizeBytes: number }

export interface DocsEditorHandle {
  /** Commit a not-yet-added document form. Returns false if nothing was pending. */
  flush: () => Promise<boolean>;
}

/** Attach / remove view-only documents on a saved lesson. */
const LessonDocsEditor = forwardRef<DocsEditorHandle, { lessonId: string }>(function LessonDocsEditor({ lessonId }, ref) {
  const [docs, setDocs] = useState<EditorDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [url, setUrl] = useState('');
  const [pending, setPending] = useState<{ fileKey: string; originalName: string; mimeType: string; sizeBytes: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const { confirm, confirmNode } = useConfirm();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const load = useCallback(async () => {
    const r = await api.get(`/lms/lessons/${lessonId}`);
    setDocs((r.data.data.documents ?? []).map((d: EditorDoc) => ({ id: d.id, title: d.title, originalName: d.originalName, sizeBytes: d.sizeBytes })));
    setLoading(false);
  }, [lessonId]);
  useEffect(() => { void load(); }, [load]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const up = await uploadProtected(file);
      setPending(up);
      if (!title.trim()) setTitle(up.originalName.replace(/\.[^.]+$/, ''));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  // Commit the pending doc form (URL or uploaded file). Title is optional — the
  // server names it from the filename or a numbered default when blank. Returns
  // false when nothing is pending; throws on API error so Save can surface it.
  const commit = useCallback(async (): Promise<boolean> => {
    const trimmedUrl = url.trim();
    if (mode === 'upload' && pending) {
      await api.post('/media/documents', { lessonId, title: title.trim() || undefined, fileKey: pending.fileKey, originalName: pending.originalName, mimeType: pending.mimeType, sizeBytes: pending.sizeBytes });
    } else if (mode === 'url' && trimmedUrl) {
      await api.post('/media/documents', { lessonId, title: title.trim() || undefined, url: trimmedUrl });
    } else {
      return false;
    }
    setTitle('');
    setUrl('');
    setPending(null);
    await load();
    return true;
  }, [mode, url, pending, title, lessonId, load]);

  // Let the parent's "Save lesson" flush a document the user typed but didn't "Add".
  useImperativeHandle(ref, () => ({ flush: commit }), [commit]);

  async function add() {
    if (mode === 'url' && !url.trim()) return setError('Paste a document URL');
    if (mode === 'upload' && !pending) return setError('Choose a file to upload');
    setBusy(true);
    setError('');
    try {
      await commit();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setError('');
    try {
      await api.delete(`/media/documents/${id}`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function rename(id: string) {
    const t = renameValue.trim();
    if (!t) { setRenamingId(null); return; }
    setError('');
    try {
      await api.patch(`/media/documents/${id}`, { title: t });
      setRenamingId(null);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <FileText className="h-3.5 w-3.5" /> View-only documents
      </div>

      {loading ? (
        <div className="py-3 text-center"><Spinner className="mx-auto h-5 w-5 text-slate-300" /></div>
      ) : (
        <>
          {docs.length > 0 && (
            <ul className="mb-3 space-y-1.5">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-1.5 text-sm">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {renamingId === d.id ? (
                    <>
                      <Input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void rename(d.id); } if (e.key === 'Escape') setRenamingId(null); }}
                        autoFocus
                        className="h-7 min-w-0 flex-1 py-0"
                      />
                      <Button type="button" size="sm" onClick={() => rename(d.id)}>Save</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setRenamingId(null)}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate text-slate-700">{d.title}</span>
                      {d.sizeBytes > 0 && <span className="text-xs text-slate-400">{formatBytes(d.sizeBytes)}</span>}
                      <Button type="button" size="icon" variant="ghost" title="Rename" onClick={() => { setRenamingId(d.id); setRenameValue(d.title); }}><Pencil className="h-4 w-4" /></Button>
                      <Button type="button" size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" title="Remove" onClick={() => confirm({ title: `Remove “${d.title}”?`, message: 'This detaches the document and deletes any uploaded file.', confirmLabel: 'Remove', onConfirm: () => remove(d.id) })}><Trash2 className="h-4 w-4" /></Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2 rounded-lg border border-dashed border-slate-200 p-2.5">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title (optional)" />
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm">
              <button type="button" onClick={() => setMode('url')} className={`rounded-md px-3 py-1 ${mode === 'url' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>External URL</button>
              <button type="button" onClick={() => setMode('upload')} className={`rounded-md px-3 py-1 ${mode === 'upload' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>Upload file</button>
            </div>
            {mode === 'url' ? (
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…document or public file link" />
            ) : (
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg" className="hidden" onChange={onFile} />
                <Button type="button" variant="outline" size="sm" loading={busy} onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> {pending ? 'Replace' : 'Choose file'}</Button>
                {pending && <span className="truncate text-xs text-slate-500">{pending.originalName} · {formatBytes(pending.sizeBytes)}</span>}
              </div>
            )}
            <Button type="button" size="sm" loading={busy} onClick={add}><Plus className="h-4 w-4" /> Add document</Button>
          </div>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <p className="mt-1 text-xs text-slate-400">Add a document, or just paste a link and hit “Save lesson” — it’s saved either way. Title is optional.</p>
        </>
      )}
      {confirmNode}
    </div>
  );
});
