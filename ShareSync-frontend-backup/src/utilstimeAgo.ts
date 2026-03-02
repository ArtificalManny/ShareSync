export function timeAgo(dateParam: Date | string | number): string {
  if (!dateParam) return 'just now';

  const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam);
  const today = new Date();
  const seconds = Math.round((today.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  
  // Format as MM/DD/YYYY if older than a week
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
