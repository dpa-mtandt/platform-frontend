import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { apiErrorMessage, cn } from '@/lib/utils';
import { Badge, Button, Card, Input, Label, Select, Spinner, Textarea } from '@/components/ui/primitives';
import { CurriculumBuilder } from './curriculum-builder';

export default function CourseEditor() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isNew = !slug;

  const [tab, setTab] = useState<'details' | 'curriculum'>(params.get('tab') === 'curriculum' ? 'curriculum' : 'details');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const [courseId, setCourseId] = useState('');
  const [savedSlug, setSavedSlug] = useState<string | null>(slug ?? null);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('BEGINNER');
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [isFeatured, setIsFeatured] = useState(false);

  useEffect(() => {
    api.get('/lms/categories').then((r) => setCategories(r.data.data));
  }, []);

  useEffect(() => {
    if (!slug) return;
    api.get(`/lms/courses/${slug}`).then((r) => {
      const c = r.data.data;
      setCourseId(c.id);
      setSavedSlug(c.slug);
      setStatus(c.status);
      setTitle(c.title);
      setSummary(c.summary ?? '');
      setDescription(c.description ?? '');
      setCategoryId(c.categoryId ?? '');
      setDifficulty(c.difficulty);
      setEstimatedMinutes(c.estimatedMinutes);
      setIsFeatured(c.isFeatured);
    }).finally(() => setLoading(false));
  }, [slug]);

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMsg('');
    try {
      const body = { title, summary: summary || null, description: description || null, categoryId: categoryId || null, difficulty, estimatedMinutes, isFeatured };
      if (isNew) {
        const res = await api.post('/lms/courses', body);
        const c = res.data.data;
        setCourseId(c.id);
        setSavedSlug(c.slug);
        setStatus(c.status);
        setTab('curriculum');
        navigate(`/lms/manage/courses/${c.slug}/edit?tab=curriculum`, { replace: true });
      } else {
        await api.patch(`/lms/courses/${courseId}`, body);
        setMsg('Saved');
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish() {
    const next = status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await api.patch(`/lms/courses/${courseId}`, { status: next });
      setStatus(next);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  if (loading) return <div className="py-16 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/lms/manage/courses" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Manage Courses
      </Link>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isNew ? 'New course' : title || 'Edit course'}</h1>
        {!isNew && (
          <div className="flex items-center gap-2">
            <Badge tone={status === 'PUBLISHED' ? 'green' : 'amber'}>{status}</Badge>
            <Button variant="outline" size="sm" onClick={togglePublish}>
              {status === 'PUBLISHED' ? <><EyeOff className="h-4 w-4" /> Unpublish</> : <><Eye className="h-4 w-4" /> Publish</>}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-slate-200">
        {(['details', 'curriculum'] as const).map((t) => (
          <button
            key={t}
            onClick={() => t === 'curriculum' && !savedSlug ? undefined : setTab(t)}
            className={cn('-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize', tab === t ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700', t === 'curriculum' && !savedSlug ? 'cursor-not-allowed opacity-40' : '')}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'details' ? (
        <Card className="p-6">
          <form onSubmit={saveDetails} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <Label>Summary</Label>
              <Input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="One-line summary shown on cards" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Category</Label>
                <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">— None —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </Select>
              </div>
              <div>
                <Label>Est. minutes</Label>
                <Input type="number" min={0} value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(Number(e.target.value))} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="rounded border-slate-300" />
              Feature this course on the catalog
            </label>
            <div className="flex items-center gap-3">
              <Button type="submit" loading={saving}><Save className="h-4 w-4" /> {isNew ? 'Create & add content' : 'Save details'}</Button>
              {msg && <span className="text-sm text-emerald-600">{msg}</span>}
              {error && <span className="text-sm text-red-600">{error}</span>}
            </div>
          </form>
        </Card>
      ) : savedSlug ? (
        <CurriculumBuilder slug={savedSlug} />
      ) : (
        <Card className="p-8 text-center text-sm text-slate-500">Save the course details first to build its curriculum.</Card>
      )}
    </div>
  );
}
