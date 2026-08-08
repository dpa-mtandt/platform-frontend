import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, BookOpen, ClipboardList, GraduationCap, PenSquare, PlayCircle, Search, ShieldCheck, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Badge, Button, Card, Input, Select, Spinner } from '@/components/ui/primitives';
import { MtandtLogo } from '@/components/ui/mtandt-logo';

interface CourseCard {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  thumbnailUrl?: string | null;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedMinutes: number;
  isFeatured: boolean;
  category?: { id: string; name: string } | null;
  sectionCount: number;
  myEnrollment?: { status: string; progressPercent: number } | null;
}
interface Enrollment {
  id: string;
  status: string;
  progressPercent: number;
  course: { title: string; slug: string; category?: { name: string } | null };
}

const diffTone = { BEGINNER: 'green', INTERMEDIATE: 'amber', ADVANCED: 'red' } as const;

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export default function LmsCatalog() {
  const { can } = useAuth();
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState({ enrolled: 0, inProgress: 0, completed: 0 });
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    void (async () => {
      const [mine, cats] = await Promise.all([api.get('/lms/enrollments/mine'), api.get('/lms/categories')]);
      setEnrollments(mine.data.data.enrollments);
      setStats(mine.data.data.stats);
      setCategories(cats.data.data);
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (categoryId) params.set('categoryId', categoryId);
      params.set('limit', '24');
      const res = await api.get(`/lms/courses?${params.toString()}`);
      setCourses(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [search, categoryId]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  const inProgress = enrollments.filter((e) => e.status === 'IN_PROGRESS' || e.status === 'ASSIGNED');

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Training</h1>
          <p className="text-sm text-slate-500">Grow your skills with MTANDT courses.</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <div className="hidden gap-4 sm:flex">
            <Stat icon={BookOpen} label="Enrolled" value={stats.enrolled} />
            <Stat icon={PlayCircle} label="In progress" value={stats.inProgress} />
            <Stat icon={Trophy} label="Completed" value={stats.completed} />
          </div>
          {can('lms.course.manage') && (
            <Link to="/lms/manage/courses">
              <Button variant="outline" size="sm"><PenSquare className="h-4 w-4" /> Courses</Button>
            </Link>
          )}
          {can('lms.quiz.manage') && (
            <Link to="/lms/manage/quizzes">
              <Button variant="outline" size="sm"><ClipboardList className="h-4 w-4" /> Quizzes</Button>
            </Link>
          )}
          {can('lms.download.approve') && (
            <Link to="/lms/manage/download-requests">
              <Button variant="outline" size="sm"><ShieldCheck className="h-4 w-4" /> Requests</Button>
            </Link>
          )}
          <Link to="/lms/certificates">
            <Button variant="outline" size="sm">
              <Award className="h-4 w-4" /> Certificates
            </Button>
          </Link>
        </div>
      </div>

      {inProgress.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Continue training</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inProgress.slice(0, 3).map((e) => (
              <Link key={e.id} to={`/lms/learn/${e.course.slug}`} className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{e.course.category?.name ?? 'General'}</span>
                  <Badge tone={e.status === 'ASSIGNED' ? 'amber' : 'blue'}>{e.status === 'ASSIGNED' ? 'Assigned' : 'In progress'}</Badge>
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-blue-700">{e.course.title}</h3>
                <div className="mt-3 flex items-center gap-2">
                  <ProgressBar value={e.progressPercent} />
                  <span className="text-xs font-medium text-slate-500">{Math.round(e.progressPercent)}%</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Browse */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Browse courses</h2>
        <div className="ml-auto flex flex-wrap gap-2">
          <div className="relative w-full sm:w-auto">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses…" className="w-full pl-8 sm:w-56" />
          </div>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full sm:w-44">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Spinner className="mx-auto h-6 w-6 text-slate-300" />
        </div>
      ) : courses.length === 0 ? (
        <Card className="p-10 text-center text-slate-400">No courses found.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((c) => (
            <Link key={c.id} to={`/lms/course/${c.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600">
                {c.thumbnailUrl ? (
                  <img src={c.thumbnailUrl} alt={c.title} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <MtandtLogo className="h-10 w-auto rounded shadow-sm" />
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Badge tone={diffTone[c.difficulty]}>{c.difficulty.toLowerCase()}</Badge>
                  {c.category && <span className="text-xs text-slate-400">{c.category.name}</span>}
                  {c.isFeatured && <Badge tone="violet">featured</Badge>}
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-blue-700">{c.title}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">{c.summary}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>{c.sectionCount} sections · {c.estimatedMinutes} min</span>
                  {c.myEnrollment && (
                    <Badge tone={c.myEnrollment.status === 'COMPLETED' ? 'green' : 'blue'}>
                      {c.myEnrollment.status === 'COMPLETED' ? 'Completed' : `${Math.round(c.myEnrollment.progressPercent)}%`}
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className={cn('text-lg font-bold leading-none text-slate-900')}>{value}</div>
        <div className="text-xs text-slate-400">{label}</div>
      </div>
    </div>
  );
}
