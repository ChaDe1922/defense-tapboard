# Phase 7: Adaptable App Configuration

## Overview

Phase 7 makes the Defense Tapboard fully configurable by coaches and staff without code edits. Two new management surfaces — **Preset Manager** and **Lookup Manager** — live on the Setup page and let users add, edit, delete, reorder, favorite, and activate/deactivate both call-package presets and the lookup values that populate Live Entry selectors.

All changes are **local-first**, persisted to localStorage immediately, and synced to Google Sheets via the existing queue architecture.

---

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/lib/id-utils.js` | Shared UUID generator (breaks circular dependency) |
| `src/lib/config-manager.js` | Pure CRUD functions, validation, protection rules, dependency checks |
| `src/components/PresetManager.jsx` | Full preset management UI with filtering, forms, reorder controls |
| `src/components/LookupManager.jsx` | Tabbed lookup value management UI with protection badges |

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/defaults.js` | Added `createDefaultLookups()`, re-exports `generateId` from `id-utils.js`, state version bumped to 2 |
| `src/lib/GameContext.jsx` | Added managed lookups to state, Phase 7 CRUD callbacks, sync triggers, v1→v2 migration |
| `src/lib/sync.js` | `buildPresetsPayload` now includes `source`/`deleted`/`updated_at`; `buildLookupsPayload` accepts managed lookups |
| `src/pages/Setup.jsx` | Imports and renders PresetManager + LookupManager (replaces old static Favorite Presets) |
| `src/pages/LiveEntry.jsx` | Uses `activePresetList`, `managedPlayTypes`, `managedBlitzes`, `managedStunts`, `managedOutcomes` from context instead of hardcoded arrays |
| `apps-script/Code.gs` | Updated PRESET_HEADERS and LOOKUP_HEADERS; seedLookups now supports upsert by `lookup_id` |

---

## Data Models

### Preset

```js
{
  id: string,           // UUID
  name: string,         // Display name
  playType: string,     // Must match active play_type lookup
  blitz: string,        // Must match active blitz lookup
  lineStunt: string,    // Must match active line_stunt lookup
  favorite: boolean,
  active: boolean,
  sortOrder: number,
  createdAt: string,    // ISO timestamp
  updatedAt: string,
  deleted: boolean,     // Soft delete
  source: string,       // 'default' | 'custom'
}
```

### Lookup Item

```js
{
  id: string,           // UUID
  lookupType: string,   // 'play_type' | 'blitz' | 'line_stunt' | 'outcome'
  value: string,        // Display value
  active: boolean,
  sortOrder: number,
  required: boolean,    // Cannot be deleted or deactivated
  protected: boolean,   // Cannot be renamed, deleted, or deactivated
  createdAt: string,
  updatedAt: string,
  deleted: boolean,     // Soft delete
}
```

---

## Protection Rules

### Required Outcomes (cannot be deleted, deactivated, or renamed)

- Tackle for loss
- Sack
- First down
- Under
- 5 yards gained
- Over 10 yards gained
- **Turnover** (especially protected)

These are marked with `required: true` and `protected: true` at seed time. The UI shows a "Required" badge and disables destructive controls.

### Dependency Safety

- Deleting a lookup value that is used by an active preset is **blocked** with a clear error message naming the dependent presets.
- Preset validation requires all referenced lookup values (playType, blitz, lineStunt) to exist in the active lookup lists.

---

## Preset Manager

Located on Setup page. Features:

- **Filter chips**: All, Active, Favorites, Inactive (with counts)
- **Add form**: Name, Play Type, Blitz, Line Stunt (dropdowns from active lookups), Favorite toggle, Active toggle
- **Edit form**: Same fields, inline editing
- **Reorder**: Up/down buttons per preset
- **Favorite/Unfavorite**: Toggle with star icon
- **Activate/Deactivate**: Toggle visibility in Live Entry
- **Delete**: Confirmation step, soft delete

### Live Entry Integration

- `activePresetList` derives from managed presets: active + not deleted, favorites first, then by sortOrder
- Changes in Setup are reflected **immediately** in Live Entry

---

## Lookup Manager

Located on Setup page. Features:

- **Type tabs**: Play Type, Blitz, Line Stunt, Outcome
- **Add form**: Inline text input
- **Edit**: Inline editing (disabled for protected values)
- **Reorder**: Up/down buttons
- **Activate/Deactivate**: Toggle (disabled for protected outcomes)
- **Delete**: Confirmation step, blocked for required/protected values, blocked if used by active presets

### Validation

- Empty/whitespace-only values rejected
- Duplicate values (case-insensitive) rejected
- Protected values cannot be renamed, deleted, or deactivated

---

## State Migration

### v1 → v2

On hydration, if `appState.lookups` is missing or empty:
1. Seed lookups from `createDefaultLookups()` (built from hardcoded arrays)
2. Bump version to 2

If preset IDs are numeric (legacy):
1. Migrate to UUID-based IDs via `migratePresets()`

---

## Sync Strategy

- Every preset/lookup CRUD action triggers a sync job via the existing queue
- `syncPresetsAfterChange()` → enqueues `upsertPresets` with full preset array
- `syncLookupsAfterChange()` → enqueues `seedLookups` with full lookup array
- When online, immediate processing triggered (500ms delay for state consistency)
- When offline, queued and replayed on reconnection
- Apps Script uses `upsertRow` by `preset_id` / `lookup_id` for idempotent writes

---

## What Remains for Later Phases

- Drag-and-drop reordering (currently up/down buttons)
- Bulk import/export of presets and lookups
- Season-wide templates
- Multi-user collaborative config editing
- Revision history for config changes
- Custom outcome classification (positive/neutral/negative) for new outcomes
