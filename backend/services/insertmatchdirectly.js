import MatchService from './match.service.js';

async function run() {
    try {
        // Example values: player1, player2, player1_score, player2_score, matchtype
        const matchID = await MatchService.insertMatch(1, 2, 5, 3, 'bestof');
        console.log('Inserted match with ID:', matchID);
    } catch (err) {
        console.error('Error inserting match:', err.message);
    }
}

run();
import MatchService from './match.service.js';

async function run() {
    try {
        // Example values: player1, player2, player1_score, player2_score, matchtype
        const matchID = await MatchService.insertMatch(1, 2, 5, 3, 'bestof');        console.log('Inserted match with ID:', matchID);
    } catch (err) {
        console.error('Error inserting match:', err.message);
    }
}

run();
