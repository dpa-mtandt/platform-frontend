import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Circle, PlayCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge, Button, Spinner } from '@/components/ui/primitives';
import { ProtectedVideo } from '../components/protected-video';
import { LessonDocuments } from '../components/lesson-documents';
import type { LessonDoc, LessonVideo } from '../lib/media-types';

interface LearnLesson { id: string; title: string; estimatedMinutes: number; progress?: { completed: boolean } | null }
interface LearnSection { id: string; title: string; lessons: LearnLesson[] }
interface LearnData { course: { id: string; title: string; slug: string }; sections: LearnSection[]; resumeLessonId: string | null }
interface Lesson {
  id: string;
  title: string;
  content?: string | null;
  type: string;
  video?: LessonVideo | null;
  documents?: LessonDoc[];
  prevLessonId: string | null;
  nextLessonId: string | null;
  progress?: { completed: boolean } | null;
}

export default function CoursePlayer() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const [learn, setLearn] = useState<LearnData | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadLearn = useCallback(async () => {
    const res = await api.get(`/lms/courses/${slug}/learn`);
    setLearn(res.data.data);
    return res.data.data as LearnData;
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    loadLearn()
      .then((data) => {
        const wanted = params.get('lesson') || data.resumeLessonId;
        setCurrent(wanted);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!current) return;
    setLessonLoading(true);
    api
      .get(`/lms/lessons/${current}`)
      .then((r) => setLesson(r.data.data))
      .finally(() => setLessonLoading(false));
  }, [current]);

  // Silent re-fetch (no spinner) — used after a download request updates doc state.
  const reloadLesson = useCallback(() => {
    if (!current) return;
    api.get(`/lms/lessons/${current}`).then((r) => setLesson(r.data.data)).catch(() => {});
  }, [current]);

  function selectLesson(id: string) {
    setCurrent(id);
    setParams((p) => {
      p.set('lesson', id);
      return p;
    });
  }

  async function markCompleteAndNext() {
    if (!lesson) return;
    setSaving(true);
    try {
      await api.put(`/lms/lessons/${lesson.id}/progress`, { completed: true });
      await loadLearn();
      if (lesson.nextLessonId) selectLesson(lesson.nextLessonId);
      else {
        // refresh current lesson so its completed state shows
        const r = await api.get(`/lms/lessons/${lesson.id}`);
        setLesson(r.data.data);
      }
    } finally {
      setSaving(false);
    }
  }

  const { completedCount, totalCount } = useMemo(() => {
    const all = (learn?.sections ?? []).flatMap((s) => s.lessons);
    return { completedCount: all.filter((l) => l.progress?.completed).length, totalCount: all.length };
  }, [learn]);
  const pct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) return <div className="py-16 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>;
  if (!learn) return <div className="py-16 text-center text-slate-500">Course not available.</div>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link to={`/lms/course/${slug}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> {learn.course.title}
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-200 sm:w-40">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-medium text-slate-500">
            {completedCount}/{totalCount} · {pct}%
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Sidebar */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:sticky lg:top-20 lg:self-start">
          {learn.sections.map((s, i) => (
            <div key={s.id} className="mb-2">
              <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {i + 1}. {s.title}
              </div>
              <ul>
                {s.lessons.map((l) => {
                  const active = l.id === current;
                  const done = l.progress?.completed;
                  return (
                    <li key={l.id}>
                      <button
                        onClick={() => selectLesson(l.id)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm',
                          active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50',
                        )}
                      >
                        {done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : <Circle className="h-4 w-4 shrink-0 text-slate-300" />}
                        <span className="flex-1 truncate">{l.title}</span>
                        <span className="text-[10px] text-slate-400">{l.estimatedMinutes}m</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>

        {/* Main */}
        <main className="min-w-0">
          {lessonLoading || !lesson ? (
            <div className="py-16 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{lesson.title}</h1>
                {lesson.progress?.completed && <Badge tone="green">completed</Badge>}
              </div>

              {lesson.video?.streamUrl && (
                <ProtectedVideo src={lesson.video.streamUrl} embedUrl={lesson.video.embedUrl} watermark={lesson.video.isProtected} poster={lesson.video.thumbnailUrl} />
              )}

              {/* Lesson content is authored by trained admins (internal, trusted). */}
              {lesson.content ? (
                <div
                  className="prose prose-slate max-w-none text-slate-700 [&_li]:my-1 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: lesson.content }}
                />
              ) : !lesson.video && !lesson.documents?.length ? (
                <p className="text-sm text-slate-400">This lesson has no written content.</p>
              ) : null}

              <LessonDocuments documents={lesson.documents ?? []} onChanged={reloadLesson} />

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <Button variant="outline" disabled={!lesson.prevLessonId} onClick={() => lesson.prevLessonId && selectLesson(lesson.prevLessonId)}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <div className="flex gap-2">
                  {!lesson.progress?.completed ? (
                    <Button loading={saving} onClick={markCompleteAndNext}>
                      <CheckCircle2 className="h-4 w-4" /> {lesson.nextLessonId ? 'Complete & continue' : 'Mark complete'}
                    </Button>
                  ) : lesson.nextLessonId ? (
                    <Button onClick={() => selectLesson(lesson.nextLessonId!)}>
                      Next lesson <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Badge tone="green"><PlayCircle className="h-4 w-4" /> Course complete</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
