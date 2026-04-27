export type PartyOption = { id: number; name: string };

export type OrderFormPartyDateSectionProps = {
  isOrderLocked: boolean;
  partyLabel: string;
  partyPlaceholder: string;
  partyValue: number;
  partyOptions: PartyOption[];
  onPartyChange: (partyId: number) => void;
  dateLabel: string;
  dateValue: string;
  onDateChange: (isoDate: string) => void;
};

const fieldClass =
  'w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100 disabled:opacity-60';

export function OrderFormPartyDateSection({
  isOrderLocked,
  partyLabel,
  partyPlaceholder,
  partyValue,
  partyOptions,
  onPartyChange,
  dateLabel,
  dateValue,
  onDateChange
}: OrderFormPartyDateSectionProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-gray-50/50 rounded-2xl border border-gray-100 dark:border-gray-700 dark:bg-gray-900/20">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {partyLabel}
        </label>
        <select
          required={!isOrderLocked}
          disabled={isOrderLocked}
          value={partyValue || ''}
          onChange={e => onPartyChange(Number(e.target.value))}
          className={fieldClass}
        >
          <option value="" disabled hidden>
            {partyPlaceholder}
          </option>
          {partyOptions.map(o => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{dateLabel}</label>
        <input
          type="date"
          required={!isOrderLocked}
          disabled={isOrderLocked}
          value={dateValue}
          onChange={e => onDateChange(e.target.value)}
          className={fieldClass}
        />
      </div>
    </section>
  );
}
