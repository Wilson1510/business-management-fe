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
        className="p-2 text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors cursor-pointer"
      >
        <ArrowLeft size={20} />
      </button>
      <div>
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
