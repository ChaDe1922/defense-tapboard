export const playTypes = [
  'Chicago',
  'Death',
  'Lakers',
  'Miami',
  'Miami Show',
  'Tampa',
];

export const blitzes = [
  'Heavy Cyclone',
  'Heavy Wheel',
  'Heavy Sword',
  'Heavy Sam',
  'Heavy Smash',
  'Sam',
  'Wheel',
  'Smash',
  'Sword',
  'Cyclone',
];

export const stunts = [
  'Pin',
  'Bow',
  'Tap',
  'River',
  'Lake',
  'Gnat',
  'Ton',
  'Quick',
  'Lag',
];

export const outcomes = [
  'Tackle for loss',
  'Sack',
  'First down',
  'Under',
  '5 yards gained',
  'Over 10 yards gained',
  'Turnover',
];

export const presets = [
  { id: 1, name: 'Chicago Pin', playType: 'Chicago', blitz: 'Heavy Sam', stunt: 'Pin', favorite: true },
  { id: 2, name: 'Death River', playType: 'Death', blitz: 'Cyclone', stunt: 'River', favorite: true },
  { id: 3, name: 'Miami Quick', playType: 'Miami', blitz: 'Smash', stunt: 'Quick', favorite: true },
  { id: 4, name: 'Tampa Bow', playType: 'Tampa', blitz: 'Wheel', stunt: 'Bow', favorite: false },
  { id: 5, name: 'Lakers Tap', playType: 'Lakers', blitz: 'Sword', stunt: 'Tap', favorite: false },
];

export const initialMockPlays = [
  { play: 12, playType: 'Chicago', blitz: 'Heavy Sam', stunt: 'Pin', outcome: 'Under', quarter: 'Q2', time: '8:41', presetName: 'Chicago Pin', presetCustomized: false, entryMode: 'preset', createdAt: '03/28 8:41' },
  { play: 13, playType: 'Miami', blitz: 'Smash', stunt: 'Quick', outcome: 'Sack', quarter: 'Q2', time: '8:05', presetName: 'Miami Quick', presetCustomized: false, entryMode: 'preset', createdAt: '03/28 8:05' },
  { play: 14, playType: 'Death', blitz: 'Cyclone', stunt: 'River', outcome: 'Turnover', quarter: 'Q2', time: '7:22', presetName: 'Death River', presetCustomized: false, entryMode: 'preset', createdAt: '03/28 7:22' },
  { play: 15, playType: 'Chicago', blitz: 'Heavy Sam', stunt: 'Pin', outcome: 'Tackle for loss', quarter: 'Q2', time: '6:58', presetName: 'Chicago Pin', presetCustomized: false, entryMode: 'preset', createdAt: '03/28 6:58' },
  { play: 16, playType: 'Tampa', blitz: 'Wheel', stunt: 'Bow', outcome: '5 yards gained', quarter: 'Q2', time: '6:14', presetName: 'Tampa Bow', presetCustomized: false, entryMode: 'preset', createdAt: '03/28 6:14' },
  { play: 17, playType: 'Miami Show', blitz: 'Heavy Cyclone', stunt: 'Lake', outcome: 'First down', quarter: 'Q2', time: '5:40', presetName: null, presetCustomized: false, entryMode: 'manual', createdAt: '03/28 5:40' },
  { play: 18, playType: 'Chicago', blitz: 'Heavy Sam', stunt: 'Pin', outcome: 'Under', quarter: 'Q2', time: '4:56', presetName: 'Chicago Pin', presetCustomized: false, entryMode: 'preset', createdAt: '03/28 4:56' },
  { play: 19, playType: 'Death', blitz: 'Cyclone', stunt: 'River', outcome: 'Over 10 yards gained', quarter: 'Q2', time: '4:08', presetName: 'Death River', presetCustomized: false, entryMode: 'preset', createdAt: '03/28 4:08' },
];

export const defaultGameInfo = {
  opponent: 'DC Divas',
  label: 'DC 3/28',
  date: '03/28/2026',
  enteredBy: 'Coach T',
};
