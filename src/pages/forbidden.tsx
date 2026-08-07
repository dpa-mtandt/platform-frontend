import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/primitives';

export default function Forbidden() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-500">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="mt-4 text-xl font-semibold text-slate-900">Access denied</h1>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        You don't have permission to view this area. If you believe this is a mistake, contact your administrator.
      </p>
      <Link to="/" className="mt-5">
        <Button variant="outline">Back to home</Button>
      </Link>
    </div>
  );
}
