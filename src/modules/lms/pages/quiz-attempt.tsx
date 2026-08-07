import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Award, CheckCircle2, ClipboardCheck, RotateCcw, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge, Button, Card, Spinner } from '@/components/ui/primitives';

interface QuizInfo {
  id: string;
  title: string;
  description?: string | null;
  passPercentage: number;
  questionCount: number;
  attemptsUsed: number;
  attemptsLeft: number | null;
  bestScore: number | null;
  passed: boolean;
  inProgressAttemptId: string | null;
  course?: { slug: string; title: string } | null;
}
interface AttemptQuestion { id: string; type: string; text: string; points: number; options: { id: string; text: string }[] }
interface StartData { attemptId: string; quiz: { title: string; passPercentage: number }; questions: AttemptQuestion[] }
interface ReviewItem {
  questionId: string;
  text: string;
  type: string;
  explanation?: string | null;
  isCorrect: boolean;
  yourOptionIds: string[];
  correctOptionIds: string[];
  options: { id: string; text: string; isCorrect: boolean }[];
}
interface ResultData {
  attempt: { score: number; passed: boolean };
  totalQuestions: number;
  correctCount: number;
  certificate?: { certificateNo: string } | null;
  review: ReviewItem[] | null;
  quiz: { title: string; courseSlug?: string | null };
}

const isMulti = (t: string) => t === 'MULTIPLE_SELECT';

