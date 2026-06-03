<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import Icon from '$lib/components/Icon.svelte';
  import Toggle from '$lib/components/Toggle.svelte';
  import { contextIcon } from '$lib/taskUtils';

  let rules: {
    id: number;
    name: string;
    enabled: boolean;
    intensity: string;
    cron_or_ha_trigger?: string;
    context_slug?: string;
  }[] = [];
  let loading = true;
  let nudgesActive = true;

  onMount(async () => {
    try {
      rules = await api.nudgeRules();
    } finally {
      loading = false;
    }
  });

  async function testEvaluate() {
    const result = await api.evaluateNudges();
    if (result.app_banner) {
      alert(result.app_banner.message);
    }
  }
</script>

<main class="scroll">
  <div
    class="card enter"
    style="padding:16px 18px;display:flex;align-items:center;gap:14;border-color:{nudgesActive
      ? 'var(--line)'
      : 'var(--clay-soft)'}"
  >
    <span
      style="width:42px;height:42px;border-radius:13px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:{nudgesActive
        ? 'var(--accent-soft)'
        : 'var(--clay-soft)'};color:{nudgesActive ? 'var(--accent-ink)' : 'var(--clay-ink)'}"
    >
      <Icon name={nudgesActive ? 'bell' : 'pause'} size={21} />
    </span>
    <div style="flex:1">
      <div style="font-weight:700;font-size:16px">{nudgesActive ? 'Nudges active' : 'Nudges paused'}</div>
      <div class="faint" style="font-size:13px;margin-top:1px">
        {nudgesActive ? "You're always one tap from silence." : 'Nothing will cue you. Resume anytime.'}
      </div>
    </div>
    <Toggle bind:on={nudgesActive} label="Nudges active" />
  </div>

  <button type="button" class="btn btn--soft btn--full" style="margin-top:12px;gap:9px" onclick={testEvaluate}>
    <Icon name="bell" size={18} /> Preview a gentle nudge
  </button>

  <div class="sectlabel">Your rules</div>

  {#if loading}
    <p class="loading-state">Loading nudge rules…</p>
  {:else if rules.length === 0}
    <div class="card empty-state">
      <div class="empty-state__title">No rules yet</div>
      <p class="muted" style="margin-top:6px;font-size:15px">Nudges will appear here once configured.</p>
    </div>
  {:else}
    <div class="stagger">
      {#each rules as rule (rule.id)}
        <div
          class="card"
          style="padding:15px 16px;margin-bottom:9px;display:flex;gap:13px;align-items:flex-start;opacity:{!nudgesActive || !rule.enabled
            ? 0.62
            : 1}"
        >
          <span class="list-row__icon" style="margin-top:1px">
            <Icon name={contextIcon(rule.context_slug)} size={18} />
          </span>
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:15.5px;line-height:1.25">{rule.name}</div>
            {#if rule.cron_or_ha_trigger}
              <div class="metatag" style="margin-top:6px">
                <Icon name="clock" size={12} /> {rule.cron_or_ha_trigger}
              </div>
            {/if}
            <span
              class="chip"
              style="margin-top:9px;pointer-events:none;font-size:10.5px;padding:4px 9px;color:{rule.intensity === 'gentle'
                ? 'var(--accent-ink)'
                : 'var(--clay-ink)'}"
              >{rule.intensity}</span
            >
          </div>
          <Toggle on={rule.enabled} label={`Toggle ${rule.name}`} />
        </div>
      {/each}
    </div>
  {/if}

  <div class="card card--inset" style="padding:15px 16px;margin-top:18px;display:flex;gap:11px">
    <Icon name="leaf" size={18} color="var(--good)" />
    <p style="font-size:13px;line-height:1.5;color:var(--ink-2);margin:0">
      Nudges never escalate, shame, or chain. Every cue is salient but easy to dismiss — accountability without
      harassment.
    </p>
  </div>
</main>