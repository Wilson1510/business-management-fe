import type { ButtonHTMLAttributes } from 'react';
import { Trash2 } from 'lucide-react';

export type DeleteIconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'type' | 'className'
>;

const buttonClass =
  'p-1.5 rounded-lg transition-colors cursor-pointer text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20';

export function DeleteIconButton(props: DeleteIconButtonProps) {
  return (
    <button type="button" className={buttonClass} {...props}>
      <Trash2 size={18} />
    </button>
  );
}
