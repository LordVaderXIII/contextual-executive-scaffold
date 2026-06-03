const API = '/api/v1';

export type Context = {
  id: number;
  name: string;
  slug: string;
  accent_hue: number;
  task_count?: number;
};

export type Task = {
  id: number;
  description: string;
  context_slug?: string;
  context_id: number;
  status: string;
  is_preferred: boolean;
  due_at?: string | null;
  ai_decomposition?: { micro_steps?: { text: string; done?: boolean }[] };
  implementation_intention?: string;
};

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function patch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export type FocusSession = {
  id: number;
  active: boolean;
  session_type: string;
  task_id: number | null;
  started_at: string;
  ended_at?: string | null;
  planned_minutes?: number | null;
  end_condition?: string | null;
};

export const api = {
  contexts: () => get<Context[]>('/contexts'),
  currentContext: () =>
    get<{ context: Context | null; source: string; ha: { source: string; configured?: boolean } }>(
      '/contexts/current'
    ),
  tasks: (contextSlug?: string) =>
    get<Task[]>(`/tasks${contextSlug ? `?context_slug=${contextSlug}` : ''}`),
  timeline: () => get<{ tasks: Task[]; sessions: unknown[] }>('/timeline'),
  focusSessions: (activeOnly = false) => get<FocusSession[]>(`/focus-sessions?active_only=${activeOnly}`),
  startFocus: (opts: {
    taskId?: number;
    sessionType?: string;
    plannedMinutes?: number;
    endCondition?: string;
  } = {}) =>
    post<FocusSession>('/focus-sessions', {
      task_id: opts.taskId,
      session_type: opts.sessionType ?? 'normal',
      planned_minutes: opts.plannedMinutes,
      end_condition: opts.endCondition
    }),
  endFocus: (sessionId: number) => patch<FocusSession>(`/focus-sessions/${sessionId}`, {}),
  nudgeRules: () => get<{ id: number; name: string; enabled: boolean; intensity: string }[]>('/nudge-rules'),
  evaluateNudges: () => post('/nudges/evaluate'),
  weeklyReview: () => get('/review/weekly'),
  export: () => get('/export'),
  decompose: (taskId: number) => post('/ai/decompose', { task_id: taskId }),
  haZones: () => get('/ha/zones')
};