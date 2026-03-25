# Phase 8: Correction Safety — Architecture Documentation

## Overview

Phase 8 adds safe play editing, soft delete, and audit trail capabilities to the Defense Tapboard. This phase enables coaches to correct mistakes made during fast entry without permanently damaging logged data.

---

## Core Principles

1. **Fast entry remains primary** — corrections support the tapboard, don't replace it
2. **Soft delete over hard delete** — preserve traceability
3. **Local-first corrections** — changes apply immediately, sync second
4. **Audit trail for accountability** — every correction is traceable
5. **No destructive single taps** — confirmation required for deletes
6. **Dashboard integrity** — analytics reflect corrected current state

---

## Data Models

### Extended Play Record

```js
{
  // Existing fields
  id: string,
  sessionId: string,
  playNumber: number,
  playType: string,
  blitz: string,
  lineStunt: string,
  outcome: string,
  quarter: string,
  presetId: string | null,
  presetName: string | null,
  presetCustomized: boolean,
  entryMode: "preset" | "manual" | "repeat" | "inserted",
  createdAt: string,
  updatedAt: string,
  syncStatus: "queued" | "synced" | "failed",
  
  // Phase 8: Correction fields
  edited: boolean,                    // Has this play been corrected?
  correctedStatus: "original" | "corrected" | "deleted",
  deleted: boolean,                   // Soft delete flag
  deletedAt: string | null,
  deletedBy: string | null,
  lastCorrectedAt: string | null,
  lastCorrectedBy: string | null,
  correctionReason: string | null,    // Optional user-provided reason
  inserted: boolean,                  // Reserved for future insert flow
  insertedAt: string | null,
  revision: number,                   // Increments with each edit
}
```

### Audit Entry

```js
{
  auditId: string,                    // UUID
  entityType: "play",
  entityId: string,                   // play.id
  sessionId: string,
  actionType: "create" | "edit" | "soft_delete" | "restore" | "insert",
  createdAt: string,
  createdBy: string,                  // "user"
  reason: string | null,
  beforeSnapshot: object,             // Play values before change
  afterSnapshot: object,              // Play values after change
  fieldsChanged: string[],            // ["outcome", "playType"]
  syncStatus: "queued" | "synced" | "failed",
}
```

---

## Architecture Components

### New Files

