export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();

  // Reset times to compare calendar days
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  if (compareDate === today) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (compareDate === yesterday) {
    return 'Yesterday';
  }

  // Within past 7 days
  const diffDays = Math.round((today - compareDate) / 86400000);
  if (diffDays < 7) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  // Older dates
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}
