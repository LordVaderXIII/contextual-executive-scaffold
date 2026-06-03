<script lang="ts">
  interface Props {
    on?: boolean;
    label?: string;
  }

  let { on = $bindable(false), label = '' }: Props = $props();
</script>

<button
  type="button"
  class="toggle"
  class:on
  aria-pressed={on}
  aria-label={label || undefined}
  onclick={() => (on = !on)}
>
  <span class="toggle__knob"></span>
</button>