import { CheckCircle2, CircleX } from 'lucide-react';
import { ErrorAlert } from '../ErrorAlert';
import { FormActionButton } from '../FormActionButton';

export type OrderActionDialogProps = {
  action: 'confirm' | 'cancel' | null;
  orderNumber: string | null;
  saving: boolean;
  actionError: string | null;
  /** Text after the quoted number on confirm, e.g. workflow consequence. */
  confirmDetail: string;
  onClose: () => void;
  onSubmit: () => void;
  mode?: 'order' | 'delivery' | 'receipt';
};

const PRIMARY_WHILE_SAVING = {
  cancel: 'Membatalkan',
  order: 'Mengkonfirmasi',
  delivery: 'Menyelesaikan',
  receipt: 'Menyelesaikan',
};

const PRIMARY_BUTTON_LABEL = {
  cancel: 'Batalkan',
  order: 'Konfirmasi',
  delivery: 'Selesaikan',
  receipt: 'Selesaikan',
};

const MODE_TRANSLATION = {
  order: 'pesanan',
  delivery: 'pengiriman',
  receipt: 'penerimaan',
}

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
  const savingKey = isConfirm ? mode : 'cancel';
  const title = `${PRIMARY_BUTTON_LABEL[savingKey]} ${MODE_TRANSLATION[mode]} ini?`;
  const primaryLabel = saving ? PRIMARY_WHILE_SAVING[savingKey] : PRIMARY_BUTTON_LABEL[savingKey];

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
            <span className="capitalize">{PRIMARY_BUTTON_LABEL[savingKey]}</span> <span className="font-bold text-gray-900 dark:text-gray-100">
              &quot;{orderNumber}&quot;
            </span> ? {action === 'confirm' ? confirmDetail : ''}
          </p>

          {actionError && <ErrorAlert message={actionError} variant="dialog" />}

          <fieldset disabled={saving} className="flex gap-3 border-0 p-0 min-w-0 m-0">
            <FormActionButton variant="cancel" text="Kembali" onClick={onClose} className="min-w-0 flex-1" />
            <FormActionButton
              variant={isConfirm ? 'success' : 'danger'}
              text={primaryLabel}
              onClick={onSubmit}
              className="min-w-0 flex-1"
            />
          </fieldset>
        </div>
      </div>
    </div>
  );
}
