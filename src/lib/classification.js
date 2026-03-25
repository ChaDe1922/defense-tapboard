/**
 * Outcome classification logic for Phase 6 dashboard analytics.
 * 
 * Classifies defensive play outcomes into positive, neutral, or negative
 * categories for coaching decision support.
 */

/**
 * Positive outcomes - defensive wins
 */
export const POSITIVE_OUTCOMES = new Set([
  'Tackle for loss',
  'Sack',
  'Under',
  'Turnover',
]);

/**
 * Neutral outcomes - acceptable defensive plays
 */
export const NEUTRAL_OUTCOMES = new Set([
  '5 yards gained',
]);

/**
 * Negative outcomes - defensive losses
 */
export const NEGATIVE_OUTCOMES = new Set([
  'First down',
  'Over 10 yards gained',
]);

/**
 * Classify an outcome as positive, neutral, or negative.
 * @param {string} outcome
 * @returns {'positive'|'neutral'|'negative'|'unclassified'}
 */
export function classifyOutcome(outcome) {
  if (!outcome) return 'unclassified';
  
  if (POSITIVE_OUTCOMES.has(outcome)) return 'positive';
  if (NEUTRAL_OUTCOMES.has(outcome)) return 'neutral';
  if (NEGATIVE_OUTCOMES.has(outcome)) return 'negative';
  
  return 'unclassified';
}

/**
 * Check if outcome is positive.
 * @param {string} outcome
 * @returns {boolean}
 */
export function isPositiveOutcome(outcome) {
  return POSITIVE_OUTCOMES.has(outcome);
}

/**
 * Check if outcome is neutral.
 * @param {string} outcome
 * @returns {boolean}
 */
export function isNeutralOutcome(outcome) {
  return NEUTRAL_OUTCOMES.has(outcome);
}

/**
 * Check if outcome is negative.
 * @param {string} outcome
 * @returns {boolean}
 */
export function isNegativeOutcome(outcome) {
  return NEGATIVE_OUTCOMES.has(outcome);
}

/**
 * Get all outcomes by classification.
 * @param {Array} plays
 * @returns {{positive: number, neutral: number, negative: number, unclassified: number}}
 */
export function getOutcomeClassificationCounts(plays) {
  const counts = {
    positive: 0,
    neutral: 0,
    negative: 0,
    unclassified: 0,
  };

  plays.forEach((play) => {
    const classification = classifyOutcome(play.outcome);
    counts[classification]++;
  });

  return counts;
}

/**
 * Get positive rate from plays.
 * @param {Array} plays
 * @returns {number} - percentage (0-100)
 */
export function getPositiveRate(plays) {
  if (!plays || plays.length === 0) return 0;
  
  const positiveCount = plays.filter((p) => isPositiveOutcome(p.outcome)).length;
  return (positiveCount / plays.length) * 100;
}
