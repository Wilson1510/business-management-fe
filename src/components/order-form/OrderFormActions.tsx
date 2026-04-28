import { FormActionButton } from '../FormActionButton';

export type OrderFormActionsProps = {
  showCancel: boolean;
  showConfirm: boolean;
  onRequestCancel: () => void;
  onRequestConfirm: () => void;
  /** Default: “Confirm” (e.g. sales order). */
  confirmLabel?: string;
};

export function OrderFormActions({
  showCancel,
  showConfirm,
  onRequestCancel,
  onRequestConfirm,
  confirmLabel = 'Konfirmasi',
}: OrderFormActionsProps) {
  if (!showCancel && !showConfirm) return null;

  const bothActions = showCancel && showConfirm;

  return (
    <div
      className={`flex gap-2.5 md:shrink-0 ${
        bothActions ? 'w-full justify-between md:w-auto md:justify-start' : 'w-full justify-start md:w-auto'
      }`}
    >
      {showCancel && (
        <FormActionButton variant="cancel" text="Batal" onClick={onRequestCancel} />
      )}
      {showConfirm && (
        <FormActionButton variant="success" text={confirmLabel} onClick={onRequestConfirm} />
      )}
    </div>
  );
}
