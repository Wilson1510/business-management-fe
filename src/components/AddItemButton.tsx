import { Plus } from 'lucide-react';

const baseClass =
  'flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm shadow-primary/20';

export function AddItemButton({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button type="button" className={baseClass} onClick={onClick}>
      <Plus size={18} className="shrink-0" aria-hidden />
      {text}
    </button>
  );
}
