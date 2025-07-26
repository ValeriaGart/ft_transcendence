import MatchMakingService from './matchmaking.service.js';

// Initialize the MatchMakingService
const matchmakingService = new MatchMakingService();

// Mock data
matchmakingService.rooms = [
  {
    matchType: '1v1',
    players: [
      { id: 1, nick: 'luca', accepted: true },
      { id: 2, nick: 'yen', accepted: false },
    ],
  },
  {
    matchType: '1v1',
    players: [
      { id: 3, nick: 'alex', accepted: true },
      { id: 4, nick: 'mia', accepted: true },
    ],
  },
];

const testCases = [
  {
    players: [{ id: 1 }, { id: 5 }],
    expected: true,
  },
  {
    players: [{ id: 5 }, { id: 6 }],
    expected: false,
  },
  {
    players: [{ id: 3 }, { id: 4 }],
    expected: true,
  },
];

// Run test cases
testCases.forEach(({ players, expected }, index) => {
  const result = matchmakingService.playersBusy(players);
  console.log(`Test Case ${index + 1}:`, result === expected ? 'Passed' : 'Failed');
});
