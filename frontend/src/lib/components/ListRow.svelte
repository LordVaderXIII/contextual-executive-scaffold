<script lang="ts">
  import Icon from './Icon.svelte';

  export let icon: string;
  export let title: string;
  export let detail = '';
  export let href: string | null = null;
  export let last = false;
</script>

{#if href}
  <a class="list-row" {href} style:border-bottom={last ? 'none' : undefined}>
    <span class="list-row__icon"><Icon name={icon} size={19} /></span>
    <span style="flex:1;min-width:0">
      <span class="list-row__title">{title}</span>
      {#if detail}<span class="list-row__detail">{detail}</span>{/if}
    </span>
    <Icon name="chevR" size={16} color="var(--ink-3)" stroke={2} />
  </a>
{:else}
  <div class="list-row" style:border-bottom={last ? 'none' : undefined}>
    <span class="list-row__icon"><Icon name={icon} size={19} /></span>
    <span style="flex:1;min-width:0">
      <span class="list-row__title">{title}</span>
      {#if detail}<span class="list-row__detail">{detail}</span>{/if}
    </span>
    <slot name="right" />
  </div>
{/if}