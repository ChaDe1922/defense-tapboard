/**
 * Outcome classification logic for dashboard analytics.
 * 
 * Supports both legacy hardcoded classification and lookup-driven classification.
 * When lookups are provided, classification is resolved from managed outcome metadata.
 * Falls back to hardcoded defaults for backward compatibility.
 */

import { getOutcomeClassification as getFromLookups, DEFAULT_OUTCOME_CLASSIFICATIONS } from './config-manager';

/**
 * Positive outcomes - legacy hardcoded (used as fallback)
 */
export const POSITIVE_OUTCOMES = new Set([
  'Tackle for loss',
  'Sack',
  'Under 5 yards',
  'Under', // legacy
  'Turnover',
]);

/**
 * Neutral outcomes - legacy hardcoded (used as fallback)
 */
export const NEUTRAL_OUTCOMES = new Set([
  '5 yards gained',
]);

/**
 * Negative outcomes - legacy hardcoded (used as fallback)
 */
export const NEGATIVE_OUTCOMES = new Set([
  'First down',
  'Over 10 yards gained',
  'Touchdown',
]);

/**
 * Classify an outcome. Uses managed lookups if provided, else falls back to hardcoded sets.
 * @param {string} outcome
 * @param {Array} [lookups] - optional managed lookups array
 * @returns {'positive'|'neutral'|'negative'|'unclassified'}
 */
export function classifyOutcome(outcome, lookups) {
  if (!outcome) return 'unclassified';
  
  // If lookups provided, use managed classification
  if (lookups && lookups.length > 0) {
    return getFromLookups(lookups, outcome);
  }
  
  // Legacy fallback
  if (POSITIVE_OUTCOMES.has(outcome)) return 'positive';
  if (NEUTRAL_OUTCOMES.has(outcome)) return 'neutral';
  if (NEGATIVE_OUTCOMES.has(outcome)) return 'negative';
  
  return 'unclassified';
}

/**
 * Check if outcome is positive.
 * @param {string} outcome
 * @param {Array} [lookups] - optional managed lookups array
 * @returns {boolean}
 */
export function isPositiveOutcome(outcome, lookups) {
  if (lookups && lookups.length > 0) {
    return getFromLookups(lookups, outcome) === 'positive';
  }
  return POSITIVE_OUTCOMES.has(outcome);
}

/**
 * Check if outcome is neutral.
 * @param {string} outcome
 * @param {Array} [lookups] - optional managed lookups array
 * @returns {boolean}
 */
export function isNeutralOutcome(outcome, lookups) {
  if (lookups && lookups.length > 0) {
    return getFromLookups(lookups, outcome) === 'neutral';
  }
  return NEUTRAL_OUTCOMES.has(outcome);
}

/**
 * Check if outcome is negative.
 * @param {string} outcome
 * @param {Array} [lookups] - optional managed lookups array
 * @returns {boolean}
 */
export function isNegativeOutcome(outcome, lookups) {
  if (lookups && lookups.length > 0) {
    return getFromLookups(lookups, outcome) === 'negative';
  }
  return NEGATIVE_OUTCOMES.has(outcome);
}

/**
 * Get all outcomes by classification.
 * @param {Array} plays
 * @param {Array} [lookups] - optional managed lookups array
 * @returns {{positive: number, neutral: number, negative: number, unclassified: number}}
 */
export function getOutcomeClassificationCounts(plays, lookups) {
  const counts = {
    positive: 0,
    neutral: 0,
    negative: 0,
    unclassified: 0,
  };

  plays.forEach((play) => {
    const classification = classifyOutcome(play.outcome, lookups);
    counts[classification]++;
  });

  return counts;
}

/**
 * Get positive rate from plays.
 * @param {Array} plays
 * @param {Array} [lookups] - optional managed lookups array
 * @returns {number} - percentage (0-100)
 */
export function getPositiveRate(plays, lookups) {
  if (!plays || plays.length === 0) return 0;
  
  const positiveCount = plays.filter((p) => isPositiveOutcome(p.outcome, lookups)).length;
  return (positiveCount / plays.length) * 100;
}
