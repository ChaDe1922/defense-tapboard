# Defense Tapboard

Tap-first sideline charting for defensive football. Log a play in a few taps on a phone, on a
field with no reliable signal, and have it land in a Google Sheet the coaching staff already
knows how to use.

**Live:** https://chade1922.github.io/defense-tapboard/

---

## The constraint that shaped the build

A coach charting a game has about four seconds between plays and frequently no usable data
connection. That rules out two things most web apps assume:

1. **Typing.** Every input that can be a finite value set is a tap target — down, distance,
   formation, personnel, outcome. Free text is the exception, not the default.
2. **A working network.** A save that fails because the stadium Wi-Fi dropped is a lost play,
   and a lost play is worse than no app at all.

So the app is **local-first**: every entry is written to local storage immediately and
confirmed to the user right away. Sync to Google Sheets happens in the background, and the
app stays fully usable whether or not it ever succeeds.

---

## Architecture

### Offline queue → retry → Sheets sync

```
  tap entry
     │
     ▼
 local storage ──► confirmed to user immediately
     │
     ▼
 queue-manager ──► dedupe by (entityType, actionType, entityId)
     │
     ▼
 queue-processor ──► sequential, locked (no race conditions)
     │
     ├── success ──► mark synced
     └── failure ──► retry-policy: 0s → 5s → 15s → 30s → 60s (capped)
                          │
                          ▼
                   Google Apps Script /exec ──► Google Sheet
```

| Module | Responsibility |
|---|---|
| `lib/queue-storage.js` | Durable local storage for pending jobs |
| `lib/queue-manager.js` | Job lifecycle — enqueue, dedupe, mark status |
| `lib/queue-processor.js` | Sequential drain with a lock, so two flushes can't collide |
| `lib/retry-policy.js` | Exponential backoff with a 60s cap, so a dead endpoint isn't hammered |
| `lib/network-status.js` | Tracks `navigator.onLine` **and** endpoint reachability |
| `lib/connection.js` | Whether the configured Sheet is actually usable |
| `lib/sheet-api.js` | The Apps Script POST boundary |
| `lib/sync.js` | Orchestrates the above into a background sync loop |

**Why dedupe and a lock:** a coach correcting the same play twice, or a flush firing while
the previous one is still in flight, must not produce two rows in the Sheet. Jobs carry a
dedupe key built from `(entityType, actionType, entityId)`, and the processor runs
sequentially under a lock.

**Why "online" isn't one boolean:** `navigator.onLine` only says the device has *a* network —
not that the Apps Script endpoint answers. `network-status.js` resolves a `syncMode` from
browser status, endpoint status, and whether a Sheet is configured at all, so the UI can tell
the difference between *offline*, *unconfigured*, and *endpoint unreachable*.

### The rest

- `lib/session-manager.js` — game/session state and lifecycle
- `lib/config-manager.js` + `lib/classification.js` — outcome classification. Coaches manage
  their own outcome vocabulary via lookups; hardcoded defaults remain as a fallback so
  existing charts keep classifying correctly.
- `lib/drive-manager.js` — drive-level grouping and summaries
- `lib/analytics.js` — dashboard aggregates
- `lib/design-tokens.js` + `lib/ThemeContext.jsx` — token-driven theming, incl. dark mode

---

## Run it locally

```bash
npm install
cp .env.example .env
# set VITE_APPS_SCRIPT_URL to your own Apps Script deployment (see below)
npm run dev
```

```bash
npm run build     # production build
npm run preview   # serve the build
npm run lint      # eslint
```

The app runs without a configured endpoint — it reports `syncMode: 'unconfigured'` and keeps
everything local, which is also the fastest way to try it.

### Google Sheets backend

`apps-script/Code.gs` is the server side. [`apps-script/SETUP.md`](apps-script/SETUP.md) walks
through deploying it and wiring up the Sheet.

> **Security note.** An Apps Script web app deployed as "anyone" accepts unauthenticated
> POSTs, which makes the `/exec` URL effectively a write credential for the backing Sheet.
> Keep it in `.env` (git-ignored) — never commit it — and rotate the deployment if it is ever
> exposed. Rotation is Deploy → Manage deployments → Archive, then create a new deployment.

---

## Repo layout

```
src/
  components/   tap-target UI — PlayRow, OutcomeSheet, QuickActionRow, PresetCard, …
  lib/          queue, sync, network, session, classification, analytics, theming
apps-script/    Code.gs (the Sheets backend) + SETUP.md
docs/           per-phase implementation notes, testing guides, and the Phase 9 UX audit
```

---

## Status

Working and deployed through Phase 10. `docs/PHASE_9_UX_AUDIT.md` and
`docs/PHASE_9_REFINEMENT_FIXES.md` are the most useful entry points into what was changed and
why; each phase also ships a testing guide.

Stack: React 19, Vite 8, React Router 7, Tailwind CSS v4 (via `@tailwindcss/vite`), and
lucide-react. Theme values come from the design tokens in `lib/design-tokens.js` rather than
being scattered through utility classes.
