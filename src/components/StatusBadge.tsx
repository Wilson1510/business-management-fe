import { CheckCircle2, Clock, HelpCircle, XCircle } from 'lucide-react';

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'draft':
      return <Clock size={12} />;
    case 'confirmed':
    case 'done':
      return <CheckCircle2 size={12} />;
    case 'cancelled':
      return <XCircle size={12} />;
    default:
      return <HelpCircle size={12} />;
  }
}

const STATUS_BADGE_BASE =
  'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border capitalize';

function getStatusBadgeToneClassName(status: string): string {
  switch (status) {
    case 'draft':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'confirmed':
    case 'done':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

export type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className: outerClass }: StatusBadgeProps) {
  const tone = getStatusBadgeToneClassName(status);
  return (
    <span
      className={`${STATUS_BADGE_BASE} ${tone}${outerClass ? ` ${outerClass}` : ''}`}
    >
      <StatusIcon status={status} />
      {status}
    </span>
  );
}
