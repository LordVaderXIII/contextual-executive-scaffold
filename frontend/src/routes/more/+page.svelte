<script lang="ts">
  import { darkMode } from '$lib/stores';
  import ListRow from '$lib/components/ListRow.svelte';
  import Toggle from '$lib/components/Toggle.svelte';
  import Icon from '$lib/components/Icon.svelte';
</script>

<main class="scroll stagger">
  <div class="sectlabel" style="margin-top:6px">Scaffolding</div>
  <div class="card card--flat" style="overflow:hidden;padding:0">
    <ListRow icon="bell" title="Gentle nudges" detail="External cues, on your terms" href="/nudges" />
    <ListRow icon="chart" title="Weekly review" detail="Patterns & reflections" href="/review" last />
  </div>

  <div class="sectlabel">System</div>
  <div class="card card--flat" style="overflow:hidden;padding:0">
    <ListRow icon="gear" title="Settings" detail="Home Assistant · AI · data" href="/settings" last />
  </div>

  <div class="card card--inset" style="padding:16px;margin-top:22px;display:flex;gap:12px">
    <Icon name="leaf" size={20} color="var(--accent-ink)" />
    <p style="font-size:13.5;line-height:1.5;color:var(--ink-2);margin:0">
      CES externalises structure where internal regulation is unreliable. It doesn't try to fix how your attention
      works — it builds reliable scaffolding around it.
    </p>
  </div>

  <div class="card" style="padding:14px 16px;margin-top:12px;display:flex;align-items:center;justify-content:space-between;gap:12px">
    <span style="font-weight:700;font-size:16px">Dark mode</span>
    <Toggle bind:on={$darkMode} label="Dark mode" />
  </div>
</main>