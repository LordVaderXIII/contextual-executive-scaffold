import { writable } from 'svelte/store';

export const darkMode = writable(false);
export const currentCtx = writable<{ name: string; slug: string; accent_hue: number } | null>(null);