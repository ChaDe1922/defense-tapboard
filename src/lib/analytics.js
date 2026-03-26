/**
 * Analytics layer for Phase 6 dashboard.
 * 
 * Pure functions for filtering, aggregating, and computing dashboard metrics
 * from active session play data.
 */

import { isPositiveOutcome, isNeutralOutcome, isNegativeOutcome, classifyOutcome } from './classification';

/**
 * Filter plays by quarter.
 * @param {Array} plays
 * @param {string} quarter - 'All' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'OT'
 * @returns {Array}
 */
export function filterByQuarter(plays, quarter) {
  if (!quarter || quarter === 'All') return plays;
  return plays.filter((p) => p.quarter === quarter);
}

/**
 * Filter plays by outcome classification.
 * @param {Array} plays
 * @param {string} outcomeFilter - 'All' | 'Positive' | 'Neutral' | 'Negative' | specific outcome
 * @param {Array} [lookups] - optional managed lookups for classification
 * @returns {Array}
 */
export function filterByOutcome(plays, outcomeFilter, lookups) {
  if (!outcomeFilter || outcomeFilter === 'All') return plays;
  
  if (outcomeFilter === 'Positive') {
    return plays.filter((p) => isPositiveOutcome(p.outcome, lookups));
  }
  if (outcomeFilter === 'Neutral') {
    return plays.filter((p) => isNeutralOutcome(p.outcome, lookups));
  }
  if (outcomeFilter === 'Negative') {
    return plays.filter((p) => isNegativeOutcome(p.outcome, lookups));
  }
  
  // Specific outcome filter
  return plays.filter((p) => p.outcome === outcomeFilter);
}

/**
 * Apply all filters to plays.
 * @param {Array} plays
 * @param {{quarter?: string, outcome?: string}} filters
 * @param {Array} [lookups] - optional managed lookups for classification
 * @returns {Array}
 */
export function filterPlays(plays, filters = {}, lookups) {
  let filtered = plays;
  
  if (filters.quarter) {
    filtered = filterByQuarter(filtered, filters.quarter);
  }
  
  if (filters.outcome) {
    filtered = filterByOutcome(filtered, filters.outcome, lookups);
  }
  
  return filtered;
}

/**
 * Get total plays count.
 * @param {Array} plays
 * @returns {number}
 */
export function getTotalPlays(plays) {
  return plays ? plays.length : 0;
}

/**
 * Get count of plays with specific outcome.
 * @param {Array} plays
 * @param {string} outcome
 * @returns {number}
 */
export function getOutcomeCount(plays, outcome) {
  if (!plays || !outcome) return 0;
  return plays.filter((p) => p.outcome === outcome).length;
}

/**
 * Get sacks count.
 * @param {Array} plays
 * @returns {number}
 */
export function getSacksCount(plays) {
  return getOutcomeCount(plays, 'Sack');
}

/**
 * Get TFL count.
 * @param {Array} plays
 * @returns {number}
 */
export function getTFLCount(plays) {
  return getOutcomeCount(plays, 'Tackle for loss');
}

/**
 * Get turnovers count.
 * @param {Array} plays
 * @returns {number}
 */
export function getTurnoversCount(plays) {
  return getOutcomeCount(plays, 'Turnover');
}

/**
 * Get positive rate percentage.
 * @param {Array} plays
 * @param {Array} [lookups] - optional managed lookups for classification
 * @returns {number}
 */
export function getPositiveRate(plays, lookups) {
  if (!plays || plays.length === 0) return 0;
  const positiveCount = plays.filter((p) => isPositiveOutcome(p.outcome, lookups)).length;
  return (positiveCount / plays.length) * 100;
}

/**
 * Get outcome breakdown with counts and percentages.
 * @param {Array} plays
 * @returns {Array<{outcome: string, count: number, percentage: number}>}
 */
