# Phase 7: Testing Guide

## Prerequisites

- App running locally (`npm run dev`)
- Clear localStorage for a fresh start if needed: `localStorage.removeItem('defense_tapboard_state')`
- Navigate to Setup page

---

## 1. Preset Manager

### 1.1 View Presets
- [ ] Scroll to "Preset Manager" section on Setup
- [ ] Default 5 presets visible (Chicago Pin, Death River, Miami Quick, Tampa Bow, Lakers Tap)
- [ ] Filter chips show correct counts: All (5), Active (5), Favorites (3), Inactive (0)

### 1.2 Add Preset
- [ ] Click "+ Add Preset" button
- [ ] Leave name empty → submit → red ring on name field
- [ ] Fill: Name = "Test Preset", Play Type = Chicago, Blitz = Sam, Line Stunt = Pin
- [ ] Check "Favorite" checkbox
- [ ] Click "Add Preset" → toast "Preset added"
- [ ] New preset appears at bottom of list
- [ ] Filter counts update (All: 6, Favorites: 4)

### 1.3 Edit Preset
- [ ] Click "Edit" on any preset → edit form appears
- [ ] Change name and blitz → click "Save Changes" → toast "Preset updated"
- [ ] Preset row reflects new values

### 1.4 Delete Preset
- [ ] Click "Delete" → "Confirm" button appears
- [ ] Click "Cancel" → confirmation dismissed
- [ ] Click "Delete" again → click "Confirm" → toast "Preset deleted"
- [ ] Preset disappears from list
- [ ] Historical plays using that preset remain intact

### 1.5 Favorite / Unfavorite
- [ ] Click "Favorite" on a non-favorite preset → star icon fills, "★ Fav" badge appears
- [ ] Click "Unfavorite" on a favorite preset → badge removed

### 1.6 Activate / Deactivate
- [ ] Click "Deactivate" on an active preset → "Inactive" badge appears, row dims
- [ ] Switch to "Inactive" filter → deactivated preset visible
- [ ] Click "Activate" → preset returns to active state
- [ ] Switch to "Active" filter → preset visible again

### 1.7 Reorder
- [ ] Click up arrow on second preset → moves up
- [ ] Click down arrow → moves back down
- [ ] First preset has disabled up arrow, last has disabled down arrow

---

## 2. Lookup Manager

### 2.1 View Lookups
- [ ] Scroll to "Lookup Manager" section on Setup
- [ ] "Play Type" tab active by default, shows 6 values
- [ ] Click each tab: Blitz (10), Line Stunt (9), Outcome (7)
- [ ] Summary line shows "X active of Y total"

### 2.2 Add Lookup Value
- [ ] On "Play Type" tab, click "+ Add Value"
- [ ] Enter "Wildcat" → click "Add" → toast "Value added"
- [ ] "Wildcat" appears at bottom of list
- [ ] Try adding "Wildcat" again → toast with duplicate error

### 2.3 Edit Lookup Value
- [ ] Click "Edit" on a non-protected value → inline input appears
- [ ] Change value → press Enter or click away → toast "Value updated"
- [ ] Try editing to match an existing value → toast with duplicate error

### 2.4 Delete Lookup Value
- [ ] Click "×" on a non-protected, non-required value → "Delete" confirmation
- [ ] Click "Delete" → toast "Value removed"
- [ ] Value disappears from list

### 2.5 Protected Outcome Values
- [ ] Switch to "Outcome" tab
- [ ] All 7 default outcomes show "Required" badge in purple
- [ ] No "Edit", "Off", or "×" buttons on protected outcomes
- [ ] Verify "Turnover" specifically cannot be deleted, deactivated, or renamed

### 2.6 Dependency Protection
- [ ] Add a custom play type (e.g., "Shotgun")
- [ ] Create a preset using "Shotgun"
- [ ] Try to delete "Shotgun" from Lookup Manager → error toast naming the dependent preset

### 2.7 Toggle Active/Inactive
- [ ] Add a custom lookup value → click "Off" → value deactivated
- [ ] Click "On" → value reactivated
- [ ] Protected outcomes do NOT show the Off/On toggle

### 2.8 Reorder
- [ ] Click up/down arrows on lookup values
- [ ] Order changes reflected immediately
- [ ] First item has disabled up arrow, last has disabled down

---

## 3. Live Entry Integration

### 3.1 Presets Reflect Config
- [ ] Create/resume a game session → navigate to Live Entry
- [ ] Preset strip shows only **active** presets
- [ ] Favorites appear first in the strip
- [ ] Deactivate a preset in Setup → return to Live Entry → preset removed from strip
- [ ] Reactivate → preset returns

### 3.2 Lookup Values Reflect Config
- [ ] Play Type selector shows only active play types from Lookup Manager
- [ ] Blitz selector shows only active blitzes
- [ ] Line Stunt selector shows only active line stunts
- [ ] Outcome selector shows only active outcomes
- [ ] Add a new value in Setup → return to Live Entry → new value appears
- [ ] Deactivate a value in Setup → return to Live Entry → value removed

### 3.3 Save Play with Custom Config
- [ ] Select a custom-added play type, blitz, stunt, and any outcome
- [ ] Save play → play recorded with custom values
- [ ] Check recent plays feed → correct values shown

---

## 4. Persistence

### 4.1 Survives Refresh
- [ ] Make config changes (add preset, add lookup, reorder)
- [ ] Refresh browser
- [ ] All changes persisted — presets, lookups, ordering, favorites, active states

### 4.2 Session Switch
- [ ] Make config changes
- [ ] Switch to a different game session
- [ ] Config remains (presets and lookups are global, not per-session)

---

## 5. Sync

### 5.1 Config Changes Queue
- [ ] With Sheets connected, add a preset → check Queue Reliability section
- [ ] A sync job should appear and process
- [ ] Check Google Sheet Presets tab → new preset row

### 5.2 Lookup Changes Queue
- [ ] Add a lookup value → check queue
- [ ] Check Google Sheet Lookups tab → new row with lookup_id

### 5.3 Offline Resilience
- [ ] Go offline (disconnect network)
- [ ] Make config changes → changes apply locally
- [ ] Reconnect → queued changes sync automatically

---

## 6. Dashboard Compatibility

### 6.1 Historical Analytics Intact
- [ ] Log several plays
- [ ] Rename or deactivate a lookup value
- [ ] Dashboard still shows correct analytics for historical plays
- [ ] Protected outcomes remain stable for classification

---

## 7. Edge Cases

- [ ] Empty state: delete all presets → Preset Manager shows "No presets yet" message
- [ ] Empty lookup type: delete all custom values (can't delete protected) → protected ones remain
- [ ] Rapid operations: quickly add/edit/delete multiple presets → no crashes or state corruption
- [ ] Very long preset name → UI handles overflow gracefully
- [ ] Special characters in values → accepted and displayed correctly
