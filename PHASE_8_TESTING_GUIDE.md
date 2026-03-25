# Phase 8: Correction Safety — Testing Guide

## Overview

Phase 8 adds safe play editing, soft delete, and audit trail capabilities to the Defense Tapboard. This guide provides a comprehensive testing checklist for coaches to validate correction functionality.

---

## Prerequisites

- App running locally or deployed
- Active game session with logged plays
- Navigate to Live Entry page

---

## 1. Edit Last Flow

### 1.1 Edit Last Button
- [ ] Click "Edit" button in Quick Actions row
- [ ] If no plays exist → toast "No plays to edit"
- [ ] If plays exist → Edit modal opens with last play's data

### 1.2 Edit Last Modal
- [ ] Modal shows "Edit Play #X" title
- [ ] All fields prefilled with current play values:
  - Play Type
  - Blitz
  - Line Stunt
  - Outcome
  - Quarter
- [ ] Correction reason field visible (optional)
- [ ] "Save Changes" button disabled until changes made

### 1.3 Make Corrections
- [ ] Change outcome from "Under" to "Turnover"
- [ ] "Save Changes" button becomes enabled
- [ ] Click "Save Changes"
- [ ] Modal closes
- [ ] Toast "Play corrected" appears
- [ ] Recent Plays updates immediately with new outcome

### 1.4 Corrected Status
- [ ] Edited play shows blue "Corrected" badge
- [ ] Dashboard analytics update immediately with new outcome
- [ ] Turnover count increases by 1

### 1.5 Persistence
- [ ] Refresh browser
- [ ] Corrected play still shows "Corrected" badge
- [ ] Corrected values persist

---

## 2. Edit Recent Play

### 2.1 Edit Any Recent Play
- [ ] Open Recent Plays section
- [ ] Each play row shows "Edit" button
- [ ] Click "Edit" on play #5 (not the last play)
- [ ] Edit modal opens with play #5 data

### 2.2 Edit Non-Last Play
- [ ] Change play type from "Chicago" to "Death"
- [ ] Add correction reason: "Wrong call logged"
- [ ] Click "Save Changes"
- [ ] Play #5 updates with new play type
- [ ] "Corrected" badge appears on play #5
- [ ] Dashboard analytics reflect the change

### 2.3 Edit Multiple Times
- [ ] Edit the same play again
- [ ] Change blitz from "Sam" to "Cyclone"
- [ ] Save changes
- [ ] Play still shows "Corrected" badge (not duplicated)
- [ ] Analytics update again

---

## 3. Soft Delete

### 3.1 Delete Confirmation
- [ ] Click "Delete" button on a recent play
- [ ] Button changes to "Confirm" and "Cancel"
- [ ] Click "Cancel"
- [ ] Confirmation dismissed, play unchanged

### 3.2 Confirm Delete
- [ ] Click "Delete" again
- [ ] Click "Confirm"
- [ ] Toast "Play deleted" appears
- [ ] Play disappears from Recent Plays list
- [ ] Play count badge decreases by 1

### 3.3 Analytics Impact
- [ ] Dashboard analytics update immediately
- [ ] Deleted play does NOT count in totals
- [ ] Deleted play does NOT appear in outcome counts
- [ ] Deleted play does NOT appear in combo analysis

### 3.4 Soft Delete Persistence
- [ ] Refresh browser
- [ ] Deleted play still absent from Recent Plays
- [ ] Analytics still exclude deleted play
- [ ] Play data preserved in state (not hard deleted)

---

## 4. Correction Validation

### 4.1 Required Fields
- [ ] Open Edit modal
- [ ] Clear play type field
- [ ] Try to save
- [ ] Red validation error appears
- [ ] Save button remains disabled until valid

### 4.2 Managed Lookup Values
- [ ] Edit modal dropdowns show only active lookup values
- [ ] Play Type dropdown matches Lookup Manager active values
- [ ] Blitz dropdown matches active blitzes
- [ ] Line Stunt dropdown matches active stunts
- [ ] Outcome dropdown matches active outcomes

### 4.3 Protected Outcomes
- [ ] Outcome dropdown includes all required outcomes
- [ ] "Turnover" always available (protected)
- [ ] Can correct to any valid outcome

---

## 5. Offline Correction

### 5.1 Offline Edit
- [ ] Go offline (disconnect network)
- [ ] Edit a play
- [ ] Save changes
- [ ] Changes apply locally immediately
- [ ] Toast confirms save

### 5.2 Offline Delete
- [ ] Still offline
- [ ] Delete a play
- [ ] Confirm deletion
- [ ] Play removed from Recent Plays
- [ ] Analytics update locally

### 5.3 Sync After Reconnect
- [ ] Reconnect to network
- [ ] Queue processes automatically
- [ ] Check Setup → Queue Reliability
- [ ] Correction jobs show as synced
- [ ] Check Google Sheet Plays tab
- [ ] Corrected plays show updated values
- [ ] Deleted plays show deleted=TRUE

