<script lang="ts">
  export let name: string;
  export let size = 22;
  export let stroke = 1.85;
  export let color = 'currentColor';
</script>

<svg width={size} height={size} viewBox="0 0 24 24" style="display:block;flex-shrink:0" aria-hidden="true">
  {#if name === 'now'}
    <circle cx="12" cy="12" r="3.4" fill="none" {stroke} stroke-width={stroke} stroke-linecap="round" />
    <path
      d="M12 3v2.3M12 18.7V21M3 12h2.3M18.7 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"
      fill="none"
      stroke={color}
      stroke-width={stroke}
      stroke-linecap="round"
    />
  {:else if name === 'tasks'}
    <path d="M9 6h11M9 12h11M9 18h11" fill="none" stroke={color} stroke-width={stroke} stroke-linecap="round" />
    <path
      d="M4 6l1 1 1.8-2M4 12l1 1 1.8-2M4 18l1 1 1.8-2"
      fill="none"
      stroke={color}
      stroke-width={stroke}
      stroke-linecap="round"
    />
  {:else if name === 'timeline'}
    <rect x="3.5" y="4.5" width="17" height="16" rx="3" fill="none" stroke={color} stroke-width={stroke} />
    <path
      d="M3.5 9h17M8 3v3M16 3v3M7.5 13h4M7.5 16.5h7"
      fill="none"
      stroke={color}
      stroke-width={stroke}
      stroke-linecap="round"
    />
  {:else if name === 'focus'}
    <circle cx="12" cy="13" r="7.2" fill="none" stroke={color} stroke-width={stroke} />
    <path d="M12 13l3-3M9 2.5h6M12 5.8V2.5" fill="none" stroke={color} stroke-width={stroke} stroke-linecap="round" />
  {:else if name === 'more'}
    <circle cx="5" cy="12" r="1.6" fill={color} />
    <circle cx="12" cy="12" r="1.6" fill={color} />
    <circle cx="19" cy="12" r="1.6" fill={color} />
  {:else if name === 'plus'}
    <path d="M12 5v14M5 12h14" fill="none" stroke={color} stroke-width={stroke} stroke-linecap="round" />
  {:else if name === 'spark'}
    <path
      d="M12 3l1.7 5.1L19 9.8l-4.3 3.1L16 18l-4-3-4 3 1.3-5.1L5 9.8l5.3-1.7L12 3z"
      fill="none"
      stroke={color}
      stroke-width={stroke}
      stroke-linecap="round"
    />
  {:else if name === 'star'}
    <path
      d="M12 3.5l2.4 5 5.4.6-4 3.7 1.1 5.3L12 20.4 7.1 18.1l1.1-5.3-4-3.7 5.4-.6 2.4-5z"
      fill="none"
      stroke={color}
      stroke-width={stroke}
      stroke-linecap="round"
    />
  {:else if name === 'chevR'}
    <path d="M9 5l7 7-7 7" fill="none" stroke={color} stroke-width={stroke} stroke-linecap="round" />
  {:else if name === 'chevL'}
    <path d="M15 5l-7 7 7 7" fill="none" stroke={color} stroke-width={stroke} stroke-linecap="round" />
  {:else if name === 'check'}
    <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke={color} stroke-width={stroke} stroke-linecap="round" />
  {:else if name === 'play'}
    <path d="M7 5.5l11 6.5-11 6.5z" fill={color} />
  {:else if name === 'pause'}
    <rect x="7" y="6" width="3.4" height="12" rx="1.2" fill={color} />
    <rect x="13.6" y="6" width="3.4" height="12" rx="1.2" fill={color} />
  {:else if name === 'bell'}
    <path
      d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"
      fill="none"
      stroke={color}
      stroke-width={stroke}
      stroke-linecap="round"
    />
    <path d="M10 19a2 2 0 0 0 4 0" fill="none" stroke={color} stroke-width={stroke} stroke-linecap="round" />
  {:else if name === 'gear'}
    <circle cx="12" cy="12" r="3.1" fill="none" stroke={color} stroke-width={stroke} />
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      fill="none"
      stroke={color}
      stroke-width={stroke}
      stroke-linecap="round"
    />
  {:else if name === 'clock'}
    <circle cx="12" cy="12" r="8" fill="none" stroke={color} stroke-width={stroke} />
    <path d="M12 7.5V12l3 2" fill="none" stroke={color} stroke-width={stroke} stroke-linecap="round" />
  {:else if name === 'flame'}
    <path
      d="M12 3c1 3-2 4-2 7a2 2 0 0 0 4 0c0 0 2 2 2 4a4 4 0 1 1-8 0c0-4 4-5 4-11z"
      fill="none"
      stroke={color}
      stroke-width={stroke}
      stroke-linecap="round"
    />
  {:else if name === 'home'}
    <path d="M4 11l8-6.5 8 6.5" fill="none" stroke={color} stroke-width={stroke} stroke-linecap="round" />
    <path d="M6 9.5V20h12V9.5" fill="none" stroke={color} stroke-width={stroke} stroke-linecap="round" />
  {:else if name === 'chart'}
    <path d="M4 20V10M10 20V4M16 20v-7" fill="none" stroke={color} stroke-width={stroke} stroke-linecap="round" />
    <path d="M3 20h18" fill="none" stroke={color} stroke-width={stroke} stroke-linecap="round" />
  {:else if name === 'pin'}
    <path
      d="M12 21s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10z"
      fill="none"
      stroke={color}
      stroke-width={stroke}
      stroke-linecap="round"
    />
    <circle cx="12" cy="11" r="2.2" fill="none" stroke={color} stroke-width={stroke} />
  {:else if name === 'arrowR'}
    <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke={color} stroke-width={stroke} stroke-linecap="round" />
  {:else if name === 'x'}
    <path d="M6 6l12 12M18 6L6 18" fill="none" stroke={color} stroke-width={stroke} stroke-linecap="round" />
  {:else if name === 'snooze'}
    <circle cx="12" cy="13" r="7.5" fill="none" stroke={color} stroke-width={stroke} />
    <path d="M12 9v4l2.5 1.5M9 3h4l-4 4h4" fill="none" stroke={color} stroke-width={stroke} stroke-linecap="round" />
  {:else if name === 'leaf'}
    <path
      d="M4 20c0-9 7-15 16-15 0 9-7 15-16 15zM4 20c4-6 8-9 12-11"
      fill="none"
      stroke={color}
      stroke-width={stroke}
      stroke-linecap="round"
    />
  {/if}
</svg>