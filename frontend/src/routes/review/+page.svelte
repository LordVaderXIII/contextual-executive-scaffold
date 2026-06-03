<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import Icon from '$lib/components/Icon.svelte';

  let review: {
    nudges_fired: number;
    nudges_answered: number;
    focus_sessions: number;
    reflections: { worked?: string; blocked?: string; note?: string; day?: string }[];
  } | null = null;
  let loading = true;

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const focusByDay = [25, 50, 0, 45, 30, 0, 35];

  onMount(async () => {
    try {
      review = await api.weeklyReview();
    } finally {
      loading = false;
    }
  });

  $: maxF = Math.max(...focusByDay, 1);
  $: nudgePct =
    review && review.nudges_fired > 0
      ? (review.nudges_answered / review.nudges_fired) * 100
      : 0;
</script>

<main class="scroll stagger">
  <p class="muted" style="font-size:14.5px;line-height:1.45;margin:4px 2px 16px">
    A weekly look — for insight, not scoring. No streaks to protect, nothing to feel guilty about.
  </p>

  {#if loading}
    <p class="loading-state">Loading review…</p>
  {:else if review}
    <div class="stat-grid">
      <div class="card stat-tile">
        <Icon name="clock" size={19} color="var(--accent-ink)" />
        <div class="stat-tile__value">{review.focus_sessions * 15}m</div>
        <div class="faint mono" style="font-size:11px;margin-top:2px;letter-spacing:0.04em">FOCUS TIME (EST.)</div>
      </div>
      <div class="card stat-tile">
        <Icon name="check" size={19} color="var(--accent-ink)" />
        <div class="stat-tile__value">{review.nudges_answered}</div>
        <div class="faint mono" style="font-size:11px;margin-top:2px;letter-spacing:0.04em">NUDGES ANSWERED</div>
      </div>
    </div>

    <div class="card" style="padding:16px 18px;margin-top:10px">
      <div class="mono faint" style="font-size:11px;letter-spacing:0.08em">FOCUS MINUTES · THIS WEEK</div>
      <div style="display:flex;align-items:flex-end;gap:9px;height:96px;margin-top:14px">
        {#each focusByDay as m, i}
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:7px">
            <div
              style="width:100%;height:{(m / maxF) * 70}px;min-height:{m ? 6 : 0}px;border-radius:6px;background:{m
                ? 'var(--accent)'
                : 'transparent'};border:{m ? 'none' : '1px dashed var(--line)'}"
            ></div>
            <span class="mono faint" style="font-size:10.5px">{days[i]}</span>
          </div>
        {/each}
      </div>
    </div>

    <div
      class="card"
      style="padding:16px 18px;margin-top:10px;display:flex;gap:13px;align-items:flex-start;background:linear-gradient(180deg, var(--accent-soft), var(--surface) 60%);border-color:var(--accent-line)"
    >
      <Icon name="spark" size={20} color="var(--accent-ink)" />
      <div>
        <div class="mono" style="font-size:11px;letter-spacing:0.08em;color:var(--accent-ink);margin-bottom:5px">
          PATTERN NOTICED
        </div>
        <p style="font-size:14.5px;line-height:1.5;margin:0">
          Tasks with a saved if-then plan were easier to start. Reflections below capture what worked and what
          stalled.
        </p>
      </div>
    </div>

    <div class="card" style="padding:15px 18px;margin-top:10px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-weight:700;font-size:15px">Nudges answered</span>
        <span class="mono" style="font-size:14px;color:var(--accent-ink)"
          >{review.nudges_answered}/{review.nudges_fired}</span
        >
      </div>
      <div class="bar" style="margin-top:10px">
        <div class="bar__fill" style="width:{nudgePct}%"></div>
      </div>
    </div>

    <div class="sectlabel">Reflections</div>
    {#if review.reflections.length === 0}
      <div class="card empty-state">
        <p class="muted" style="font-size:15px">No reflections logged yet this week.</p>
      </div>
    {:else}
      <div class="card card--flat" style="overflow:hidden;padding:0">
        {#each review.reflections as r, i}
          <div
            style="padding:14px 16px;border-bottom:{i === review.reflections.length - 1
              ? 'none'
              : '1px solid var(--line-soft)'}"
          >
            {#if r.worked}
              <div style="font-size:14.5px;display:flex;gap:8px;line-height:1.4">
                <Icon name="check" size={15} color="var(--good)" stroke={2.4} />
                <span>{r.worked}</span>
              </div>
            {/if}
            {#if r.blocked}
              <div style="font-size:14.5px;display:flex;gap:8px;line-height:1.4;margin-top:6px;color:var(--ink-2)">
                <Icon name="x" size={15} color="var(--clay)" stroke={2.4} />
                <span>{r.blocked}</span>
              </div>
            {/if}
            {#if r.note}
              <div class="faint" style="font-size:13px;margin-top:7px;font-style:italic;line-height:1.4">"{r.note}"</div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</main>