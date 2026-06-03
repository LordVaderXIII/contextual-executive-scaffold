<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import Icon from '$lib/components/Icon.svelte';

  type Session = {
    id: number;
    session_type: string;
    started_at: string;
    ended_at?: string | null;
    end_condition?: string | null;
  };

  type TimelineTask = {
    id: number;
    description: string;
    status: string;
    context_name: string;
    context_slug?: string;
  };

  let data: { tasks: TimelineTask[]; sessions: Session[] } | null = null;
  let loading = true;

  const DAY_START = 7;
  const DAY_END = 22;
  const HOUR_PX = 58;

  onMount(async () => {
    try {
      data = await api.timeline();
    } finally {
      loading = false;
    }
  });

  function hourFromIso(iso: string): number {
    const d = new Date(iso);
    return d.getHours() + d.getMinutes() / 60;
  }

  function yFor(h: number): number {
    return (h - DAY_START) * HOUR_PX;
  }

  function fmtTime(h: number): string {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return `${hh}:${String(mm).padStart(2, '0')}`;
  }

  $: nowDec = new Date().getHours() + new Date().getMinutes() / 60;
  $: nowClamped = Math.min(Math.max(nowDec, DAY_START), DAY_END);
  $: totalH = (DAY_END - DAY_START) * HOUR_PX;
  $: hours = Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => DAY_START + i);

  $: blocks = (() => {
    if (!data) return [];
    const items: {
      top: number;
      height: number;
      title: string;
      sub: string;
      type: 'session' | 'task';
      done: boolean;
    }[] = [];
    for (const s of data.sessions) {
      const start = hourFromIso(s.started_at);
      if (start < DAY_START || start > DAY_END) continue;
      const end = s.ended_at ? hourFromIso(s.ended_at) : start + 0.5;
      const durMin = Math.max((end - start) * 60, 25);
      items.push({
        top: yFor(start),
        height: Math.max((durMin / 60) * HOUR_PX, 30),
        title: `${s.session_type} focus`,
        sub: `${fmtTime(start)} · ${Math.round(durMin)}m${s.ended_at ? ' · done' : ''}`,
        type: 'session',
        done: !!s.ended_at
      });
    }
    let slot = 11;
    for (const t of data.tasks.slice(0, 4)) {
      if (slot > DAY_END - 0.5) break;
      items.push({
        top: yFor(slot),
        height: 36,
        title: t.description.length > 42 ? t.description.slice(0, 42) + '…' : t.description,
        sub: `${t.context_name} · ${t.status}`,
        type: 'task',
        done: t.status === 'done'
      });
      slot += 1.2;
    }
    return items;
  })();
</script>

<main class="scroll">
  <p class="muted" style="font-size:14.5px;line-height:1.45;margin:4px 2px 18px">
    Time made visible. Blocks are gentle suggestions — past sessions are filled, planned ones outlined.
  </p>

  {#if loading}
    <p class="loading-state">Loading today's timeline…</p>
  {:else}
    <div class="timeline-grid" style="height:{totalH}px">
      {#each hours as h}
        <div class="timeline-hour" style="top:{yFor(h)}px">
          <span class="mono faint" style="position:absolute;top:-8px;left:0;font-size:11px;width:46px"
            >{String(h).padStart(2, '0')}:00</span
          >
          <div style="position:absolute;left:52px;right:0;top:0;height:1px;background:var(--line-soft)"></div>
        </div>
      {/each}

      <div class="timeline-now" style="top:{yFor(nowClamped)}px">
        <span
          style="position:absolute;left:-6px;top:-4px;width:10px;height:10px;border-radius:50%;background:var(--clay)"
        ></span>
        <span
          class="mono"
          style="position:absolute;right:0;top:-18px;font-size:10.5px;color:var(--clay-ink);font-weight:600"
          >NOW</span
        >
      </div>

      {#each blocks as block, i}
        <div
          class="timeline-block card"
          style="top:{block.top}px;height:{block.height}px;border-left:3px solid var(--accent);opacity:{block.done ? 0.85 : 1}"
        >
          <div style="display:flex;align-items:center;gap:7px">
            <Icon name={block.type === 'session' ? 'focus' : 'check'} size={13} color="var(--accent-ink)" stroke={2.2} />
            <span style="font-weight:700;font-size:14px;line-height:1.15;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
              >{block.title}</span
            >
          </div>
          <span class="mono faint" style="font-size:10.5px;margin-top:3px;padding-left:20px">{block.sub}</span>
        </div>
      {/each}
    </div>

    {#if data && data.sessions.length === 0 && data.tasks.length === 0}
      <div class="card empty-state" style="margin-top:20px">
        <div class="empty-state__title">Quiet day so far</div>
        <p class="muted" style="margin-top:6px;font-size:15px">No sessions or tasks on the timeline yet.</p>
      </div>
    {/if}
  {/if}
</main>