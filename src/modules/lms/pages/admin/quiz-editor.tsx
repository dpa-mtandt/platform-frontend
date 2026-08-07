import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { apiErrorMessage, cn } from '@/lib/utils';
import { Badge, Button, Card, Input, Label, Select, Spinner, Textarea } from '@/components/ui/primitives';
import { QuestionsBuilder } from './questions-builder';

export default function QuizEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isNew = !id;

  const [tab, setTab] = useState<'settings' | 'questions'>(params.get('tab') === 'questions' ? 'questions' : 'settings');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const [savedId, setSavedId] = useState<string | null>(id ?? null);
  const [isPublished, setIsPublished] = useState(false);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [passPercentage, setPassPercentage] = useState(70);
  const [durationMinutes, setDurationMinutes] = useState('');
  const [maxAttempts, setMaxAttempts] = useState('');
  const [randomize, setRandomize] = useState(false);
  const [showAnswers, setShowAnswers] = useState(true);

  useEffect(() => {
    api.get('/lms/courses?limit=50').then((r) => setCourses(r.data.data));
  }, []);

  useEffect(() => {
    if (!id) return;
    api.get(`/lms/quizzes/${id}/full`).then((r) => {
      const q = r.data.data;
      setSavedId(q.id);
      setIsPublished(q.isPublished);
      setTitle(q.title);
      setDescription(q.description ?? '');
      setCourseId(q.courseId ?? '');
      setPassPercentage(q.passPercentage);
      setDurationMinutes(q.durationMinutes?.toString() ?? '');
      setMaxAttempts(q.maxAttempts?.toString() ?? '');
      setRandomize(q.randomize);
      setShowAnswers(q.showAnswers);
    }).finally(() => setLoading(false));
  }, [id]);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMsg('');
    try {
      const body = {
        title,
        description: description || null,
        courseId: courseId || null,
        passPercentage,
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        maxAttempts: maxAttempts ? Number(maxAttempts) : null,
        randomize,
        showAnswers,
      };
      if (isNew) {
        const res = await api.post('/lms/quizzes', body);
        const q = res.data.data;
        setSavedId(q.id);
        setIsPublished(q.isPublished);
        setTab('questions');
        navigate(`/lms/manage/quizzes/${q.id}/edit?tab=questions`, { replace: true });
      } else {
        await api.patch(`/lms/quizzes/${savedId}`, body);
        setMsg('Saved');
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish() {
    try {
      await api.patch(`/lms/quizzes/${savedId}`, { isPublished: !isPublished });
      setIsPublished((v) => !v);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  if (loading) return <div className="py-16 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/lms/manage/quizzes" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Manage Quizzes
      </Link>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isNew ? 'New quiz' : title || 'Edit quiz'}</h1>
        {!isNew && (
          <div className="flex items-center gap-2">
            <Badge tone={isPublished ? 'green' : 'amber'}>{isPublished ? 'PUBLISHED' : 'DRAFT'}</Badge>
            <Button variant="outline" size="sm" onClick={togglePublish}>
              {isPublished ? <><EyeOff className="h-4 w-4" /> Unpublish</> : <><Eye className="h-4 w-4" /> Publish</>}
            </Button>
          </div>
        )}
      </div>

      <div className="mb-5 flex gap-1 border-b border-slate-200">
        {(['settings', 'questions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => (t === 'questions' && !savedId ? undefined : setTab(t))}
            className={cn('-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize', tab === t ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700', t === 'questions' && !savedId ? 'cursor-not-allowed opacity-40' : '')}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'settings' ? (
        <Card className="p-6">
          <form onSubmit={saveSettings} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Attached course</Label>
                <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                  <option value="">— Standalone —</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </Select>
              </div>
              <div>
                <Label>Pass mark (%)</Label>
                <Input type="number" min={0} max={100} value={passPercentage} onChange={(e) => setPassPercentage(Number(e.target.value))} />
              </div>
              <div>
                <Label>Time limit (min, optional)</Label>
                <Input type="number" min={1} value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="No limit" />
              </div>
              <div>
                <Label>Max attempts (optional)</Label>
                <Input type="number" min={1} value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} placeholder="Unlimited" />
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={randomize} onChange={(e) => setRandomize(e.target.checked)} className="rounded border-slate-300" />
                Randomize question order
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={showAnswers} onChange={(e) => setShowAnswers(e.target.checked)} className="rounded border-slate-300" />
                Show answers in review
              </label>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" loading={saving}><Save className="h-4 w-4" /> {isNew ? 'Create & add questions' : 'Save settings'}</Button>
              {msg && <span className="text-sm text-emerald-600">{msg}</span>}
              {error && <span className="text-sm text-red-600">{error}</span>}
            </div>
          </form>
        </Card>
      ) : savedId ? (
        <QuestionsBuilder quizId={savedId} />
      ) : (
        <Card className="p-8 text-center text-sm text-slate-500">Save the quiz settings first to add questions.</Card>
      )}
    </div>
  );
}
