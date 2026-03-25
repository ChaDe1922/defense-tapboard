export const positiveOutcomes = new Set([
  'Tackle for loss',
  'Sack',
  'Under',
  'Turnover',
]);

export const negativeOutcomes = new Set([
  'First down',
  'Over 10 yards gained',
]);

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function validateSelection(playType, blitz, stunt, outcome) {
  return Boolean(playType && blitz && stunt && outcome);
}

export function getOutcomeAccent(outcome) {
  if (outcome === 'Turnover' || outcome === 'Sack' || outcome === 'Tackle for loss') return 'emerald';
  if (outcome === 'First down' || outcome === 'Over 10 yards gained') return 'red';
  return 'amber';
}

export function getOutcomeBadgeVariant(outcome) {
  if (outcome === 'Turnover' || outcome === 'Sack' || outcome === 'Tackle for loss') return 'success';
  if (outcome === 'First down' || outcome === 'Over 10 yards gained') return 'danger';
  return 'warning';
}

export function buildTimeLabel(playNumber) {
  const minute = Math.max(0, 5 - Math.floor((playNumber - 20) / 2));
  const second = String((31 + playNumber * 7) % 60).padStart(2, '0');
  return `${minute}:${second}`;
}

export function countBy(arr) {
  return arr.reduce((acc, key) => {
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}
