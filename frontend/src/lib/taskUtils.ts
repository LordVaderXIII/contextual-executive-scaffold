import type { Task } from './api';

export function estimateMinutes(task: Task): number {
  const m = task.description.match(/\((\d+)\s*min/i);
  return m ? parseInt(m[1], 10) : 15;
}

export function isDueToday(task: Task): boolean {
  if (!task.due_at) return false;
  const due = new Date(task.due_at);
  const now = new Date();
  return (
    due.getUTCFullYear() === now.getUTCFullYear() &&
    due.getUTCMonth() === now.getUTCMonth() &&
    due.getUTCDate() === now.getUTCDate()
  );
}

export function microSteps(task: Task): { text: string; done?: boolean }[] {
  return task.ai_decomposition?.micro_steps ?? [];
}

export function pickNextThing(tasks: Task[], contextSlug: string | undefined): Task | null {
  const pool = tasks.filter((t) => t.status !== 'done' && (!contextSlug || t.context_slug === contextSlug));
  if (!pool.length) return null;
  const score = (t: Task) => {
    const steps = microSteps(t);
    return (
      (t.status === 'in_progress' ? 100 : 0) +
      (isDueToday(t) ? 40 : 0) +
      (t.is_preferred ? 15 : 0) -
      (steps.length ? 0 : 5)
    );
  };
  return [...pool].sort((a, b) => score(b) - score(a))[0];
}

export function contextIcon(slug?: string): string {
  if (slug?.includes('home')) return 'home';
  if (slug?.includes('work')) return 'focus';
  return 'leaf';
}