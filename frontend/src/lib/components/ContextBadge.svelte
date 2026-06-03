<script lang="ts">
  import Icon from './Icon.svelte';

  export let name: string;
  export let href: string | null = null;
</script>

{#if href}
  <a class="ctxbadge" {href}>
    <span class="ctxbadge__dot"></span>
    {name}
    <Icon name="chevR" size={14} stroke={2.2} />
  </a>
{:else}
  <span class="ctxbadge">
    <span class="ctxbadge__dot"></span>
    {name}
    <Icon name="chevR" size={14} stroke={2.2} />
  </span>
{/if}