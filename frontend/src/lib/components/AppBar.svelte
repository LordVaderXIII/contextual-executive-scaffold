<script lang="ts">
  import Icon from './Icon.svelte';

  export let eyebrow = '';
  export let title = 'CES';
  export let backHref: string | null = null;
  export let showSettings = false;
</script>

<header class="appbar">
  <div class="appbar__row">
    <div style="display:flex;align-items:center;gap:11px;min-width:0">
      {#if backHref}
        <a class="iconbtn" href={backHref} aria-label="Back" style="margin-left:-2px">
          <Icon name="chevL" size={20} />
        </a>
      {/if}
      <div style="min-width:0">
        {#if eyebrow}
          <div class="appbar__eyebrow">{eyebrow}</div>
        {/if}
        <h1 class="appbar__title">{title}</h1>
      </div>
    </div>
    {#if showSettings}
      <a class="iconbtn" href="/settings" aria-label="Settings">
        <Icon name="gear" size={21} />
      </a>
    {/if}
  </div>
</header>