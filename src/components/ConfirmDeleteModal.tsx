import { Trash2 } from 'lucide-react';
import { ErrorAlert } from './ErrorAlert';

export type ConfirmDeleteModalProps = {
  title: string;
  /** Shown in bold inside the warning sentence (e.g. category name, order number). */
  itemName: string;
  onCancel: () => void;
  onConfirm: () => void;
  errorMessage?: string | null;
  cancelLabel?: string;
  /** Primary destructive action (default: "Delete Item"). */
  confirmLabel?: string;
};

export function ConfirmDeleteModal({
  title,
  itemName,
  onCancel,
  onConfirm,
  errorMessage,
  cancelLabel = 'Cancel',
  confirmLabel = 'Delete Item',
}: ConfirmDeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700"
      >
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-6 text-red-500 dark:text-red-400">
            <Trash2 size={28} />
          </div>
          <h3 id="confirm-delete-title" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            You are about to delete <span className="font-bold text-gray-900 dark:text-gray-100">{`"${itemName}"`}</span>.
            This action is permanent and cannot be reversed.
          </p>

          {errorMessage && <ErrorAlert message={errorMessage} variant="dialog" />}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-colors cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-600/20 cursor-pointer"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
