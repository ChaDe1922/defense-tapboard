# PHASE 6 TESTING GUIDE

**Manual Testing Checklist for Real-Time Dashboard Analytics**

---

## SETUP

1. **Ensure Phase 5 is working**
   - Queue system operational
   - Sync working (online or queued)
   - Active session exists

2. **Start fresh test session**
   - Go to Setup
   - Create new game session: "Dashboard Test 3/25"
   - Opponent: "Test Opponent"
   - Resume the session

---

## TEST SUITE

### Test 1: Basic Dashboard Load

**Goal:** Verify dashboard loads correctly with active session

**Steps:**
1. Navigate to Dashboard
2. Observe header and layout

**Expected:**
- [ ] Dashboard loads without errors
- [ ] Header shows "Live dashboard"
- [ ] Game label and opponent displayed
- [ ] "Back to entry" button visible
- [ ] Filter controls visible (Quarter and Outcome)
- [ ] All filters default to "All"

---

### Test 2: Empty State — No Plays

**Goal:** Verify empty states when no plays logged

**Steps:**
1. With new session (0 plays), view Dashboard
2. Check all sections

**Expected:**
- [ ] KPI cards show: 0, 0, 0, 0, 0%
- [ ] Outcome breakdown shows "No plays logged yet"
- [ ] Call combo effectiveness shows "No plays logged yet"
- [ ] All usage count sections show "No data"
- [ ] Recent plays shows "No plays logged yet"

---

### Test 3: Real-Time Analytics — Save Plays

**Goal:** Verify dashboard updates immediately when plays are saved

**Steps:**
1. Go to Live Entry
2. Save play: Chicago • Heavy Sam • Pin → Sack
3. Go to Dashboard
4. Note values
5. Go to Live Entry
6. Save play: Death • Cyclone • River → Tackle for loss
7. Go to Dashboard
8. Verify updates

**Expected After Play 1:**
- [ ] Total Plays: 1
- [ ] Sacks: 1
- [ ] TFL: 0
- [ ] Turnovers: 0
- [ ] Positive Rate: 100%
- [ ] Outcome breakdown shows "Sack: 1"
- [ ] Combo shows "Chicago • Heavy Sam • Pin" with 1 call, 100% positive
- [ ] Recent plays shows play #1

**Expected After Play 2:**
- [ ] Total Plays: 2
- [ ] Sacks: 1
- [ ] TFL: 1
- [ ] Turnovers: 0
- [ ] Positive Rate: 100%
- [ ] Outcome breakdown shows both outcomes
- [ ] Two combos listed
- [ ] Recent plays shows both plays (most recent first)

---

### Test 4: Positive/Neutral/Negative Classification

**Goal:** Verify classification logic works correctly

**Steps:**
1. Save plays with different outcomes:
   - Play 3: → Turnover (Positive)
   - Play 4: → 5 yards gained (Neutral)
   - Play 5: → First down (Negative)
   - Play 6: → Over 10 yards gained (Negative)
2. Go to Dashboard
3. Check positive rate

**Expected:**
- [ ] Total Plays: 6
- [ ] Turnovers: 1
- [ ] Positive count: 4 (Sack, TFL, Turnover, + any others)
- [ ] Neutral count: 1 (5 yards gained)
- [ ] Negative count: 2 (First down, Over 10)
- [ ] Positive Rate: 67% (4/6)

---

### Test 5: Quarter Filter

**Goal:** Verify quarter filtering works

**Steps:**
1. Ensure plays exist in Q1 (default)
2. Change quarter to Q2 in Live Entry
3. Save 2 more plays in Q2
4. Go to Dashboard
5. Click "Q1" filter
6. Note values
7. Click "Q2" filter
8. Note values
9. Click "All" filter

**Expected:**
- [ ] "All" shows all plays (Q1 + Q2)
- [ ] "Q1" shows only Q1 plays
- [ ] "Q2" shows only Q2 plays
- [ ] KPI cards update correctly
- [ ] Outcome breakdown updates
- [ ] Combo stats update
- [ ] Usage counts update
- [ ] Recent plays DOES NOT filter (always shows latest 10)

---

### Test 6: Outcome Filter

**Goal:** Verify outcome classification filtering works

