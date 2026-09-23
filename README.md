# Defense Tapboard

A phone app for charting defensive football plays from the sideline.

**Live:** https://chade1922.github.io/defense-tapboard/

## Why it works the way it does

A coach charting a game has about four seconds between plays, is standing up holding a phone
in one hand, and usually has no usable data connection. Those three facts rule out most of
what a normal web app assumes.

So the app follows two rules.

**Don't make anyone type.** Anything with a fixed set of answers is a tap target: down,
distance, formation, personnel, outcome. Free text exists, but you should almost never need
it.

**Never lose a play to a bad connection.** When you tap, the play is saved to the phone
immediately and confirmed on screen right away. Nothing waits on the network. Syncing to
Google Sheets happens quietly in the background, and the app works exactly the same whether
that succeeds or not. You can chart a whole game with no signal and sync from the parking lot.

It writes to a Google Sheet because that is what the coaching staff already knows how to use.
No new tool for anyone to learn on the receiving end.

## What happens after a tap

The background sync is where most of the interesting code lives. Step by step:

1. The play goes into local storage, and a sync job goes onto a queue.
2. The queue throws out duplicates. Each job carries a key made from the entity type, the
   action, and the record id, so correcting the same play twice doesn't produce two rows in
   the Sheet.
3. A processor drains the queue one job at a time behind a lock, so two flushes can't run at
   once and collide.
4. Failures back off instead of hammering: retry right away, then at 5s, 15s, 30s, and 60s
   from there on.
5. On success, the job is marked synced and dropped.

The pieces, all in `src/lib/`:

| File | What it does |
|---|---|
| `queue-storage.js` | Keeps pending jobs on disk so a refresh doesn't lose them |
| `queue-manager.js` | Creates jobs, dedupes them, tracks their status |
| `queue-processor.js` | Drains the queue, one at a time, under a lock |
| `retry-policy.js` | Works out when to try again after a failure |
| `network-status.js` | Tracks whether the device is online *and* whether the endpoint answers |
| `connection.js` | Whether the configured Sheet is actually usable |
| `sheet-api.js` | The single place that talks to Apps Script |
| `sync.js` | Ties all of the above into the background loop |

### One note on "offline"

`navigator.onLine` is not enough on its own. It only tells you the device found *a* network,
not that the Apps Script endpoint is answering. Airport Wi-Fi that needs a login screen will
happily report you as online.

So `network-status.js` works out a `syncMode` from three things: what the browser says, what
the endpoint actually does when you talk to it, and whether a Sheet has been configured at
all. That way the UI can tell the difference between "you're offline", "you never set up a
Sheet", and "the Sheet is set up but not responding" instead of showing one vague error for
all three.

## The rest of the app

- `session-manager.js` handles game and session state.
- `config-manager.js` and `classification.js` handle outcome classification. Coaches define
  their own outcome vocabulary through lookups, with the old hardcoded defaults kept as a
  fallback so existing charts keep classifying correctly.
- `drive-manager.js` groups plays into drives and summarizes them.
- `analytics.js` does the dashboard aggregates.
- `design-tokens.js` and `ThemeContext.jsx` drive theming, including dark mode.

## Running it

```bash
npm install
cp .env.example .env
npm run dev
```

It runs fine without a configured endpoint. It reports `syncMode: 'unconfigured'`, keeps
everything local, and that is the fastest way to try it out. To sync for real, set
`VITE_APPS_SCRIPT_URL` in `.env` to your own Apps Script deployment.

```bash
npm run build     # production build
npm run preview   # serve the build
npm run lint      # eslint
```

### The Google Sheets side

`apps-script/Code.gs` is the server. [`apps-script/SETUP.md`](apps-script/SETUP.md) walks
through deploying it and connecting the Sheet.

> **Worth knowing:** an Apps Script web app deployed as "anyone" accepts unauthenticated
> POSTs. That makes the `/exec` URL effectively a write password for the Sheet behind it.
> Keep it in `.env`, which is git-ignored, and don't commit it. If it ever does get out,
> rotate it: Deploy → Manage deployments → Archive the old one → create a new deployment.

## Layout

```
src/
  components/   the tap targets — PlayRow, OutcomeSheet, QuickActionRow, PresetCard, …
  lib/          queue, sync, network, session, classification, analytics, theming
apps-script/    Code.gs (the Sheets backend) + SETUP.md
docs/           implementation notes and testing guides, one set per phase
```

## Where it stands

Working and deployed through Phase 10. If you want to see how it got here,
`docs/PHASE_9_UX_AUDIT.md` and `docs/PHASE_9_REFINEMENT_FIXES.md` are the best way in. Each
phase also has its own testing guide.

Built with React 19, Vite 8, React Router 7, Tailwind CSS v4 (through `@tailwindcss/vite`),
and lucide-react. Theme values come from `lib/design-tokens.js` rather than being scattered
across utility classes.
