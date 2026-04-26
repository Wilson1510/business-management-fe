import { FormActionButton } from '../FormActionButton';

export type OrderFormActionsProps = {
  saving: boolean;
  showCancel: boolean;
  showConfirm: boolean;
  onRequestCancel: () => void;
  onRequestConfirm: () => void;
  /** Default: “Confirm” (e.g. sales order). */
  confirmLabel?: string;
};

export function OrderFormActions({
  saving,
  showCancel,
  showConfirm,
  onRequestCancel,
  onRequestConfirm,
  confirmLabel = 'Confirm',
}: OrderFormActionsProps) {
  if (!showCancel && !showConfirm) return null;

  return (
    <div className="flex gap-2.5">
      {showCancel && (
        <FormActionButton
          variant="cancel"
          text="Cancel"
          disabled={saving}
          onClick={onRequestCancel}
        />
      )}
      {showConfirm && (
        <FormActionButton
          variant="success"
          text={confirmLabel}
          disabled={saving}
          onClick={onRequestConfirm}
        />
      )}
    </div>
  );
}
