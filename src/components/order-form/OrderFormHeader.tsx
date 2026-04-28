import React from 'react';
import { ArrowLeft } from 'lucide-react';

export type OrderFormHeaderProps = {
  onBack: () => void;
  titleIcon: React.ReactNode;
  title: React.ReactNode;
  subtitle: React.ReactNode;
};

export function OrderFormHeader({ onBack, titleIcon, title, subtitle }: OrderFormHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={onBack}
        className="shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl transition-colors cursor-pointer"
      >
        <ArrowLeft size={20} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2 dark:text-gray-100">
          {titleIcon}
          {title}
        </h1>
        <div
          className={
            typeof subtitle === 'string'
              ? 'text-sm text-gray-500 mt-1 font-medium dark:text-gray-400'
              : 'mt-1'
          }
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}
