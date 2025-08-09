export interface Match {
  id: number;
  type: string;
  player1_id: number;
  player2_id: number;
  winner_id: number | null;
  player1_score: number;
  player2_score: number;
  createdAt: string;
  gameFinishedAt: string | null;
}

export interface MatchWithNicknames extends Match {
  player1_nickname: string;
  player2_nickname: string;
  winner_nickname: string | null;
  isWin: boolean;
  isLoss: boolean;
  // Computed display properties
  opponentNickname: string;
  resultText: string;
  resultBadgeClass: string;
  playerScore: number;
  opponentScore: number;
  formattedDate: string;
}

export interface MatchStats {
  totalMatches: number;
  wins: number;
  losses: number;
}

export interface MatchHistoryData {
  matches: MatchWithNicknames[];
  stats: MatchStats;
}