**Steps:**
1. With mixed outcomes from Test 4
2. Click "Positive" outcome filter
3. Note values
4. Click "Neutral" outcome filter
5. Note values
6. Click "Negative" outcome filter
7. Note values
8. Click "All"

**Expected:**
- [ ] "Positive" shows only positive outcomes (Sack, TFL, Under, Turnover)
- [ ] "Neutral" shows only neutral outcomes (5 yards gained)
- [ ] "Negative" shows only negative outcomes (First down, Over 10)
- [ ] KPI cards update correctly for each filter
- [ ] Outcome breakdown shows only filtered outcomes
- [ ] Combo stats show only combos with filtered outcomes
- [ ] Recent plays unaffected

---

### Test 7: Combined Filters

**Goal:** Verify quarter and outcome filters work together

**Steps:**
1. Click "Q1" quarter filter
2. Click "Positive" outcome filter
3. Note values
4. Change to "Q2" + "Negative"
5. Note values

**Expected:**
- [ ] Filters combine correctly (AND logic)
- [ ] Q1 + Positive shows only positive plays from Q1
- [ ] Q2 + Negative shows only negative plays from Q2
- [ ] KPI cards reflect combined filter
- [ ] All sections update correctly

---

### Test 8: Empty Filter Results

**Goal:** Verify empty state when filters produce zero results

**Steps:**
1. Apply filter combination that has no plays (e.g., Q4 + Positive if no Q4 plays)
2. Observe dashboard

**Expected:**
- [ ] Empty state message: "No plays match the current filters"
- [ ] "Reset filters" button visible
- [ ] Click "Reset filters" → filters reset to "All"
- [ ] Dashboard shows all plays again

---

### Test 9: Undo Compatibility

**Goal:** Verify dashboard updates when play is undone

**Steps:**
1. Note current dashboard values
2. Go to Live Entry
3. Click "Undo" to remove last play
4. Go to Dashboard
5. Verify values decreased

**Expected:**
- [ ] Total plays decreased by 1
- [ ] Outcome counts updated correctly
- [ ] Combo stats updated
- [ ] Usage counts updated
- [ ] Recent plays updated (last play removed)
- [ ] Positive rate recalculated

---

### Test 10: Session Switching

**Goal:** Verify dashboard shows correct session data when switching

**Steps:**
1. Create second session: "Session 2"
2. Save 3 plays in Session 2 (different from Session 1)
3. Go to Dashboard
4. Note values (should be Session 2 data)
5. Go to Setup
6. Resume Session 1
7. Go to Dashboard
8. Verify values changed to Session 1 data

**Expected:**
- [ ] Dashboard shows Session 2 data when Session 2 active
- [ ] Dashboard shows Session 1 data when Session 1 active
- [ ] No cross-contamination between sessions
- [ ] All metrics update correctly

---

### Test 11: Combo Effectiveness Ranking

**Goal:** Verify combo stats are sorted and displayed correctly

**Steps:**
1. Save multiple plays with same combo to make it "most used"
2. Save single plays with different combos
3. Go to Dashboard
4. Check Call Combo Effectiveness section

**Expected:**
- [ ] Combos sorted by calls descending (most used first)
- [ ] Positive rate displayed as percentage
- [ ] Positive rate ≥50% shown in green badge
- [ ] Turnover count shown only if > 0
- [ ] Top 8 combos displayed
- [ ] Format: "PlayType • Blitz • LineStunt"

---

### Test 12: Usage Count Rankings

**Goal:** Verify usage counts are accurate and sorted

**Steps:**
1. Save plays using varied play types, blitzes, stunts
2. Use some values more than others
3. Go to Dashboard
4. Check all three usage sections

**Expected:**
- [ ] Play Type Usage shows top 6, sorted by count descending
- [ ] Blitz Usage shows top 6, sorted by count descending
- [ ] Line Stunt Usage shows top 6, sorted by count descending
- [ ] Counts are accurate
- [ ] Most-used items appear first

---

### Test 13: Outcome Breakdown Accuracy

**Goal:** Verify outcome breakdown shows correct counts and percentages

**Steps:**
1. Save 10 plays with known outcome distribution:
   - 4 Sacks
   - 3 First downs
   - 2 Turnovers
   - 1 Under
