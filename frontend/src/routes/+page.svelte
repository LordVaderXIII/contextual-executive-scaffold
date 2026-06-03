<script lang="ts">
  import { onMount } from 'svelte';
  import { api, type Task } from '$lib/api';
  import { currentCtx } from '$lib/stores';
  import ContextBadge from '$lib/components/ContextBadge.svelte';
  import HeroCard from '$lib/components/HeroCard.svelte';
  import TaskRow from '$lib/components/TaskRow.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { pickNextThing } from '$lib/taskUtils';

  let tasks: Task[] = [];
  let loading = true;
  let haSource = 'manual';
  let haZone = '';

  onMount(async () => {
    try {
      const [cur, all] = await Promise.all([api.currentContext(), api.tasks()]);
      if (cur.context) currentCtx.set(cur.context);
      haSource = cur.ha?.source ?? 'unknown';
      haZone = cur.ha?.configured ? 'Home Assistant' : 'manual';
      const slug = cur.context?.slug;
      tasks = all.filter((t) => t.status !== 'done');
      if (slug) tasks = tasks.filter((t) => !t.context_slug || t.context_slug === slug);
    } finally {
      loading = false;
    }
  });

  $: ctx = $currentCtx;
  $: slug = ctx?.slug;
  $: hero = pickNextThing(tasks, slug);
  $: others = tasks.filter((t) => !hero || t.id !== hero.id);
  $: haLabel = haSource !== 'unknown' ? `via Home Assistant${haZone ? '' : ''}` : 'manual';
</script>

<main class="scroll stagger">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;margin-bottom:18px;flex-wrap:wrap;gap:10px">
    {#if ctx}
      <ContextBadge name={ctx.name} href="/settings" />
    {/if}
    <span class="metatag" style="font-size:11.5px">
      <Icon name="pin" size={13} color="var(--ink-3)" /> {haLabel}
    </span>
  </div>

  <div class="sectlabel" style="margin-top:0">Your one next thing</div>

  {#if loading}
    <p class="loading-state">Loading your context…</p>
  {:else if hero}
    <HeroCard task={hero} />
  {:else}
    <div class="card empty-state">
      <div class="empty-state__title">Nothing pending here.</div>
      <p class="muted" style="margin-top:6px;font-size:15px">
        Nothing demands your attention in {ctx?.name ?? 'this context'} right now. That's allowed.
      </p>
    </div>
  {/if}

  {#if !loading && others.length > 0}
    <div class="sectlabel">Also in {ctx?.name ?? 'context'}</div>
    <div class="taskrow-list">
      {#each others.slice(0, 4) as task (task.id)}
        <TaskRow {task} href="/tasks" />
      {/each}
    </div>
  {/if}

  <a
    class="btn btn--ghost btn--full"
    href="/tasks"
    style="margin-top:18px;justify-content:flex-start;gap:11px;color:var(--ink-2);text-decoration:none"
  >
    <Icon name="plus" size={20} color="var(--ink-3)" />
    <span>Add something to {ctx?.name ?? 'your list'}</span>
  </a>
</main>