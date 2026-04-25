import { CheckCircle2, CircleX } from 'lucide-react';
import { ErrorAlert } from '../ErrorAlert';

export type OrderActionDialogProps = {
  action: 'confirm' | 'cancel' | null;
  orderNumber: string | null;
  saving: boolean;
  actionError: string | null;
  /** Text after the quoted number on confirm, e.g. workflow consequence. */
  confirmDetail: string;
  onClose: () => void;
  onSubmit: () => void;
  mode?: 'order' | 'delivery';
};

export function OrderActionDialog({
  action,
  orderNumber,
  saving,
  actionError,
  confirmDetail,
  onClose,
  onSubmit,
  mode = 'order'
}: OrderActionDialogProps) {

  const isConfirm = action === 'confirm';
  const title = `${action} this ${mode}?`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-action-title"
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700"
      >
        <div className="p-8 text-center">
          {isConfirm ? (
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-6 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={28} />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-6 text-red-500 dark:text-red-400">
              <CircleX size={28} />
            </div>
          )}
          <h3 id="order-action-title" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 capitalize">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            <span className="capitalize">{action}</span> <span className="font-bold text-gray-900 dark:text-gray-100">
              &quot;{orderNumber}&quot;
            </span> ? {action === 'confirm' ? confirmDetail : 'This cannot be undone from this screen.'}
          </p>

          {actionError && <ErrorAlert message={actionError} variant="dialog" />}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-colors cursor-pointer disabled:opacity-60"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={saving}
              className={
                isConfirm
                  ? 'flex-1 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-70'
                  : 'flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-600/20 cursor-pointer disabled:opacity-70'
              }
            >
              {saving ? 'Working…' : 'Yes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
