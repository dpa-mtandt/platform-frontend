import { useCallback, useState, type ReactNode } from 'react';
import { Button } from './primitives';
import { Dialog } from './dialog';

interface ConfirmOptions {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
}

/**
 * Reusable async confirm. Returns `confirm(opts)` to trigger a modal and `confirmNode`
 * to render once in the component. The confirm button shows a spinner while the
 * `onConfirm` promise resolves, and the dialog can't be dismissed mid-action.
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmOptions | null>(null);
  const [loading, setLoading] = useState(false);

  const confirm = useCallback((opts: ConfirmOptions) => setState(opts), []);

  const confirmNode = state ? (
    <Dialog
      open
      onClose={() => !loading && setState(null)}
      title={state.title}
      className="max-w-md"
      footer={
        <>
          <Button variant="outline" disabled={loading} onClick={() => setState(null)}>Cancel</Button>
          <Button
            variant={state.danger === false ? 'primary' : 'danger'}
            loading={loading}
            onClick={async () => {
              setLoading(true);
              try {
                await state.onConfirm();
                setState(null);
              } finally {
                setLoading(false);
              }
            }}
          >
            {state.confirmLabel ?? 'Delete'}
          </Button>
        </>
      }
    >
      {state.message && <div className="text-sm text-slate-600">{state.message}</div>}
    </Dialog>
  ) : null;

  return { confirm, confirmNode };
}
