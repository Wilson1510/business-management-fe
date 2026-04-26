import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";


function RoleIcon({ role }: { role: string }) {
  switch (role) {
    case 'admin':
      return <ShieldAlert size={12} />;
    case 'staff':
      return <ShieldCheck size={12} />;
    case 'viewer':
      return <Shield size={12} />;
  }
}

const ROLE_BADGE_BASE =
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold'

function getRoleBadgeToneClassName(role: string): string {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50';
    case 'staff':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

export type RoleBadgeProps = {
  role: string;
  className?: string;
};

export function RoleBadge({ role, className: outerClass }: RoleBadgeProps) {
  const tone = getRoleBadgeToneClassName(role);
  return (
    <span className={`capitalize ${ROLE_BADGE_BASE} ${tone}${outerClass ? ` ${outerClass}` : ''}`}>
      <RoleIcon role={role} />
      {role}
    </span>
  );
}