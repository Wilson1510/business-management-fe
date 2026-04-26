export type OrderFormSaveFooterProps = {
  saving: boolean;
  mode?: 'order' | 'shipment'
};

export function OrderFormSaveFooter({saving, mode='order'}: OrderFormSaveFooterProps) {
  return (
    <div className={`flex justify-end pt-4 ${mode === 'order' ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}>
      <button
        type="submit"
        disabled={saving}
        className="px-8 py-3 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-md shadow-primary/25 cursor-pointer disabled:opacity-70"
      >
        Save
      </button>
    </div>
  );
}
