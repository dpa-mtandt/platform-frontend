import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, ClipboardCheck, GraduationCap, Layers, Lock, PlayCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, Button, Card, Spinner } from '@/components/ui/primitives';

interface LessonLite {
  id: string;
  title: string;
  type: string;
  isPreview: boolean;
  estimatedMinutes: number;
}
interface SectionLite {
  id: string;
  title: string;
  lessons: LessonLite[];
}
interface CourseDetail {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  status: string;
  category?: { name: string } | null;
  instructor?: { name: string; designation?: string | null } | null;
  lessonCount: number;
  myEnrollment?: { status: string; progressPercent: number } | null;
  completedLessonIds: string[];
  sections: SectionLite[];
}

export default function CourseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [quizzes, setQuizzes] = useState<{ id: string; title: string; questionCount: number; passPercentage: number; passed: boolean; bestScore: number | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setLoading(true);
    setMissing(false);
    api
      .get(`/lms/courses/${slug}`)
      .then((r) => setCourse(r.data.data))
      .catch(() => setMissing(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!course) return;
    api.get(`/lms/quizzes?courseId=${course.id}`).then((r) => setQuizzes(r.data.data)).catch(() => setQuizzes([]));
  }, [course?.id]);

  if (loading) return <div className="py-16 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>;
  if (missing || !course)
    return (
      <div className="py-16 text-center">
        <p className="text-slate-500">Course not found.</p>
        <Link to="/lms" className="mt-3 inline-block"><Button variant="outline">Back to catalog</Button></Link>
      </div>
    );

  const completed = new Set(course.completedLessonIds);
  const enrolled = !!course.myEnrollment;
  const isCompleted = course.myEnrollment?.status === 'COMPLETED';

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/lms" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Catalog
      </Link>

      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-4 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white">
          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/15">
            {course.thumbnailUrl ? (
              <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <GraduationCap className="h-7 w-7" />
            )}
          </div>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              {course.category && <span className="text-xs text-white/70">{course.category.name}</span>}
              {course.status !== 'PUBLISHED' && <Badge tone="amber">{course.status}</Badge>}
            </div>
            <h1 className="text-2xl font-bold">{course.title}</h1>
            {course.summary && <p className="mt-1 text-sm text-white/80">{course.summary}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-slate-100 px-6 py-4 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5"><Layers className="h-4 w-4" /> {course.sections.length} sections · {course.lessonCount} lessons</span>
          {course.instructor && <span>Instructor: {course.instructor.name}</span>}
          <div className="ml-auto">
            <Button onClick={() => navigate(`/lms/learn/${course.slug}`)}>
              <PlayCircle className="h-4 w-4" /> {isCompleted ? 'Review course' : enrolled ? 'Continue' : 'Start course'}
            </Button>
          </div>
        </div>

        {enrolled && (
          <div className="flex items-center gap-3 px-6 py-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${course.myEnrollment!.progressPercent}%` }} />
            </div>
            <span className="text-xs font-medium text-slate-500">{Math.round(course.myEnrollment!.progressPercent)}% complete</span>
          </div>
        )}
      </div>

      {course.description && (
        <Card className="mt-6 p-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">About this course</h2>
          <p className="text-sm leading-relaxed text-slate-600">{course.description}</p>
        </Card>
      )}

      {/* Curriculum */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Curriculum</h2>
        <div className="space-y-3">
          {course.sections.map((s, i) => (
            <Card key={s.id} className="overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700">
                {i + 1}. {s.title}
              </div>
              <ul className="divide-y divide-slate-50">
                {s.lessons.map((l) => {
                  const done = completed.has(l.id);
                  return (
                    <li key={l.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                      {done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-slate-300" />}
                      <span className={done ? 'text-slate-400 line-through' : 'text-slate-700'}>{l.title}</span>
                      {l.isPreview && <Badge tone="blue">preview</Badge>}
                      <span className="ml-auto text-xs text-slate-400">{l.estimatedMinutes} min</span>
                    </li>
                  );
                })}
                {s.lessons.length === 0 && (
                  <li className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-400"><Lock className="h-4 w-4" /> No lessons yet</li>
                )}
              </ul>
            </Card>
          ))}
        </div>
      </div>

      {quizzes.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Assessments</h2>
          <div className="space-y-2">
            {quizzes.map((q) => (
              <Link
                key={q.id}
                to={`/lms/quiz/${q.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-600 text-white">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900">{q.title}</div>
                  <div className="text-xs text-slate-500">{q.questionCount} questions · pass ≥ {q.passPercentage}%</div>
                </div>
                {q.passed && <Badge tone="green">Passed {q.bestScore}%</Badge>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
