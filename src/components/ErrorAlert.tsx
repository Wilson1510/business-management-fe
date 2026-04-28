import { AlertCircle } from 'lucide-react';

const PAGE_CLASS =
  'mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200';

const INLINE_CLASS =
  'flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-100 dark:border-red-900/50';

const DIALOG_CLASS =
  'mb-8 flex items-center justify-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-100 dark:border-red-900/50';

const FORM_CLASS =
  'flex items-center gap-3 p-4 text-sm text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-2xl';

const LOGIN_CLASS =
  'mb-6 flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/50 animate-in fade-in slide-in-from-top-2';

export type ErrorAlertProps = {
  /** Render only when this string is set, e.g. `{error && <ErrorAlert message={error} />}` */
  message: string;
  /**
   * page — list/dashboard banner; form — in-page form top; inline — small row in modal form;
   * dialog — centered in confirm modals; login — sign-in card
   */
  variant?: 'page' | 'form' | 'inline' | 'dialog' | 'login';
  className?: string;
};

export function ErrorAlert({ message, variant = 'page', className = '' }: ErrorAlertProps) {
  const extra = className ? ` ${className}` : '';

  switch (variant) {
    case 'page':
      return (
        <div role="alert" className={PAGE_CLASS + extra}>
          {message}
        </div>
      );
    case 'login':
      return (
        <div role="alert" className={LOGIN_CLASS + extra}>
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{message}</p>
        </div>
      );
    case 'form':
      return (
        <div role="alert" className={FORM_CLASS + extra}>
          <AlertCircle size={18} className="shrink-0" />
          <p className="font-medium">{message}</p>
        </div>
      );
    case 'inline':
      return (
        <div role="alert" className={INLINE_CLASS + extra}>
          <AlertCircle size={16} className="shrink-0" />
          {message}
        </div>
      );
    case 'dialog':
      return (
        <div role="alert" className={DIALOG_CLASS + extra}>
          <AlertCircle size={16} className="shrink-0" />
          <p className="font-medium">{message}</p>
        </div>
      );
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
}
