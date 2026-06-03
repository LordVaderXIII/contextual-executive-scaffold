<script lang="ts">
  import { onMount } from 'svelte';
  import { api, type Task } from '$lib/api';
  import { currentCtx } from '$lib/stores';
  import TaskRow from '$lib/components/TaskRow.svelte';
  import Icon from '$lib/components/Icon.svelte';

  let tasks: Task[] = [];
  let loading = true;
  let filter: 'ctx' | 'all' | 'interest' | 'raw' = 'ctx';
  let decomposing: number | null = null;

  onMount(async () => {
    try {
      tasks = await api.tasks();
    } finally {
      loading = false;
    }
  });

  async function breakdown(task: Task) {
    decomposing = task.id;
    try {
      await api.decompose(task.id);
      tasks = await api.tasks();
    } finally {
      decomposing = null;
    }
  }

  $: filtered = (() => {
    let list = tasks;
    if (filter === 'ctx' && $currentCtx?.slug) {
      list = list.filter((t) => t.context_slug === $currentCtx?.slug);
    } else if (filter === 'interest') {
      list = list.filter((t) => t.is_preferred);
    } else if (filter === 'raw') {
      list = list.filter(
        (t) => !t.ai_decomposition?.micro_steps?.length && t.status !== 'done'
      );
    }
    return list;
  })();

  $: open = filtered.filter((t) => t.status !== 'done');
  $: done = filtered.filter((t) => t.status === 'done');
</script>

<main class="scroll">
  <div class="chiprow" style="margin-bottom:6px">
    <button type="button" class="chip" class:active={filter === 'ctx'} onclick={() => (filter = 'ctx')}>
      {$currentCtx?.name ?? 'Context'}
    </button>
    <button type="button" class="chip" class:active={filter === 'all'} onclick={() => (filter = 'all')}>All</button>
    <button type="button" class="chip" class:active={filter === 'interest'} onclick={() => (filter = 'interest')}>
      Interest
    </button>
    <button type="button" class="chip" class:active={filter === 'raw'} onclick={() => (filter = 'raw')}>
      Needs breakdown
    </button>
  </div>

  {#if loading}
    <p class="loading-state">Loading tasks…</p>
  {:else}
    <div class="stagger taskrow-list">
      {#if open.length === 0}
        <p class="muted" style="padding:30px 4px;text-align:center">No open tasks here.</p>
      {/if}
      {#each open as task (task.id)}
        <div>
          <TaskRow {task} />
          {#if !task.ai_decomposition?.micro_steps?.length}
            <button
              type="button"
              class="btn btn--soft"
              style="margin:8px 0 4px 39px;min-height:42px;font-size:14px"
              disabled={decomposing === task.id}
              onclick={() => breakdown(task)}
            >
              <Icon name="spark" size={17} />
              {decomposing === task.id ? 'Breaking down…' : 'Break this down'}
            </button>
          {:else if task.implementation_intention}
            <div class="intention-band" style="margin:8px 0 12px">
              <Icon name="arrowR" size={20} color="var(--accent-ink)" />
              <div>
                <div class="mono" style="font-size:11px;letter-spacing:0.08em;color:var(--accent-ink);margin-bottom:4px">
                  IF-THEN PLAN
                </div>
                <div style="font-size:15px;line-height:1.45">{task.implementation_intention}</div>
              </div>
            </div>
          {/if}
          {#if task.ai_decomposition?.micro_steps?.length}
            <ul style="margin:4px 0 12px 52px;padding:0;list-style:none;font-size:14px;line-height:1.5">
              {#each task.ai_decomposition.micro_steps as step}
                <li style="margin-bottom:6px;color:var(--ink-2)">· {step.text}</li>
              {/each}
            </ul>
          {/if}
        </div>
      {/each}
    </div>

    {#if done.length > 0}
      <div class="sectlabel">Done</div>
      <div class="taskrow-list">
        {#each done as task (task.id)}
          <TaskRow {task} />
        {/each}
      </div>
    {/if}
  {/if}

  <a
    class="btn btn--ghost btn--full"
    href="/tasks"
    style="margin-top:18px;justify-content:flex-start;color:var(--ink-2);text-decoration:none;gap:9px"
  >
    <Icon name="plus" size={20} color="var(--ink-3)" /> Add a task
  </a>
</main>