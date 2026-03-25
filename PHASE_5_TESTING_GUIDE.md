# PHASE 5 TESTING GUIDE

**Manual Testing Checklist for Offline-First Reliability**

---

## SETUP

1. **Deploy Apps Script** (if not already done)
   - Open `apps-script/Code.gs` in Google Apps Script editor
   - Deploy as Web App
   - Copy deployment URL

2. **Configure App**
   - Set `VITE_APPS_SCRIPT_URL` in `.env`
   - Run `npm run dev`
   - Go to Setup page
   - Configure Google Sheets connection
   - Register sheet with admin key
   - Initialize sheet

3. **Verify Baseline**
   - Create a test session
   - Save 1-2 plays
   - Verify they appear in Google Sheet
   - Verify "Last synced" shows recent timestamp

---

## TEST SUITE

### Test 1: Good Network — Baseline Sync

**Goal:** Verify normal operation with good connectivity

**Steps:**
1. Ensure network is online
2. Create new game session
3. Save 3 plays using presets
4. Observe EntryHeader sync badge
5. Check Setup → Queue Reliability panel

**Expected:**
- [ ] Plays appear in UI immediately
- [ ] EntryHeader shows "Synced" (green) within 2-3 seconds
- [ ] Setup shows "Network status: online"
- [ ] Setup shows "Last synced: just now"
- [ ] Google Sheet has 3 new play rows with correct play_id
- [ ] Queue shows 0 pending jobs

---

### Test 2: Offline Entry — Queue Accumulation

**Goal:** Verify plays can be entered while completely offline

**Steps:**
1. Open DevTools → Network tab
2. Select "Offline" from throttling dropdown
3. Save 5 plays
4. Check EntryHeader
5. Check Setup → Queue Reliability
6. Refresh page (still offline)
7. Verify plays still present

**Expected:**
- [ ] All 5 plays appear in UI immediately
- [ ] EntryHeader shows "Offline • 5 queued" (gray badge)
- [ ] Setup shows "Network status: offline"
- [ ] Setup shows "Queued plays: 5"
- [ ] After refresh, all 5 plays still in UI
- [ ] Queue still shows 5 pending jobs

---

### Test 3: Reconnect — Automatic Replay

**Goal:** Verify queue processes automatically when network returns

**Steps:**
1. Continue from Test 2 (5 queued plays)
2. Go back online (DevTools → Network → Online)
3. Wait 5-10 seconds
4. Observe EntryHeader
5. Check Setup → Queue Reliability
6. Check Google Sheet

**Expected:**
- [ ] EntryHeader changes from "Offline" to "5 queued" to "Synced"
- [ ] Setup shows "Network status: online"
- [ ] Setup shows "Queued plays: 0"
- [ ] Setup shows "Last synced: just now"
- [ ] Google Sheet has all 5 plays with correct play_id
- [ ] No duplicate rows in sheet

---

### Test 4: Weak Network — Retry with Backoff

**Goal:** Verify retry policy works with intermittent failures

**Steps:**
1. Temporarily break Apps Script URL (add "BROKEN" to end of URL in .env)
2. Restart dev server
3. Save 3 plays
4. Check EntryHeader (should show "3 queued")
5. Wait 30 seconds
6. Check Setup → Queue Reliability
7. Fix Apps Script URL (remove "BROKEN")
8. Restart dev server
9. Wait for automatic retry or click "Process queue now"

**Expected:**
- [ ] Plays save locally while endpoint broken
- [ ] EntryHeader shows "3 queued" or "Failed"
- [ ] After 30s, failed jobs have retry scheduled
- [ ] After fixing URL, queue processes within 30s
- [ ] All 3 plays sync successfully
- [ ] Google Sheet has all 3 plays

---

### Test 5: Duplicate Prevention — Multiple Retries

**Goal:** Verify no duplicate rows created by retries

**Steps:**
1. Save 1 play while online
2. Note the play_id in DevTools → Application → LocalStorage → `defense_tapboard_state`
3. Go offline
4. Click "Retry all pending" 3 times
5. Go back online
6. Click "Process queue now"
7. Check Google Sheet for that play_id

**Expected:**
- [ ] Only ONE row in Google Sheet for that play_id
- [ ] Row has correct data (not corrupted by retries)
- [ ] Queue shows job as "synced" not duplicated

---

### Test 6: Session Switching — Queue Scoping

**Goal:** Verify queue correctly scopes jobs to sessions

**Steps:**
1. Create Session A ("Game 1")
2. Save 2 plays in Session A
3. Go offline
4. Save 2 more plays in Session A
5. Create Session B ("Game 2")
6. Save 3 plays in Session B (still offline)
7. Check Setup → Sessions list
8. Go back online
9. Wait for queue to process

**Expected:**
- [ ] Session A shows 2 queued plays
- [ ] Session B shows 3 queued plays
- [ ] After sync, Session A plays have correct game_id for Session A
- [ ] After sync, Session B plays have correct game_id for Session B
- [ ] No cross-contamination between sessions

---

### Test 7: Page Refresh — Queue Persistence

**Goal:** Verify queue survives page refresh

**Steps:**
1. Go offline
2. Save 4 plays
3. Check EntryHeader (should show "Offline • 4 queued")
4. Refresh page (Cmd+R or F5)
5. Check EntryHeader
6. Check Setup → Queue Reliability

**Expected:**
- [ ] After refresh, active session restored
- [ ] After refresh, all 4 plays still in UI
- [ ] After refresh, EntryHeader still shows "Offline • 4 queued"
- [ ] After refresh, queue still shows 4 pending jobs
- [ ] No jobs lost or duplicated

