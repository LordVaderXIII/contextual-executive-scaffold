export type RouteMeta = {
  title: string;
  eyebrow?: string;
  backHref?: string;
  showSettings?: boolean;
  hideTabs?: boolean;
};

const DATE_STR = () =>
  new Date()
    .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    .toUpperCase();

export function metaForPath(path: string): RouteMeta {
  if (path === '/') return { title: 'Now', eyebrow: DATE_STR(), showSettings: true };
  if (path === '/tasks') return { title: 'Tasks', eyebrow: 'YOUR LIST', showSettings: true };
  if (path === '/timeline') return { title: 'Today', eyebrow: DATE_STR(), showSettings: true };
  if (path === '/focus') return { title: 'Focus', eyebrow: 'PROTECTED TIME', showSettings: true };
  if (path === '/more') return { title: 'More', eyebrow: 'CES', showSettings: true };
  if (path === '/nudges') return { title: 'Nudges', eyebrow: 'GENTLE PERSISTENCE', backHref: '/more', hideTabs: true };
  if (path === '/review') return { title: 'Review', eyebrow: 'WEEKLY', backHref: '/more', hideTabs: true };
  if (path === '/settings') return { title: 'Settings', eyebrow: 'SYSTEM', backHref: '/more', hideTabs: true };
  return { title: 'CES', showSettings: true };
}

export const TABS = [
  { href: '/', label: 'Now', id: 'now', icon: 'now' },
  { href: '/tasks', label: 'Tasks', id: 'tasks', icon: 'tasks' },
  { href: '/timeline', label: 'Today', id: 'timeline', icon: 'timeline' },
  { href: '/focus', label: 'Focus', id: 'focus', icon: 'focus' },
  { href: '/more', label: 'More', id: 'more', icon: 'more' }
] as const;