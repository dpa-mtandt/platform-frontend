import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { apiErrorMessage } from '@/lib/utils';
import { Badge, Button, Card, Spinner } from '@/components/ui/primitives';
import { Dialog } from '@/components/ui/dialog';

interface QuizRow {
  id: string;
  title: string;
  isPublished: boolean;
  passPercentage: number;
  course?: { title: string } | null;
  questionCount: number;
  attemptCount: number;
}

export default function ManageQuizzes() {
  const [rows, setRows] = useState<QuizRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<QuizRow | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/lms/quizzes/manage');
      setRows(res.data.data);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function togglePublish(q: QuizRow) {
    setError('');
    try {
      await api.patch(`/lms/quizzes/${q.id}`, { isPublished: !q.isPublished });
      void load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manage Quizzes</h1>
          <p className="text-sm text-slate-500">Build assessments and attach them to courses.</p>
        </div>
        <Link to="/lms/manage/quizzes/new"><Button><Plus className="h-4 w-4" /> New quiz</Button></Link>
      </div>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Quiz</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Questions</th>
                <th className="px-4 py-3">Attempts</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center"><Spinner className="mx-auto h-6 w-6 text-slate-300" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400">No quizzes yet.</td></tr>
              ) : (
                rows.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{q.title}</div>
                      <div className="text-xs text-slate-400">Pass ≥ {q.passPercentage}%</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{q.course?.title ?? <span className="text-slate-400">Standalone</span>}</td>
                    <td className="px-4 py-3"><Badge tone={q.isPublished ? 'green' : 'amber'}>{q.isPublished ? 'PUBLISHED' : 'DRAFT'}</Badge></td>
                    <td className="px-4 py-3 text-slate-600">{q.questionCount}</td>
                    <td className="px-4 py-3 text-slate-600">{q.attemptCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" title={q.isPublished ? 'Unpublish' : 'Publish'} onClick={() => togglePublish(q)}>
                          {q.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Link to={`/lms/manage/quizzes/${q.id}/edit`}><Button size="icon" variant="ghost" title="Edit"><Pencil className="h-4 w-4" /></Button></Link>
                        <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" title="Delete" onClick={() => setDeleting(q)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {deleting && (
        <Dialog
          open
          onClose={() => setDeleting(null)}
          title={`Delete "${deleting.title}"?`}
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="danger" onClick={async () => { await api.delete(`/lms/quizzes/${deleting.id}`); setDeleting(null); void load(); }}>Delete quiz</Button>
            </>
          }
        >
          <p className="text-sm text-slate-600">This permanently deletes the quiz, its questions and all attempts.</p>
        </Dialog>
      )}
    </div>
  );
}