---

### Test 8: Tab Close and Reopen — Full Persistence

**Goal:** Verify queue survives complete tab closure

**Steps:**
1. Go offline
2. Save 3 plays
3. Close browser tab completely
4. Reopen app in new tab
5. Check if session and plays restored
6. Go online
7. Wait for automatic sync

**Expected:**
- [ ] Active session restored
- [ ] All 3 plays present in UI
- [ ] Queue restored with 3 pending jobs
- [ ] After going online, queue processes automatically
- [ ] All 3 plays sync to Google Sheet

---

### Test 9: Connection Not Registered — Blocked Queue

**Goal:** Verify queue doesn't hammer endpoint when connection invalid

**Steps:**
1. Go to Setup → Google Sheets Connection
2. Clear registration (or change spreadsheet URL to unregistered sheet)
3. Save 2 plays
4. Check Setup → Queue Reliability
5. Wait 60 seconds
6. Check queue status

**Expected:**
- [ ] Plays save locally
- [ ] Queue shows 2 pending jobs
- [ ] Setup shows "Connection status: unregistered"
- [ ] Queue does NOT process (no failed attempts)
- [ ] After 60s, queue still shows 2 pending (not failed)
- [ ] No error spam in console

---

### Test 10: Manual Retry — User Control

**Goal:** Verify manual retry buttons work

**Steps:**
1. Go offline
2. Save 5 plays
3. Go back online
4. Click "Process queue now" button on Setup page
5. Observe results

**Expected:**
- [ ] Button triggers queue processing
- [ ] Toast shows "5 records synced" or similar
- [ ] Queue clears to 0 pending
- [ ] Google Sheet has all 5 plays

---

### Test 11: Long Offline Session — Large Queue

**Goal:** Verify app handles larger queues gracefully

**Steps:**
1. Go offline
2. Save 20 plays across 2 quarters
3. Check app performance (UI responsiveness)
4. Refresh page
5. Go back online
6. Wait for automatic processing

**Expected:**
- [ ] App remains responsive during offline entry
- [ ] All 20 plays appear in UI immediately
- [ ] Queue shows 20 pending jobs
- [ ] After refresh, all 20 plays still present
- [ ] After going online, all 20 plays sync (may take 30-60s)
- [ ] No UI jank or freezing during sync

---

### Test 12: Mixed Success/Failure — Partial Sync

**Goal:** Verify queue handles partial failures gracefully

**Steps:**
1. Save 3 plays while online (should sync)
2. Break Apps Script URL
3. Save 3 more plays (should queue)
4. Fix Apps Script URL
5. Wait for retry
6. Check results

**Expected:**
- [ ] First 3 plays sync immediately
- [ ] Next 3 plays queue when endpoint broken
- [ ] After fixing endpoint, queued plays sync
- [ ] No duplicate rows for first 3 plays
- [ ] All 6 plays present in Google Sheet

---

## EDGE CASES

### Edge Case 1: Rapid Save Spam
**Test:** Save 10 plays as fast as possible  
**Expected:** All saves work, queue dedupes if needed, no crashes

### Edge Case 2: Network Flapping
**Test:** Toggle online/offline rapidly 5 times while queue processing  
**Expected:** Queue handles gracefully, no duplicate jobs, eventual consistency

### Edge Case 3: Very Old Queued Jobs
**Test:** Queue jobs, wait 24 hours, process  
**Expected:** Jobs still process correctly (no expiration)

### Edge Case 4: localStorage Full
**Test:** Fill localStorage to near capacity  
**Expected:** App shows error gracefully, doesn't crash

---

## VERIFICATION CHECKLIST

After running all tests, verify:

- [ ] No duplicate play rows in Google Sheet (check by play_id)
- [ ] All game rows have correct status and play counts
- [ ] Audit_Log shows all sync operations
- [ ] No JavaScript errors in console
- [ ] No infinite retry loops
- [ ] Queue size stays reasonable (< 100 jobs)
- [ ] App remains fast and responsive
- [ ] EntryHeader sync badge always accurate
- [ ] Setup Queue Reliability panel always accurate
- [ ] "Last synced" timestamp updates correctly

---

## DEBUGGING TIPS

### Check Queue State
```javascript
// In browser console:
JSON.parse(localStorage.getItem('defense_tapboard_sync_queue'))
```

### Check App State
```javascript
// In browser console:
JSON.parse(localStorage.getItem('defense_tapboard_state'))
```

### Force Queue Processing
```javascript
// In browser console (if exposed):
window.processQueue()
```

### Clear Queue (Emergency)
```javascript
// In browser console:
localStorage.removeItem('defense_tapboard_sync_queue')
```

### Monitor Network Events
```javascript
// In browser console:
window.addEventListener('online', () => console.log('ONLINE'));
window.addEventListener('offline', () => console.log('OFFLINE'));
```

---

## KNOWN LIMITATIONS

1. **Max Queue Size:** No hard limit, but auto-prunes old synced jobs
2. **Max Retry Attempts:** 10 attempts per job (configurable)
3. **Retry Backoff Cap:** 60 seconds (won't retry faster than every 60s after 5 attempts)
4. **localStorage Limit:** ~5-10MB depending on browser
5. **Single Connection:** Only one active sheet connection supported

---

## SUCCESS CRITERIA

Phase 5 testing is complete when:

✅ All 12 main tests pass  
✅ All edge cases handled gracefully  
✅ No duplicate rows in Google Sheet  
✅ No data loss scenarios found  
✅ App remains fast and responsive  
✅ Coach can log continuously without interruption  

**If all criteria met, Phase 5 is production-ready.**