export default function QuizAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'intro' | 'taking' | 'result'>('intro');
  const [info, setInfo] = useState<QuizInfo | null>(null);
  const [start, setStart] = useState<StartData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/lms/quizzes/${id}`).then((r) => setInfo(r.data.data)).finally(() => setLoading(false));
  }, [id]);

  async function beginAttempt() {
    setBusy(true);
    try {
      const r = await api.post(`/lms/quizzes/${id}/attempts`, {});
      setStart(r.data.data);
      setAnswers({});
      setMode('taking');
    } finally {
      setBusy(false);
    }
  }

  function pick(q: AttemptQuestion, optionId: string) {
    setAnswers((cur) => {
      const prev = cur[q.id] ?? [];
      if (isMulti(q.type)) {
        return { ...cur, [q.id]: prev.includes(optionId) ? prev.filter((x) => x !== optionId) : [...prev, optionId] };
      }
      return { ...cur, [q.id]: [optionId] };
    });
  }

  async function submit() {
    if (!start) return;
    setBusy(true);
    try {
      const payload = { answers: start.questions.map((q) => ({ questionId: q.id, selectedOptionIds: answers[q.id] ?? [] })) };
      const r = await api.post(`/lms/quizzes/attempts/${start.attemptId}/submit`, payload);
      setResult(r.data.data);
      setMode('result');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="py-16 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>;
  if (!info) return <div className="py-16 text-center text-slate-500">Quiz not found.</div>;

  const backLink = info.course ? `/lms/course/${info.course.slug}` : '/lms';

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (mode === 'intro') {
    return (
      <div className="mx-auto max-w-2xl">
        <Link to={backLink} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <Card className="p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-600 text-white">
            <ClipboardCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">{info.title}</h1>
          {info.description && <p className="mt-1 text-sm text-slate-500">{info.description}</p>}
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
            <Badge tone="slate">{info.questionCount} questions</Badge>
            <Badge tone="blue">Pass ≥ {info.passPercentage}%</Badge>
            {info.attemptsLeft !== null && <Badge tone="amber">{info.attemptsLeft} attempts left</Badge>}
            {info.passed && <Badge tone="green">Passed · best {info.bestScore}%</Badge>}
          </div>
          <div className="mt-6">
            <Button size="lg" loading={busy} disabled={info.attemptsLeft === 0} onClick={beginAttempt}>
              {info.inProgressAttemptId ? 'Resume attempt' : info.attemptsUsed > 0 ? 'Retake quiz' : 'Start quiz'}
            </Button>
            {info.attemptsLeft === 0 && <p className="mt-2 text-xs text-red-500">No attempts remaining.</p>}
          </div>
        </Card>
      </div>
    );
  }

  // ── Taking ─────────────────────────────────────────────────────────────────
  if (mode === 'taking' && start) {
    const answeredCount = start.questions.filter((q) => (answers[q.id] ?? []).length > 0).length;
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">{start.quiz.title}</h1>
          <span className="text-sm text-slate-500">{answeredCount}/{start.questions.length} answered</span>
        </div>
        <div className="space-y-4">
          {start.questions.map((q, i) => (
            <Card key={q.id} className="p-5">
              <div className="mb-3 flex items-start gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{i + 1}</span>
                <p className="font-medium text-slate-800">{q.text}</p>
                {isMulti(q.type) && <Badge tone="violet">select all</Badge>}
              </div>
              <div className="space-y-2 pl-8">
                {q.options.map((o) => {
                  const selected = (answers[q.id] ?? []).includes(o.id);
                  return (
                    <button
                      key={o.id}
                      onClick={() => pick(q, o.id)}
                      className={cn('flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors', selected ? 'border-indigo-400 bg-indigo-50 text-indigo-800' : 'border-slate-200 hover:bg-slate-50')}
                    >
                      <span className={cn('grid h-4 w-4 place-items-center rounded-full border', isMulti(q.type) ? 'rounded' : '', selected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300')}>
                        {selected && <CheckCircle2 className="h-3 w-3" />}
                      </span>
                      {o.text}
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button size="lg" loading={busy} onClick={submit}>Submit quiz</Button>
        </div>
      </div>
    );
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (mode === 'result' && result) {
    const passed = result.attempt.passed;
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="overflow-hidden">
          <div className={cn('p-8 text-center text-white', passed ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-rose-500 to-red-600')}>
            {passed ? <Award className="mx-auto h-12 w-12" /> : <XCircle className="mx-auto h-12 w-12" />}
            <h1 className="mt-3 text-3xl font-bold">{result.attempt.score}%</h1>
            <p className="mt-1 text-white/90">{passed ? 'Passed — well done!' : 'Not passed yet'}</p>
            <p className="mt-1 text-sm text-white/70">{result.correctCount} of {result.totalQuestions} correct</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 p-5">
            <Button variant="outline" onClick={() => { setResult(null); setMode('intro'); api.get(`/lms/quizzes/${id}`).then((r) => setInfo(r.data.data)); }}>
              <RotateCcw className="h-4 w-4" /> Try again
            </Button>
            {result.certificate && (
              <Link to={`/lms/certificates/${result.certificate.certificateNo}`}><Button><Award className="h-4 w-4" /> View certificate</Button></Link>
            )}
            <Button variant="secondary" onClick={() => navigate(backLink)}>Back to course</Button>
          </div>
        </Card>

        {result.review && (
          <div className="mt-6 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Review</h2>
            {result.review.map((r, i) => (
              <Card key={r.questionId} className="p-4">
                <div className="mb-2 flex items-start gap-2">
                  {r.isCorrect ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" /> : <XCircle className="mt-0.5 h-4 w-4 text-red-500" />}
                  <p className="font-medium text-slate-800">{i + 1}. {r.text}</p>
                </div>
                <div className="space-y-1 pl-6">
                  {r.options.map((o) => {
                    const yours = r.yourOptionIds.includes(o.id);
                    return (
                      <div key={o.id} className={cn('flex items-center gap-2 rounded-md px-2 py-1 text-sm', o.isCorrect ? 'bg-emerald-50 text-emerald-800' : yours ? 'bg-red-50 text-red-700' : 'text-slate-600')}>
                        {o.isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : yours ? <XCircle className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5" />}
                        {o.text}
                        {yours && <span className="ml-auto text-xs opacity-70">your answer</span>}
                      </div>
                    );
                  })}
                  {r.explanation && <p className="mt-1 text-xs italic text-slate-500">{r.explanation}</p>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
