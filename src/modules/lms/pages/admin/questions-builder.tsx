import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { apiErrorMessage } from '@/lib/utils';
import { Badge, Button, Card, Input, Label, Select, Spinner, Textarea } from '@/components/ui/primitives';
import { Dialog } from '@/components/ui/dialog';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface Option { id?: string; text: string; isCorrect: boolean }
interface Question { id: string; type: string; text: string; points: number; explanation?: string | null; options: Option[] }

const MULTI = 'MULTIPLE_SELECT';

export function QuestionsBuilder({ quizId }: { quizId: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ question: Question | null } | null>(null);
  const [error, setError] = useState('');
  const { confirm, confirmNode } = useConfirm();

  const load = useCallback(async () => {
    const res = await api.get(`/lms/quizzes/${quizId}/full`);
    setQuestions(res.data.data.questions);
    setLoading(false);
  }, [quizId]);
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

  const move = (idx: number, dir: number) => {
    const arr = [...questions];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j]!, arr[idx]!];
    void run(() => api.put(`/lms/quizzes/${quizId}/questions/reorder`, { questionIds: arr.map((q) => q.id) }));
  };

  if (loading) return <div className="py-10 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></div>;

  return (
    <div>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="space-y-3">
        {questions.map((q, i) => (
          <Card key={q.id} className="p-4">
            <div className="flex flex-wrap items-start gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800">{q.text}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <Badge tone="slate">{q.type.replace('_', ' ').toLowerCase()}</Badge>
                  <span>{q.points} pt{q.points > 1 ? 's' : ''}</span>
                  <span>· {q.options.length} options · {q.options.filter((o) => o.isCorrect).length} correct</span>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}><ChevronUp className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === questions.length - 1}><ChevronDown className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" title="Edit" onClick={() => setDialog({ question: q })}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" title="Delete" onClick={() => confirm({ title: `Delete question ${i + 1}?`, message: 'This permanently removes the question and its options.', onConfirm: () => run(() => api.delete(`/lms/questions/${q.id}`)) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </Card>
        ))}
        {questions.length === 0 && <Card className="p-8 text-center text-sm text-slate-400">No questions yet. Add the first one.</Card>}
      </div>

      <div className="mt-4">
        <Button variant="secondary" onClick={() => setDialog({ question: null })}><Plus className="h-4 w-4" /> Add question</Button>
      </div>

      {dialog && (
        <QuestionDialog
          quizId={quizId}
          question={dialog.question}
          onClose={() => setDialog(null)}
          onSaved={() => { setDialog(null); void load(); }}
        />
      )}
      {confirmNode}
    </div>
  );
}

function QuestionDialog({ quizId, question, onClose, onSaved }: { quizId: string; question: Question | null; onClose: () => void; onSaved: () => void }) {
  const isNew = !question;
  const [type, setType] = useState(question?.type ?? 'MCQ');
  const [text, setText] = useState(question?.text ?? '');
  const [points, setPoints] = useState(question?.points ?? 1);
  const [explanation, setExplanation] = useState(question?.explanation ?? '');
  const [options, setOptions] = useState<Option[]>(question?.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })) ?? [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
  ]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function changeType(t: string) {
    setType(t);
    if (t === 'TRUE_FALSE') {
      setOptions([{ text: 'True', isCorrect: true }, { text: 'False', isCorrect: false }]);
    }
  }
  function setText_(i: number, v: string) {
    setOptions((cur) => cur.map((o, idx) => (idx === i ? { ...o, text: v } : o)));
  }
  function setCorrect(i: number) {
    setOptions((cur) => (type === MULTI ? cur.map((o, idx) => (idx === i ? { ...o, isCorrect: !o.isCorrect } : o)) : cur.map((o, idx) => ({ ...o, isCorrect: idx === i }))));
  }
  const addOption = () => setOptions((cur) => [...cur, { text: '', isCorrect: false }]);
  const removeOption = (i: number) => setOptions((cur) => (cur.length <= 2 ? cur : cur.filter((_, idx) => idx !== i)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (options.some((o) => !o.text.trim())) return setError('Every option needs text');
    if (!options.some((o) => o.isCorrect)) return setError('Mark at least one option correct');
    setSaving(true);
    setError('');
    try {
      const body = { type, text, points, explanation: explanation || null, options: options.map((o) => ({ text: o.text.trim(), isCorrect: o.isCorrect })) };
      if (isNew) await api.post(`/lms/quizzes/${quizId}/questions`, body);
      else await api.patch(`/lms/questions/${question!.id}`, body);
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
      setSaving(false);
    }
  }

  const isTrueFalse = type === 'TRUE_FALSE';

  return (
    <Dialog
      open
      onClose={onClose}
      title={isNew ? 'Add question' : 'Edit question'}
      className="max-w-xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button form="q-form" type="submit" loading={saving}>{isNew ? 'Add question' : 'Save question'}</Button>
        </>
      }
    >
      <form id="q-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <Label>Type</Label>
            <Select value={type} onChange={(e) => changeType(e.target.value)}>
              <option value="MCQ">Single choice (MCQ)</option>
              <option value="MULTIPLE_SELECT">Multiple select</option>
              <option value="TRUE_FALSE">True / False</option>
              <option value="SCENARIO">Scenario</option>
            </Select>
          </div>
          <div>
            <Label>Points</Label>
            <Input type="number" min={1} value={points} onChange={(e) => setPoints(Number(e.target.value))} className="w-24" />
          </div>
        </div>
        <div>
          <Label>Question</Label>
          <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} required />
        </div>

        <div>
          <Label>Options {type === MULTI ? '(tick all correct)' : '(pick the correct one)'}</Label>
          <div className="space-y-2">
            {options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrect(i)}
                  title="Mark correct"
                  className={`grid h-6 w-6 shrink-0 place-items-center border ${type === MULTI ? 'rounded' : 'rounded-full'} ${o.isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'}`}
                >
                  {o.isCorrect && <span className="text-xs">✓</span>}
                </button>
                <Input value={o.text} onChange={(e) => setText_(i, e.target.value)} disabled={isTrueFalse} placeholder={`Option ${i + 1}`} />
                {!isTrueFalse && options.length > 2 && (
                  <button type="button" onClick={() => removeOption(i)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"><X className="h-4 w-4" /></button>
                )}
              </div>
            ))}
          </div>
          {!isTrueFalse && (
            <Button type="button" size="sm" variant="ghost" className="mt-2" onClick={addOption}><Plus className="h-4 w-4" /> Add option</Button>
          )}
        </div>

        <div>
          <Label>Explanation (shown in review, optional)</Label>
          <Input value={explanation} onChange={(e) => setExplanation(e.target.value)} />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>
    </Dialog>
  );
}
