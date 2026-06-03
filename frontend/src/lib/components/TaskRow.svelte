<script lang="ts">
  import type { Task } from '$lib/api';
  import Icon from './Icon.svelte';
  import { estimateMinutes, isDueToday, microSteps } from '$lib/taskUtils';

  export let task: Task;
  export let href: string | null = null;

  const done = task.status === 'done';
  const steps = microSteps(task);
  const stepsDone = steps.filter((s) => s.done).length;
  const est = estimateMinutes(task);
</script>

{#if href}
  <a class="taskrow" {href}>
    <span class="taskrow__check" class:done aria-hidden="true"></span>
    <div class="taskrow__body">
      <div class="taskrow__title" class:done>{task.description}</div>
      <div class="taskrow__meta">
        {#if task.is_preferred}
          <span class="metatag metatag--accent"><Icon name="star" size={12} /> interest</span>
        {/if}
        <span class="metatag"><Icon name="clock" size={12} /> ~{est}m</span>
        {#if steps.length > 0}
          <span class="metatag"><Icon name="check" size={12} /> {stepsDone}/{steps.length} steps</span>
        {/if}
        {#if isDueToday(task)}
          <span class="metatag metatag--clay">today</span>
        {/if}
      </div>
    </div>
    <Icon name="chevR" size={16} color="var(--ink-3)" stroke={2} />
  </a>
{:else}
  <div class="taskrow" role="group">
    <span class="taskrow__check" class:done aria-hidden="true">
      {#if done}<Icon name="check" size={15} stroke={3} color="#fff" />{/if}
    </span>
    <div class="taskrow__body">
      <div class="taskrow__title" class:done>{task.description}</div>
      <div class="taskrow__meta">
        {#if task.is_preferred}
          <span class="metatag metatag--accent"><Icon name="star" size={12} /> interest</span>
        {/if}
        <span class="metatag"><Icon name="clock" size={12} /> ~{est}m</span>
        {#if steps.length > 0}
          <span class="metatag"><Icon name="check" size={12} /> {stepsDone}/{steps.length} steps</span>
        {/if}
        {#if isDueToday(task)}
          <span class="metatag metatag--clay">today</span>
        {/if}
      </div>
    </div>
    <Icon name="chevR" size={16} color="var(--ink-3)" stroke={2} />
  </div>
{/if}