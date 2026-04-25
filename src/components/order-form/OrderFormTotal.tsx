export type OrderFormTotalProps = {
  label: string;
  amountDisplay: string;
};

export function OrderFormTotal({ label, amountDisplay }: OrderFormTotalProps) {
  return (
    <div className="flex justify-end pt-4 mb-4">
      <div className="bg-gray-50 border border-gray-200 rounded-2xl px-8 py-4 text-right min-w-[200px] dark:bg-gray-800/50 dark:border-gray-700">
        <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-1 dark:text-gray-400">
          {label}
        </p>
        <p className="text-2xl font-bold text-primary tabular-nums">{amountDisplay}</p>
      </div>
    </div>
  );
}
