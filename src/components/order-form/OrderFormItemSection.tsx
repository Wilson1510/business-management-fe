import type { ReactNode } from 'react';

export type OrderFormItemSectionProps = {
  title: string;
  /** e.g. “Add Product” on sales order; omitted for delivery. */
  headerRight?: ReactNode;
  children: ReactNode;
};

/** Shared shell: left accent title row + white bordered content (matches Order line items / delivery physical check). */
export function OrderFormItemSection({ title, headerRight, children }: OrderFormItemSectionProps) {
  return (
    <section className="space-y-4 mb-2">
      <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-700 pb-3">
        <div className="border-l-4 border-primary pl-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        {headerRight}
      </div>
      <div className="border border-gray-200 rounded-xl bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900/30">
        {children}
      </div>
    </section>
  );
}
