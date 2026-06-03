<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import { currentCtx, darkMode } from '$lib/stores';
  import AppBar from '$lib/components/AppBar.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { metaForPath, TABS } from '$lib/navMeta';

  let nudgeBanner: { title: string; message: string; pending?: number } | null = null;

  onMount(async () => {
    try {
      const cur = await api.currentContext();
      if (cur.context) {
        currentCtx.set(cur.context);
        document.documentElement.style.setProperty('--accent-h', String(cur.context.accent_hue));
      }
    } catch {
      /* offline shell */
    }
  });

  $: theme = $darkMode ? 'dark' : 'light';
  $: path = $page.url.pathname;
  $: meta = metaForPath(path);
  $: activeTab =
    path === '/' ? 'now' : TABS.find((t) => t.href !== '/' && path.startsWith(t.href))?.id ?? 'more';
  $: showTabs = !meta.hideTabs;
</script>

<svelte:head>
  <title>CES — {meta.title}</title>
</svelte:head>

<div class="app" data-theme={theme}>
  <AppBar
    eyebrow={meta.eyebrow ?? ''}
    title={meta.title}
    backHref={meta.backHref ?? null}
    showSettings={meta.showSettings ?? false}
  />

  {#if nudgeBanner}
    <div class="nudge" role="alert">
      <div style="display:flex;gap:12px;align-items:flex-start">
        <span
          style="width:36px;height:36px;border-radius:11px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:var(--clay-soft);color:var(--clay-ink)"
        >
          <Icon name="bell" size={19} />
        </span>
        <div style="flex:1;min-width:0">
          <div class="mono" style="font-size:10.5px;letter-spacing:0.1em;color:var(--clay-ink)">
            CES · GENTLE NUDGE
          </div>
          <div style="font-size:15px;font-weight:700;margin-top:3px;line-height:1.3">{nudgeBanner.title}</div>
          <div class="faint" style="font-size:13px;margin-top:2px;line-height:1.35">{nudgeBanner.message}</div>
        </div>
        <button
          type="button"
          class="iconbtn"
          style="width:32px;height:32px;border:none;background:none;box-shadow:none"
          aria-label="Dismiss nudge"
          onclick={() => (nudgeBanner = null)}
        >
          <Icon name="x" size={17} />
        </button>
      </div>
      <div style="display:flex;gap:8px;margin-top:13px">
        <a class="btn btn--clay" href="/tasks" style="flex:1;min-height:42px;font-size:14px;text-decoration:none"
          >Take a look</a
        >
        <button
          type="button"
          class="btn btn--ghost"
          style="min-height:42px;font-size:14px;gap:7px"
          onclick={() => (nudgeBanner = null)}
        >
          <Icon name="snooze" size={16} /> Snooze
        </button>
      </div>
    </div>
  {/if}

  <slot {nudgeBanner} setNudge={(b: typeof nudgeBanner) => (nudgeBanner = b)} />

  {#if showTabs}
    <nav class="tabbar" aria-label="Main">
      <div class="tabbar__inner">
        {#each TABS as tab}
          <a
            class="tab"
            class:active={activeTab === tab.id}
            href={tab.href}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <Icon name={tab.icon} size={22} stroke={activeTab === tab.id ? 2.1 : 1.85} />
            <span>{tab.label}</span>
          </a>
        {/each}
      </div>
    </nav>
  {/if}
</div>