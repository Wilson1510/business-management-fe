import type { InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

const inputClassName =
  'w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-colors';

export type TableSearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>;

export function TableSearchInput(props: TableSearchInputProps) {
  return (
    <div className="relative flex-1 max-w-md">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        size={18}
        aria-hidden
      />
      <input type="text" className={inputClassName} {...props} />
    </div>
  );
}
