import { Plus } from 'lucide-react';

const baseClass =
  'text-sm font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer';

const toneClass = {
  indigo:
    'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40',
  emerald:
    'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40',
  primary: 'text-primary hover:text-primary/80 bg-primary/10',
} as const;

export type InlineAddItemTone = keyof typeof toneClass;

export function InlineAddItemButton({
  text,
  tone,
  onClick,
}: {
  text: string;
  tone: InlineAddItemTone;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`${baseClass} ${toneClass[tone]}`} onClick={onClick}>
      <Plus size={16} className="shrink-0" aria-hidden />
      {text}
    </button>
  );
}