---

## 6. Dashboard Compatibility

### 6.1 Corrected Play Analytics
- [ ] Log 5 plays with outcome "Under"
- [ ] Edit 2 of them to "Turnover"
- [ ] Dashboard shows:
  - Total plays: 5
  - Turnovers: 2
  - Under: 3
- [ ] Positive rate updates correctly

### 6.2 Deleted Play Exclusion
- [ ] Delete 1 play
- [ ] Dashboard shows:
  - Total plays: 4 (not 5)
  - Deleted play outcome not counted
- [ ] Recent plays feed excludes deleted play

### 6.3 Combo Analysis
- [ ] Edit a play's play type
- [ ] Dashboard combo analysis updates
- [ ] Old combo count decreases
- [ ] New combo count increases

---

## 7. Audit Trail

### 7.1 Audit Log Storage
- [ ] Open browser DevTools → Application → Local Storage
- [ ] Find `defense_tapboard_state`
- [ ] Verify `auditLog` array exists
- [ ] Edit a play
- [ ] Audit log entry created with:
  - entityType: "play"
  - actionType: "edit"
  - beforeSnapshot
  - afterSnapshot
  - fieldsChanged

### 7.2 Delete Audit Entry
- [ ] Delete a play
- [ ] New audit entry created with:
  - actionType: "soft_delete"
  - fieldsChanged: ["deleted"]

---

## 8. Edge Cases

### 8.1 Edit Last When Last is Deleted
- [ ] Delete the most recent play
- [ ] Click "Edit Last"
- [ ] Modal opens with the new last play (not deleted one)

### 8.2 Rapid Edits
- [ ] Edit a play
- [ ] Immediately edit it again
- [ ] Both edits save correctly
- [ ] No state corruption

### 8.3 Cancel Edit
- [ ] Open Edit modal
- [ ] Make changes
- [ ] Click "Cancel" or X button
- [ ] Modal closes
- [ ] Changes NOT saved
- [ ] Play unchanged

### 8.4 No Changes Edit
- [ ] Open Edit modal
- [ ] Don't change any fields
- [ ] "Save Changes" button disabled
- [ ] Message "No changes made" appears

---

## 9. Sync Verification

### 9.1 Google Sheets Plays Tab
After corrections sync, verify Plays tab shows:
- [ ] `edited` column = TRUE for corrected plays
- [ ] `corrected_status` column = "corrected"
- [ ] `deleted` column = TRUE for deleted plays
- [ ] `deleted_at` timestamp for deleted plays
- [ ] `last_corrected_at` timestamp for edited plays
- [ ] `correction_reason` if provided
- [ ] `revision` increments with each edit

### 9.2 Audit Log Tab
- [ ] Audit_Log tab includes correction entries
- [ ] Action types: edit_play, soft_delete_play
- [ ] Before/after snapshots in request_payload_summary

---

## 10. State Migration

### 10.1 Upgrade from Phase 7
- [ ] Clear localStorage
- [ ] Log some plays in Phase 7 format
- [ ] Refresh with Phase 8 code
- [ ] State migrates to version 3
- [ ] All plays have correction fields with safe defaults:
  - edited: false
  - correctedStatus: "original"
  - deleted: false
  - revision: 1

---

## Success Criteria

Phase 8 is successful if:

1. ✅ Edit Last opens real correction modal
2. ✅ Any recent play can be edited
3. ✅ Soft delete requires confirmation
4. ✅ Deleted plays excluded from analytics
5. ✅ Corrected plays show "Corrected" badge
6. ✅ Corrections persist across refresh
7. ✅ Corrections work offline and sync when online
8. ✅ Dashboard updates immediately after corrections
9. ✅ Audit trail captures all correction actions
10. ✅ No accidental data loss from single taps
11. ✅ Google Sheets receives correction metadata
12. ✅ State migration from Phase 7 works safely

---

## Known Limitations (Deferred Features)

- **Insert Missed Play**: Not implemented in Phase 8 (deferred to avoid complexity)
- **Restore/Undelete**: Not implemented (soft delete only)
- **Bulk Edit**: Not supported (one play at a time)
- **Revision History UI**: Audit log exists but no browsing UI
- **Correction Analytics**: No stats on how many plays were corrected

---

## Troubleshooting

### Edit modal doesn't open
- Check browser console for errors
- Verify plays array is not empty
- Verify editPlayRecord function exists in GameContext

### Changes don't persist
- Check localStorage quota
- Verify state persistence in DevTools
- Check for console errors during save

### Sync fails
- Verify VITE_APPS_SCRIPT_URL configured
- Check Apps Script deployment updated with Phase 8 headers
- Verify Google Sheet has correction columns

### Analytics don't update
- Verify getActivePlays filters deleted plays
- Check Dashboard summary useMemo dependencies
- Refresh Dashboard page
