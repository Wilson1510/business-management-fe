export type OrderFormSaveFooterProps = {
  saving: boolean;
  saveLabel?: string;
  savingLabel?: string;
};

export function OrderFormSaveFooter({
  saving,
  saveLabel = 'Save Draft Request',
  savingLabel = 'Saving...'
}: OrderFormSaveFooterProps) {
  return (
    <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-gray-700">
      <button
        type="submit"
        disabled={saving}
        className="px-8 py-3 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-md shadow-primary/25 cursor-pointer disabled:opacity-70"
      >
        {saving ? savingLabel : saveLabel}
      </button>
    </div>
  );
}
