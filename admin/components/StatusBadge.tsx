import { cn } from '../lib/utils';

const BADGE_STYLES: Record<string, string> = {
  // Contribution statuses
  submitted: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  needs_follow_up: 'bg-amber-100 text-amber-700',
  // Pledge
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  missed: 'bg-red-100 text-red-700',
  free_participant: 'bg-blue-100 text-blue-700',
  none: 'bg-gray-100 text-gray-500',
  // Content
  draft: 'bg-gray-100 text-gray-600',
  approved: 'bg-green-100 text-green-700',
  published: 'bg-primary-50 text-primary-dark',
  archived: 'bg-gray-200 text-gray-500',
  // Campaign
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  paused: 'bg-amber-100 text-amber-700',
  // Emergency
  urgent: 'bg-red-100 text-red-700',
};

const LABEL_MAP: Record<string, string> = {
  needs_follow_up: 'Follow Up',
  free_participant: 'Free',
  friday_challenge: 'Friday',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = BADGE_STYLES[status] || 'bg-gray-100 text-gray-600';
  const label = LABEL_MAP[status] || status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', style, className)}>
      {label}
    </span>
  );
}
