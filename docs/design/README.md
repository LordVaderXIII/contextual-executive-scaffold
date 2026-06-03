# CES design archive

Interactive design prototypes from the App Design Document (May 2026) are stored under `archive/`:

| File | Role |
|------|------|
| `CES.html` | Full static prototype with design tokens |
| `ces-app.jsx` | Root navigation, tab bar, nudge banner |
| `ces-screens-*.jsx` | Screen modules (Now, Tasks, Timeline, Focus, System) |
| `ces-store.jsx` | Seed data and state patterns |
| `ces-ui.jsx` | Shared UI primitives and icons |
| `ios-frame.jsx` | Device chrome for previews |
| `tweaks-panel.jsx` | Theme/paper tweaks panel |

Screenshot PNGs are omitted from git (see `.gitignore`); they remain in `contextual-executive-scaffold.zip` at the repo root.

The SvelteKit frontend implements the same information architecture: **Now**, **Tasks**, **Today** (timeline), **Focus**, **More** (nudges, review, settings), with calm warm-minimal tokens from `CES.html`.