<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { api, type FocusSession } from '$lib/api';
  import Icon from '$lib/components/Icon.svelte';

  const RING = 628;

  let active: FocusSession | null = null;
  let loading = true;
  let starting = false;
  let ending = false;
  let error = '';
  let mode: 'normal' | 'hyperfocus' = 'normal';
  let duration = 25;
  let endCond = '';
  let nowMs = Date.now();
  let tick: ReturnType<typeof setInterval> | undefined;

  onMount(() => {
    void refresh();
    tick = setInterval(() => {
      nowMs = Date.now();
    }, 1000);
  });

  onDestroy(() => {
    if (tick) clearInterval(tick);
  });

  function parseError(e: unknown): string {
    if (!(e instanceof Error)) return 'Something went wrong. Try again.';
    try {
      const body = JSON.parse(e.message) as { detail?: string };
      return body.detail ?? e.message;
    } catch {
      return e.message || 'Something went wrong. Try again.';
    }
  }

  async function refresh() {
    loading = true;
    error = '';
    try {
      const sessions = await api.focusSessions(true);
      active = sessions[0] ?? null;
    } catch (e) {
      error = parseError(e);
      active = null;
    } finally {
      loading = false;
    }
  }

  async function start() {
    starting = true;
    error = '';
    try {
      await api.startFocus({
        sessionType: mode,
        plannedMinutes: duration,
        endCondition: mode === 'hyperfocus' && endCond.trim() ? endCond.trim() : undefined
      });
      await refresh();
    } catch (e) {
      error = parseError(e);
    } finally {
      starting = false;
    }
  }

  async function endSession() {
    if (!active) return;
    ending = true;
    error = '';
    try {
      await api.endFocus(active.id);
      active = null;
      await refresh();
    } catch (e) {
      error = parseError(e);
    } finally {
      ending = false;
    }
  }

  function fmtClock(iso: string): string {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function sessionTiming(session: FocusSession, at: number) {
    const started = new Date(session.started_at).getTime();
    const elapsedSec = Math.max(0, Math.floor((at - started) / 1000));
    const plannedMin = session.planned_minutes ?? null;
    const totalSec = plannedMin ? plannedMin * 60 : null;
    const remainingSec = totalSec !== null ? Math.max(0, totalSec - elapsedSec) : null;
    const progress =
      totalSec && totalSec > 0 ? Math.min(1, elapsedSec / totalSec) : null;
    return { elapsedSec, plannedMin, totalSec, remainingSec, progress };
  }

  function fmtDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  $: timing = active ? sessionTiming(active, nowMs) : null;
  $: ringOffset =
    timing?.progress !== null && timing?.progress !== undefined
      ? RING * (1 - timing.progress)
      : RING * 0.25;
  $: isHyper = active?.session_type === 'hyperfocus';
</script>

<main class="scroll focus-ring-wrap">
  {#if error}
    <div
      class="card"
      role="alert"
      style="width:100%;padding:12px 14px;margin-bottom:12px;border-color:var(--clay-soft);background:var(--clay-soft)"
    >
      <p style="margin:0;font-size:14px;line-height:1.4;color:var(--clay-ink)">{error}</p>
    </div>
  {/if}

  {#if loading && !active}
    <p class="loading-state">Loading focus…</p>
  {:else if active && timing}
    <div class="card" style="width:100%;padding:20px;text-align:center;margin-top:4px">
      <div class="mono faint" style="font-size:11px;letter-spacing:0.08em">ACTIVE SESSION</div>
      <div
        style="font-size:22px;font-weight:700;margin-top:8px;text-transform:capitalize;display:flex;align-items:center;justify-content:center;gap:8px"
      >
        {#if isHyper}<Icon name="flame" size={20} />{/if}
        {active.session_type}
      </div>
      <p class="muted" style="margin:8px 0 0;font-size:15px">Started {fmtClock(active.started_at)}</p>

      <div
        style="position:relative;width:228px;height:228px;margin:18px auto 6px;display:flex;align-items:center;justify-content:center"
      >
        <svg width="228" height="228" style="transform:rotate(-90deg);position:absolute;inset:0">
          <circle cx="114" cy="114" r="100" fill="none" stroke="var(--surface-2)" stroke-width="13" />
          <circle
            cx="114"
            cy="114"
            r="100"
            fill="none"
            stroke={isHyper ? 'var(--clay)' : 'var(--accent)'}
            stroke-width="13"
            stroke-linecap="round"
            stroke-dasharray={RING}
            stroke-dashoffset={ringOffset}
          />
        </svg>
        <div style="text-align:center;z-index:1">
          {#if timing.remainingSec !== null}
            <div class="mono" style="font-size:42px;font-weight:600;letter-spacing:-0.02em">
              {fmtDuration(timing.remainingSec)}
            </div>
            <div class="mono faint" style="font-size:11.5px;margin-top:2px">remaining</div>
          {:else}
            <div class="mono" style="font-size:42px;font-weight:600;letter-spacing:-0.02em">
              {fmtDuration(timing.elapsedSec)}
            </div>
            <div class="mono faint" style="font-size:11.5px;margin-top:2px">elapsed</div>
          {/if}
        </div>
      </div>

      {#if timing.plannedMin}
        <p class="faint mono" style="font-size:12px;margin:0">{timing.plannedMin} min planned</p>
      {/if}

      {#if active.end_condition}
        <div
          class="card card--inset"
          style="width:100%;padding:12px 14px;margin-top:16px;text-align:left;border-color:var(--clay-soft)"
        >
          <div
            class="mono"
            style="font-size:11px;letter-spacing:0.08em;color:var(--clay-ink);margin-bottom:6px;display:flex;align-items:center;gap:6px"
          >
            <Icon name="flame" size={14} /> END CONDITION
          </div>
          <p style="margin:0;font-size:14.5px;line-height:1.4;color:var(--ink-2)">{active.end_condition}</p>
        </div>
      {/if}

      <button
        type="button"
        class="btn btn--lg btn--full"
        class:btn--clay={isHyper}
        class:btn--primary={!isHyper}
        style="margin-top:20px"
        disabled={ending}
        onclick={endSession}
      >
        <Icon name="check" size={20} color="#fff" />
        {ending ? 'Ending…' : 'Complete session'}
      </button>
    </div>
  {:else}
    <div class="focus-mode-switch">
      <button
        type="button"
        class="focus-mode-btn"
        class:active={mode === 'normal'}
        onclick={() => (mode = 'normal')}
      >
        <Icon name="focus" size={17} /> Normal
      </button>
      <button
        type="button"
        class="focus-mode-btn"
        class:active={mode === 'hyperfocus'}
        class:hyper={mode === 'hyperfocus'}
        onclick={() => (mode = 'hyperfocus')}
      >
        <Icon name="flame" size={17} /> Hyperfocus
      </button>
    </div>

    <div class="faint mono" style="font-size:12px;margin:14px 0 2px">FREE FOCUS</div>
    <div
      style="font-weight:700;font-size:17px;text-align:center;max-width:28ch;line-height:1.3;margin-bottom:18px;color:var(--ink-3)"
    >
      No task attached — just protected time.
    </div>

    <div
      style="position:relative;width:228px;height:228px;margin:0 auto 8px;display:flex;align-items:center;justify-content:center"
    >
      <svg width="228" height="228" style="transform:rotate(-90deg);position:absolute;inset:0">
        <circle cx="114" cy="114" r="100" fill="none" stroke="var(--surface-2)" stroke-width="13" />
        <circle
          cx="114"
          cy="114"
          r="100"
          fill="none"
          stroke={mode === 'hyperfocus' ? 'var(--clay)' : 'var(--accent)'}
          stroke-width="13"
          stroke-linecap="round"
          stroke-dasharray={RING}
          stroke-dashoffset={RING * 0.25}
        />
      </svg>
      <div style="text-align:center;z-index:1">
        <div class="mono" style="font-size:46px;font-weight:600;letter-spacing:-0.02em">{duration}</div>
        <div class="mono faint" style="font-size:11.5px;margin-top:2px">min planned</div>
      </div>
    </div>

    <div class="chiprow" style="justify-content:center;width:100%;margin-top:12px">
      {#each [15, 25, 50, 90] as m}
        <button type="button" class="chip" class:active={duration === m} onclick={() => (duration = m)}>{m} min</button>
      {/each}
    </div>

    {#if mode === 'hyperfocus'}
      <div class="card card--inset" style="width:100%;padding:14px 15px;margin-top:18px;border-color:var(--clay-soft)">
        <div
          class="mono"
          style="font-size:11px;letter-spacing:0.08em;color:var(--clay-ink);margin-bottom:8px;display:flex;align-items:center;gap:6px"
        >
          <Icon name="flame" size={14} /> CONTAINMENT — END CONDITION
        </div>
        <textarea
          class="field"
          rows="2"
          bind:value={endCond}
          placeholder="Stop when the test passes, or at 90 min — whichever comes first."
          style="background:var(--surface);font-size:14.5px;line-height:1.4"
        ></textarea>
        <p class="faint" style="font-size:12.5px;margin-top:9px;line-height:1.4">
          A gentle checkpoint will surface every 30 min so a deep dive doesn't quietly swallow the evening.
        </p>
      </div>
    {/if}

    <div style="display:flex;gap:10px;margin-top:22px;width:100%">
      <button
        type="button"
        class="btn"
        class:btn--primary={mode === 'normal'}
        class:btn--clay={mode === 'hyperfocus'}
        class:btn--lg={true}
        class:btn--full={true}
        disabled={starting}
        onclick={start}
      >
        <Icon name="play" size={21} color="#fff" /> {starting ? 'Starting…' : `Start ${duration}-min focus`}
      </button>
    </div>

    <a class="chip" href="/tasks" style="margin-top:16px;text-decoration:none">
      <Icon name="plus" size={14} /> attach a task
    </a>
  {/if}
</main>