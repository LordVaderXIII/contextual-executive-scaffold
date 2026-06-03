<script lang="ts">
  import type { Task } from '$lib/api';
  import Icon from './Icon.svelte';
  import { estimateMinutes, isDueToday, microSteps } from '$lib/taskUtils';

  export let task: Task;

  const steps = microSteps(task);
  const done = steps.filter((s) => s.done).length;
  const hasSteps = steps.length > 0;
  const pct = hasSteps ? done / steps.length : 0;
  const nextStep = steps.find((s) => !s.done)?.text;
  const est = estimateMinutes(task);
</script>

<div class="card hero-card enter">
  <div style="display:flex;gap:8px;margin-bottom:13px;flex-wrap:wrap">
    {#if task.is_preferred}
      <span class="metatag metatag--accent"><Icon name="star" size={13} /> interest task</span>
    {/if}
    <span class="metatag"><Icon name="clock" size={13} /> ~{est} min</span>
    {#if isDueToday(task)}
      <span class="metatag metatag--clay"><Icon name="bell" size={13} /> today</span>
    {/if}
  </div>

  <h2 class="hero-card__title">{task.description}</h2>

  {#if hasSteps}
    <div style="display:flex;align-items:center;gap:10px;margin:16px 0 4px">
      <div class="bar" style="flex:1">
        <div class="bar__fill" style="width:{pct * 100}%"></div>
      </div>
      <span class="mono faint" style="font-size:12px">{done}/{steps.length}</span>
    </div>
    <div class="card card--inset micro-step">
      <Icon name="spark" size={18} color="var(--accent-ink)" />
      <div style="font-size:14.5;line-height:1.4">
        <span class="mono faint" style="font-size:11px;display:block;margin-bottom:3px;letter-spacing:0.06em"
          >NEXT MICRO-STEP</span
        >
        {nextStep ?? 'All steps done — mark it complete.'}
      </div>
    </div>
  {:else}
    <p class="muted" style="font-size:15px;margin:12px 0 16px;line-height:1.45">
      Feels big or vague? Break it into a tiny first move so starting costs nothing.
    </p>
  {/if}

  <div style="display:flex;gap:10px;margin-top:{hasSteps ? '0' : '2px'}">
    <a class="btn btn--primary" href="/focus" style="flex:1;text-decoration:none">
      <Icon name="play" size={19} color="#fff" /> Start focus
    </a>
    {#if hasSteps}
      <a class="btn btn--soft" href="/tasks" style="text-decoration:none">
        <Icon name="arrowR" size={19} /> Steps
      </a>
    {:else}
      <a class="btn btn--soft" href="/tasks" style="text-decoration:none">
        <Icon name="spark" size={19} /> Break it down
      </a>
    {/if}
  </div>
</div>