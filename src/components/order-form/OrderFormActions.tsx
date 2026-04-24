export type OrderFormActionsProps = {
  saving: boolean;
  showCancel: boolean;
  showConfirm: boolean;
  onRequestCancel: () => void;
  onRequestConfirm: () => void;
};

export function OrderFormActions({
  saving,
  showCancel,
  showConfirm,
  onRequestCancel,
  onRequestConfirm
}: OrderFormActionsProps) {
  if (!showCancel && !showConfirm) return null;

  return (
    <div className="flex gap-2.5">
      {showCancel && (
        <button
          type="button"
          disabled={saving}
          onClick={onRequestCancel}
          className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 rounded-xl transition-colors cursor-pointer dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-red-950/40 dark:hover:border-red-800 dark:hover:text-red-400"
        >
          Cancel
        </button>
      )}
      {showConfirm && (
        <button
          type="button"
          disabled={saving}
          onClick={onRequestConfirm}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
        >
          Confirm
        </button>
      )}
    </div>
  );
}
