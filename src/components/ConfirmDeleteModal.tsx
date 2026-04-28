import { Trash2 } from 'lucide-react';
import { ErrorAlert } from './ErrorAlert';
import { FormActionButton } from './FormActionButton';

export type ConfirmDeleteModalProps = {
  title: string;
  /** Shown in bold inside the warning sentence (e.g. category name, order number). */
  itemName: string;
  onCancel: () => void;
  onConfirm: () => void;
  errorMessage?: string | null;
  cancelLabel?: string;
  /** Primary destructive action when idle (default: "Hapus"). */
  confirmLabel?: string;
  /** Saat API hapus sedang berjalan. */
  deleting?: boolean;
};

export function ConfirmDeleteModal({
  title,
  itemName,
  onCancel,
  onConfirm,
  errorMessage,
  cancelLabel = 'Batal',
  confirmLabel = 'Hapus',
  deleting = false,
}: ConfirmDeleteModalProps) {
  const primaryText = deleting ? 'Menghapus...' : confirmLabel;

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
            Anda akan menghapus <span className="font-bold text-gray-900 dark:text-gray-100">{`${itemName}`}</span>.
            Aksi ini tidak dapat dibatalkan.
          </p>

          {errorMessage && <ErrorAlert message={errorMessage} variant="dialog" />}

          <fieldset disabled={deleting} className="flex gap-3 border-0 p-0 min-w-0 m-0">
            <FormActionButton
              variant="cancel"
              text={cancelLabel}
              onClick={onCancel}
              className="min-w-0 flex-1"
            />
            <FormActionButton
              variant="danger"
              text={primaryText}
              onClick={onConfirm}
              className="min-w-0 flex-1"
            />
          </fieldset>
        </div>
      </div>
    </div>
  );
}
