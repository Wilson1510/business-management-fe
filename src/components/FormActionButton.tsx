export type FormActionVariant = 'cancel' | 'primary' | 'success' | 'danger';

const size =
  'inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap text-sm font-bold';

const variantClass: Record<FormActionVariant, string> = {
  cancel: `${size} px-5 text-gray-700 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 rounded-xl transition-colors cursor-pointer dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-red-950/40 dark:hover:border-red-800 dark:hover:text-red-400 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none`,
  primary: `${size} px-6 text-white bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-md shadow-primary/25 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed`,
  success: `${size} px-6 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed`,
  danger: `${size} px-6 text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-600/20 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed`,
};

type FormActionButtonProps = {
  text: string;
  disabled?: boolean;
  className?: string;
} & (
  | { variant: 'primary'; onClick?: () => void }
  | { variant: 'cancel' | 'success' | 'danger'; onClick: () => void }
);

export function FormActionButton({ text, variant, onClick, disabled, className }: FormActionButtonProps) {
  const c = className ? `${variantClass[variant]} ${className}` : variantClass[variant];
  const type: 'button' | 'submit' = onClick ? 'button' : 'submit';
  return (
    <button type={type} className={c} disabled={disabled} onClick={onClick}>
      {text}
    </button>
  );
}