2. Go to Dashboard
3. Check Outcome Breakdown section

**Expected:**
- [ ] Sack: 4 (40%)
- [ ] First down: 3 (30%)
- [ ] Turnover: 2 (20%)
- [ ] Under: 1 (10%)
- [ ] Bars sized proportionally
- [ ] Sorted by count descending

---

### Test 14: Recent Plays Feed

**Goal:** Verify recent plays shows latest plays unfiltered

**Steps:**
1. Save 15 plays total
2. Go to Dashboard
3. Apply Q1 filter
4. Check Recent Plays section

**Expected:**
- [ ] Shows latest 10 plays (not 15)
- [ ] Plays in reverse chronological order (most recent first)
- [ ] Shows play number, type, blitz, stunt, outcome, quarter
- [ ] NOT affected by quarter filter
- [ ] NOT affected by outcome filter

---

### Test 15: Mobile Responsiveness

**Goal:** Verify dashboard works on mobile width

**Steps:**
1. Resize browser to mobile width (375px)
2. Navigate through dashboard
3. Test all interactions

**Expected:**
- [ ] KPI cards stack in 2 columns
- [ ] Filter buttons wrap and remain tappable
- [ ] Usage count sections stack vertically
- [ ] No horizontal scrolling
- [ ] All text readable
- [ ] Buttons sized for touch
- [ ] Recent plays readable

---

### Test 16: Offline/Queue Compatibility

**Goal:** Verify dashboard includes queued plays

**Steps:**
1. Go offline (DevTools → Network → Offline)
2. Save 3 plays
3. Go to Dashboard
4. Verify plays counted

**Expected:**
- [ ] Queued plays included in Total Plays
- [ ] Queued plays included in all analytics
- [ ] Dashboard works offline
- [ ] No errors or missing data

---

### Test 17: Zero Division Safety

**Goal:** Verify no errors with edge cases

**Steps:**
1. Test with 0 plays
2. Test with 1 play
3. Test with all same outcome

**Expected:**
- [ ] 0 plays → 0% positive rate (no NaN)
- [ ] 1 play → percentages calculate correctly
- [ ] All same outcome → 100% for that outcome
- [ ] No JavaScript errors
- [ ] No broken UI

---

### Test 18: Performance with Many Plays

**Goal:** Verify dashboard remains fast with larger datasets

**Steps:**
1. Save 50+ plays
2. Go to Dashboard
3. Change filters multiple times
4. Observe performance

**Expected:**
- [ ] Dashboard loads quickly
- [ ] Filter changes are instant
- [ ] No lag or freezing
- [ ] Smooth scrolling
- [ ] Analytics compute efficiently

---

## VERIFICATION CHECKLIST

After running all tests, verify:

- [ ] All KPI cards show correct values
- [ ] Outcome breakdown sums to 100%
- [ ] Combo stats aggregate correctly
- [ ] Usage counts sum to total plays
- [ ] Positive rate calculation verified
- [ ] Filters work independently and combined
- [ ] Empty states render correctly
- [ ] Real-time updates work
- [ ] Undo updates dashboard
- [ ] Session switching works
- [ ] Mobile layout works
- [ ] Offline/queued plays counted
- [ ] No JavaScript errors
- [ ] No broken UI elements

---

## COACHING VALIDATION

Have a coach test these scenarios:

**Halftime Review:**
1. Review first half plays
2. Filter to Q1, then Q2
3. Identify most-used calls
4. Check which combos have high positive rates
5. Look for negative trends

**Between Drives:**
1. Quick check of recent plays
2. See current positive rate
3. Check if specific blitz is working

**Post-Game:**
1. Review all plays
2. Check overall positive rate
3. Identify best and worst combos
4. Review outcome distribution

---

## SUCCESS CRITERIA

Phase 6 testing is complete when:

✅ All 18 tests pass  
✅ All verification items checked  
✅ Coach can use dashboard for real decisions  
✅ Dashboard updates in real-time  
✅ Filters work correctly  
✅ Analytics are accurate  
✅ Mobile experience is good  
✅ No errors or broken states  

**If all criteria met, Phase 6 is production-ready.**