export function getOutcomeBreakdown(plays) {
  if (!plays || plays.length === 0) return [];
  
  const counts = {};
  plays.forEach((play) => {
    if (play.outcome) {
      counts[play.outcome] = (counts[play.outcome] || 0) + 1;
    }
  });
  
  const total = plays.length;
  
  return Object.entries(counts)
    .map(([outcome, count]) => ({
      outcome,
      count,
      percentage: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get usage counts for a specific field.
 * @param {Array} plays
 * @param {string} field - 'playType' | 'blitz' | 'lineStunt'
 * @returns {Array<{label: string, count: number, percentage: number}>}
 */
export function getUsageCounts(plays, field) {
  if (!plays || plays.length === 0) return [];
  
  const counts = {};
  plays.forEach((play) => {
    const value = play[field];
    if (value) {
      counts[value] = (counts[value] || 0) + 1;
    }
  });
  
  const total = plays.length;
  
  return Object.entries(counts)
    .map(([label, count]) => ({
      label,
      count,
      percentage: (count / total) * 100,
    }))
    .sort((a, b) => {
      // Sort by count descending, then alphabetically
      if (b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label);
    });
}

/**
 * Get play type usage.
 * @param {Array} plays
 * @returns {Array<{label: string, count: number, percentage: number}>}
 */
export function getPlayTypeUsage(plays) {
  return getUsageCounts(plays, 'playType');
}

/**
 * Get blitz usage.
 * @param {Array} plays
 * @returns {Array<{label: string, count: number, percentage: number}>}
 */
export function getBlitzUsage(plays) {
  return getUsageCounts(plays, 'blitz');
}

/**
 * Get line stunt usage.
 * @param {Array} plays
 * @returns {Array<{label: string, count: number, percentage: number}>}
 */
export function getStuntUsage(plays) {
  return getUsageCounts(plays, 'lineStunt');
}

/**
 * Get recent plays (latest N plays in reverse chronological order).
 * @param {Array} plays
 * @param {number} limit
 * @returns {Array}
 */
export function getRecentPlays(plays, limit = 10) {
  if (!plays || plays.length === 0) return [];
  
  // Return last N plays in reverse order (most recent first)
  return [...plays].reverse().slice(0, limit);
}

/**
 * Get call combo statistics.
 * @param {Array} plays
 * @returns {Array<{combo: string, calls: number, positive: number, neutral: number, negative: number, turnovers: number, positiveRate: number}>}
 */
export function getComboStats(plays, lookups) {
  if (!plays || plays.length === 0) return [];
  
  const comboMap = {};
  
  plays.forEach((play) => {
    const parts = [play.playType, play.blitz, play.lineStunt].filter(Boolean);
    const key = parts.length > 0 ? parts.join(' • ') : 'Unknown';
    
    if (!comboMap[key]) {
      comboMap[key] = {
        combo: key,
        calls: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
        turnovers: 0,
      };
    }
    
    comboMap[key].calls++;
    
    if (isPositiveOutcome(play.outcome, lookups)) {
      comboMap[key].positive++;
    } else if (isNeutralOutcome(play.outcome, lookups)) {
      comboMap[key].neutral++;
    } else if (isNegativeOutcome(play.outcome, lookups)) {
      comboMap[key].negative++;
    }
    
    if (play.outcome === 'Turnover') {
      comboMap[key].turnovers++;
    }
  });
  
  // Calculate positive rate and sort
  const combos = Object.values(comboMap).map((combo) => ({
    ...combo,
    positiveRate: combo.calls > 0 ? (combo.positive / combo.calls) * 100 : 0,
  }));
  
  // Sort by calls descending, then by positive rate descending
  return combos.sort((a, b) => {
    if (b.calls !== a.calls) return b.calls - a.calls;
    return b.positiveRate - a.positiveRate;
  });
}

/**
 * Get comprehensive dashboard summary.
 * @param {Array} plays
 * @param {{quarter?: string, outcome?: string}} filters
 * @returns {object}
 */
export function getDashboardSummary(plays, filters = {}, lookups) {
  const filteredPlays = filterPlays(plays, filters, lookups);
  
  return {
    totalPlays: getTotalPlays(filteredPlays),
    sacks: getSacksCount(filteredPlays),
    tfl: getTFLCount(filteredPlays),
    turnovers: getTurnoversCount(filteredPlays),
    positiveRate: getPositiveRate(filteredPlays, lookups),
    outcomeBreakdown: getOutcomeBreakdown(filteredPlays),
    playTypeUsage: getPlayTypeUsage(filteredPlays),
    blitzUsage: getBlitzUsage(filteredPlays),
    stuntUsage: getStuntUsage(filteredPlays),
    comboStats: getComboStats(filteredPlays, lookups),
    recentPlays: getRecentPlays(plays, 10), // Recent plays unfiltered
  };
}