| File | Purpose |
|------|---------|
| `src/lib/corrections.js` | Correction data models, edit/delete helpers, audit entry creation |
| `src/components/PlayCorrectionForm.jsx` | Reusable form for editing plays (Edit Last, Edit Recent) |

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/defaults.js` | Added `auditLog: []` to state, bumped version to 3 |
| `src/lib/GameContext.jsx` | Added v2→v3 migration, correction actions, audit log storage |
| `src/pages/LiveEntry.jsx` | Added Edit Last modal, edit/delete actions on Recent Plays, correction badges |
| `src/components/QuickActionRow.jsx` | Implemented real Edit Last flow (no longer placeholder) |
| `apps-script/Code.gs` | Extended PLAY_HEADERS with correction fields, updated upsertPlay handler |

---

## Correction Workflows

### 1. Edit Last Flow

**User Action:** Tap "Edit" in Quick Actions

**System Behavior:**
1. Find last non-deleted play
2. Open PlayCorrectionForm modal with prefilled values
3. User modifies fields (play type, blitz, stunt, outcome, quarter)
4. User optionally adds correction reason
5. User saves changes

**State Updates:**
1. `editPlay()` helper creates updated play + audit entry
2. Play marked as `edited: true`, `correctedStatus: "corrected"`
3. `revision` increments
4. `lastCorrectedAt` timestamp set
5. Audit entry added to `appState.auditLog`
6. Play sync job enqueued
7. Dashboard analytics update immediately

### 2. Edit Recent Play Flow

**User Action:** Tap "Edit" button on any Recent Play row

**System Behavior:**
- Same as Edit Last, but targets specific play by ID
- Modal shows "Edit Play #X" with play number
- All other behavior identical

### 3. Soft Delete Flow

**User Action:** Tap "Delete" button on Recent Play row

**System Behavior:**
1. Button changes to "Confirm" / "Cancel"
2. User must tap "Confirm" to proceed
3. `softDeletePlay()` helper creates updated play + audit entry
4. Play marked as `deleted: true`, `correctedStatus: "deleted"`
5. `deletedAt` timestamp set
6. Audit entry created with `actionType: "soft_delete"`
7. Play sync job enqueued
8. Play disappears from Recent Plays (filtered out)
9. Dashboard analytics exclude deleted play

**Important:** Play record remains in `playsBySessionId` for audit trail and sync. Not hard deleted.

---

## State Migration

### v2 → v3 Migration

On hydration, if `persisted.version < 3`:

1. Add `auditLog: []` if missing
2. Migrate all plays in `playsBySessionId`:
   - Add correction fields with safe defaults
   - `edited: false`
   - `correctedStatus: "original"`
   - `deleted: false`
   - `revision: 1`
3. Set `persisted.version = 3`

Migration is **non-destructive** — existing plays retain all original data.

---

## Analytics Compatibility

### Dashboard Summary

**Phase 8 Change:** Dashboard analytics now use `getActivePlays()` helper.

```js
const activePlays = getActivePlays(plays); // Filters out deleted plays
const total = activePlays.length;
const turnovers = activePlays.filter(p => p.outcome === 'Turnover').length;
// ... etc
```

**Rules:**
- Deleted plays (`deleted: true`) excluded from all analytics
- Corrected plays use their **current corrected values**
- Inserted plays (future) count normally
- Original plays count normally

### Recent Plays Display

- Deleted plays filtered out: `plays.filter(p => !p.deleted)`
- Corrected plays show blue "Corrected" badge
- Edit/Delete actions available on each row

---

## Sync Architecture

### Correction Sync Jobs

Every correction action creates/updates a sync job:

- **Edit play** → `upsertPlay` job with updated play data
- **Delete play** → `upsertPlay` job with `deleted: true`
- **Restore play** (if implemented) → `upsertPlay` job with `deleted: false`

### Sync Payload

Play sync payload now includes:

```js
{
  play_id: "...",
  // ... existing fields ...
  edited: true,
  corrected_status: "corrected",
  deleted: false,
  deleted_at: null,
  last_corrected_at: "2026-03-25T18:30:00.000Z",
  correction_reason: "Wrong outcome tapped",
  inserted: false,
  revision: 2
}
```

### Apps Script Updates

**PLAY_HEADERS** extended with:
```js
'edited', 'corrected_status', 'deleted', 'deleted_at', 
'last_corrected_at', 'correction_reason', 'inserted', 'revision'
```

**upsertPlay handler** maps correction fields to Google Sheets columns.

### Idempotency

- Stable `play_id` ensures idempotent upserts
- Multiple correction syncs for same play update the same row
- Revision number tracks edit count

---

## Correction Safety Rules

### Validation

1. **Required fields** — play type, blitz, line stunt, outcome must be filled
2. **Managed lookups** — values must come from active managed lookups
3. **No empty saves** — "Save Changes" disabled until changes made

### Confirmation

1. **Delete confirmation** — two-step process (Delete → Confirm)
2. **Cancel option** — user can abort delete
3. **No accidental taps** — single tap does NOT delete

### Protection

1. **Soft delete only** — play data preserved in state
2. **Audit trail** — every correction logged
3. **Sync queue** — corrections work offline, sync when online
4. **State persistence** — corrections survive refresh

---

## UI Components

### PlayCorrectionForm

**Props:**
- `play` — play record to edit
- `managedPlayTypes` — active play type lookup values
- `managedBlitzes` — active blitz lookup values
- `managedStunts` — active line stunt lookup values
- `managedOutcomes` — active outcome lookup values
- `onSave(updates)` — callback with correction data
- `onCancel()` — callback to close modal

**Features:**
- Prefilled form fields
- Validation with error messages
- Optional correction reason field
- "Save Changes" disabled until changes made
- "No changes made" message when no edits

### Edit Modal (LiveEntry)

- Fixed overlay with backdrop
- Mobile-responsive (bottom sheet on mobile, centered on desktop)
- Sticky header with close button
- Scrollable form content
- Max height 90vh

### Recent Plays Row Actions

- **Edit button** — blue, opens edit modal
- **Delete button** — red, shows confirmation
- **Confirm/Cancel** — inline confirmation UI
- **Corrected badge** — blue pill badge for edited plays

---

## Performance Considerations

### Local-First Updates

- Corrections apply to local state immediately
- No waiting for remote sync
- Dashboard updates in same render cycle
- Toast feedback confirms action

### Filtering Efficiency

- Deleted plays filtered at display time
- `getActivePlays()` helper used consistently
- No expensive recomputation on every render

### Sync Queue

- Correction jobs added to existing queue
- Processed with same reliability as play creation
- Offline corrections queued and replayed on reconnection

---

## Future Enhancements (Deferred)

### Insert Missed Play

**Status:** Deferred from Phase 8

**Reason:** Complex ordering and renumbering logic requires careful design to avoid data chaos.

**Future Approach:**
- Option A: Fractional play ordering (e.g., play 5.5 between 5 and 6)
- Option B: Safe renumbering with explicit user confirmation
- Requires stable `playOrder` separate from `playNumber`

### Restore/Undelete

**Status:** Not implemented

**Future Approach:**
- Add `restorePlayRecord()` action
- Set `deleted: false`, `correctedStatus: "corrected"`
- Create audit entry with `actionType: "restore"`
- Re-include in analytics

### Revision History UI

**Status:** Audit log exists, no browsing UI

**Future Approach:**
- Show correction history per play
- Display before/after snapshots
- Timeline view of all corrections
- Filter audit log by session or play

### Bulk Edit

**Status:** Not supported

**Future Approach:**
- Select multiple plays
- Apply same correction to batch
- Requires careful UX to avoid mistakes

---

## Testing Strategy

See `PHASE_8_TESTING_GUIDE.md` for comprehensive manual testing checklist.

**Key Test Scenarios:**
1. Edit Last flow
2. Edit any recent play
3. Soft delete with confirmation
4. Offline corrections
5. Dashboard analytics accuracy
6. Sync to Google Sheets
7. State migration from Phase 7
8. Audit trail creation

---

## Acceptance Criteria

Phase 8 is complete when:

1. ✅ Edit Last is a real working correction flow
2. ✅ Any recent play can be edited safely
3. ✅ Soft delete behavior exists (no hard delete)
4. ✅ Every edit/delete is traceable via audit trail
5. ✅ Corrected row status implemented and visible
6. ✅ Destructive actions require confirmation
7. ✅ Dashboard analytics reflect corrected current data
8. ✅ Deleted plays excluded from analytics
9. ✅ Corrections persist locally and survive refresh
10. ✅ Corrections work with queue/reliability model
11. ✅ Accidental taps do not permanently damage log
12. ✅ Apps Script handles correction metadata

---

## Summary

Phase 8 transforms the Defense Tapboard from a fast-entry-only tool into a **correction-safe** logging system. Coaches can now fix mistakes without fear of permanent data loss, while maintaining the speed and simplicity of the original tapboard experience.

**Key Achievements:**
- Real Edit Last flow (no longer placeholder)
- Edit any recent play with full validation
- Soft delete with confirmation (no accidental loss)
- Audit trail for every correction
- Dashboard analytics integrity maintained
- Local-first corrections with reliable sync
- State migration preserves existing data

**Product Impact:**
- Increased coach confidence in logged data
- Reduced anxiety about fast-entry mistakes
- Maintained tapboard speed and simplicity
- Foundation for future correction features
