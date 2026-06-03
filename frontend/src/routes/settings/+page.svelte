<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import { darkMode, currentCtx } from '$lib/stores';
  import ListRow from '$lib/components/ListRow.svelte';
  import Toggle from '$lib/components/Toggle.svelte';
  import Icon from '$lib/components/Icon.svelte';

  let ha: { source: string; configured?: boolean; current_zone?: string } | null = null;
  let contexts: { name: string; slug: string; accent_hue: number }[] = [];
  let exportCount = 0;
  let loading = true;

  onMount(async () => {
    try {
      [ha, contexts] = await Promise.all([api.haZones(), api.contexts()]);
    } finally {
      loading = false;
    }
  });

  async function doExport() {
    const data = await api.export();
    exportCount = data.tasks?.length ?? 0;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ces-export.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
</script>

<main class="scroll stagger">
  <div class="sectlabel" style="margin-top:6px">Appearance</div>
  <div class="card card--flat" style="overflow:hidden;padding:0">
    <div class="list-row">
      <span class="list-row__icon"><Icon name={$darkMode ? 'flame' : 'now'} size={19} /></span>
      <span style="flex:1">
        <span class="list-row__title">Dark mode</span>
        <span class="list-row__detail">{$darkMode ? 'Easier on the eyes at night' : 'Bright, high-clarity'}</span>
      </span>
      <Toggle bind:on={$darkMode} label="Dark mode" />
    </div>
  </div>

  <div class="sectlabel">Home Assistant</div>
  <div class="card card--flat" style="overflow:hidden;padding:0">
    <div class="list-row">
      <span class="list-row__icon"><Icon name="pin" size={19} /></span>
      <span style="flex:1">
        <span class="list-row__title">Connection</span>
        {#if ha}
          <span class="list-row__detail">{ha.source}{ha.current_zone ? ` · ${ha.current_zone}` : ''}</span>
        {/if}
      </span>
      <span
        class="chip"
        style="pointer-events:none;font-size:11px;color:{ha?.configured ? 'var(--good)' : 'var(--ink-3)'}"
        >{ha?.configured ? '● connected' : '○ mock'}</span
      >
    </div>
    {#if loading}
      <p class="faint" style="padding:14px 16px;margin:0;font-size:13px">Loading HA status…</p>
    {/if}
  </div>

  <div class="sectlabel">Contexts</div>
  <div class="card card--flat" style="overflow:hidden;padding:0">
    {#each contexts as ctx, i}
      <button
        type="button"
        class="list-row"
        style:border-bottom={i === contexts.length - 1 ? 'none' : undefined}
        onclick={() => currentCtx.set(ctx)}
      >
        <span class="list-row__icon"><Icon name="home" size={19} /></span>
        <span style="flex:1;text-align:left">
          <span class="list-row__title">{ctx.name}</span>
          <span class="list-row__detail">{ctx.slug}</span>
        </span>
        {#if $currentCtx?.slug === ctx.slug}
          <span class="chip active" style="pointer-events:none;font-size:10.5px;padding:4px 9px">active</span>
        {/if}
      </button>
    {/each}
  </div>

  <div class="sectlabel">Data & safeguards</div>
  <div class="card card--flat" style="overflow:hidden;padding:0">
    <button type="button" class="list-row" onclick={doExport}>
      <span class="list-row__icon"><Icon name="arrowR" size={19} /></span>
      <span style="flex:1;text-align:left">
        <span class="list-row__title">Export my data</span>
        <span class="list-row__detail">Download everything as JSON</span>
      </span>
      <Icon name="chevR" size={16} color="var(--ink-3)" stroke={2} />
    </button>
  </div>
  {#if exportCount}
    <p class="faint" style="text-align:center;margin-top:8px;font-size:13px">Exported {exportCount} tasks</p>
  {/if}

  <p class="faint" style="font-size:13px;margin-top:20px;line-height:1.45;text-align:center;padding:0 8px">
    Production uses external MariaDB on Unraid. Local Docker uses disposable test data.
  </p>

  <div style="text-align:center;padding:24px 0 8px">
    <div class="mono faint" style="font-size:11px;letter-spacing:0.1em">CONTEXTUAL EXECUTIVE SCAFFOLD</div>
    <div class="faint" style="font-size:12px;margin-top:5px">Self-hosted · your data · v0.2</div>
  </div>
</main>