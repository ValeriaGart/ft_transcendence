import { Component } from "@blitz-ts/Component";
import { authService, type User } from '../../lib/auth';
import { getApiUrl, API_CONFIG } from '../../config/api';
import type { Match, MatchWithNicknames, MatchStats } from '../../types/match';

interface MatchHistoryComponentState {
  matches: MatchWithNicknames[];
  paginatedMatches: MatchWithNicknames[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  totalMatches: number;
  totalPages: number;
  stats: MatchStats | null;
  currentUser: User | null;
  hasMatches: boolean;
  noMatches: boolean;
  showPagination: boolean;
  hasStats: boolean;
}

export class MatchHistoryComponent extends Component<MatchHistoryComponentState> {
  protected static state: MatchHistoryComponentState = {
    matches: [],
    paginatedMatches: [],
    loading: true,
    error: null,
    currentPage: 1,
    pageSize: 10,
    totalMatches: 0,
    totalPages: 0,
    stats: null,
    currentUser: null,
    hasMatches: false,
    noMatches: false,
    showPagination: false,
    hasStats: false
  }

  constructor() {
    super();
    // Ensure blitz-if and blitz-for react to state changes
    this.markStructural(
      'loading',
      'error',
      'stats',
      'matches',
      'paginatedMatches',
      'hasMatches',
      'noMatches',
      'showPagination',
      'hasStats'
    );
    this.loadMatchHistory();
  }

  private async loadMatchHistory(): Promise<void> {
    this.setState({ loading: true, error: null, hasMatches: false, noMatches: false });

    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        this.setState({ 
          error: 'You must be logged in to view match history',
          loading: false 
        });
        return;
      }

      // Load both matches and stats
      const [matchesData, statsData] = await Promise.all([
        this.fetchMatches(),
        this.fetchStats(currentUser.id)
      ]);

      this.setState({
        matches: matchesData,
        paginatedMatches: this.computePaginatedMatches(matchesData, this.state.currentPage, this.state.pageSize),
        totalMatches: matchesData.length,
        totalPages: Math.max(1, Math.ceil(matchesData.length / this.state.pageSize)),
        stats: statsData,
        currentUser,
        loading: false,
        hasMatches: matchesData.length > 0,
        noMatches: matchesData.length === 0,
        showPagination: Math.ceil(matchesData.length / this.state.pageSize) > 1,
        hasStats: Boolean(statsData)
      });

    } catch (error) {
      console.error('Error loading match history:', error);
      this.setState({
        error: 'Failed to load match history. Please try again.',
        loading: false
      });
    }
  }

  private async fetchMatches(): Promise<MatchWithNicknames[]> {
    const response = await authService.authenticatedFetch(
      getApiUrl(API_CONFIG.ENDPOINTS.MATCH_HISTORY)
    );

    if (!response.ok) {
      throw new Error('Failed to fetch matches');
    }

    const matches: Match[] = await response.json();
    
    // Ensure matches is an array
    if (!Array.isArray(matches)) {
      console.warn('Matches API returned non-array response:', matches);
      return [];
    }
    
    // Enhance matches with nicknames and result information
    return this.enhanceMatches(matches);
  }

  private async fetchStats(userId: number): Promise<MatchStats> {
    const response = await authService.authenticatedFetch(
      getApiUrl(`${API_CONFIG.ENDPOINTS.MATCH_STATS}/${userId}`)
    );

    if (!response.ok) {
      throw new Error('Failed to fetch match statistics');
    }

    const data = await response.json();
    
    // Ensure we have valid data structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid stats response format');
    }
    
    return {
      totalMatches: data.total || 0,
      wins: data.wins || 0,
      losses: data.losses || 0
    };
  }

  private async enhanceMatches(matches: Match[]): Promise<MatchWithNicknames[]> {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return [];

    const enhancedMatches: MatchWithNicknames[] = [];

    for (const match of matches) {
      try {
        // Fetch nicknames for both players
        const [player1Profile, player2Profile] = await Promise.all([
          this.fetchUserProfile(match.player1_id),
          this.fetchUserProfile(match.player2_id)
        ]);

        const player1_nickname = player1Profile?.nickname || `User${match.player1_id}`;
        const player2_nickname = player2Profile?.nickname || `User${match.player2_id}`;
        
        let winner_nickname = null;
        if (match.winner_id === match.player1_id) {
          winner_nickname = player1_nickname;
        } else if (match.winner_id === match.player2_id) {
          winner_nickname = player2_nickname;
        }

        const isWin = match.winner_id === currentUser.id;
        const isLoss = match.winner_id !== null && match.winner_id !== currentUser.id;

        // Compute display properties
        const opponentNickname = currentUser.id === match.player1_id ? player2_nickname : player1_nickname;
        const resultText = isWin ? 'W' : 'L';
        const resultBadgeClass = isWin ? 'bg-green-500' : 'bg-red-500';
        const playerScore = currentUser.id === match.player1_id ? match.player1_score : match.player2_score;
        const opponentScore = currentUser.id === match.player1_id ? match.player2_score : match.player1_score;
        const formattedDate = this.formatDate(match.gameFinishedAt || match.createdAt);

        enhancedMatches.push({
          ...match,
          player1_nickname,
          player2_nickname,
          winner_nickname,
          isWin,
          isLoss,
          opponentNickname,
          resultText,
          resultBadgeClass,
          playerScore,
          opponentScore,
          formattedDate
        });
      } catch (error) {
        console.error(`Error enhancing match ${match.id}:`, error);
        // Add match with basic info if profile fetch fails
        const isWin = match.winner_id === currentUser.id;
        const isLoss = match.winner_id !== null && match.winner_id !== currentUser.id;
        
        const player1_nickname = `User${match.player1_id}`;
        const player2_nickname = `User${match.player2_id}`;
        const opponentNickname = currentUser.id === match.player1_id ? player2_nickname : player1_nickname;
        const resultText = isWin ? 'W' : 'L';
        const resultBadgeClass = isWin ? 'bg-green-500' : 'bg-red-500';
        const playerScore = currentUser.id === match.player1_id ? match.player1_score : match.player2_score;
        const opponentScore = currentUser.id === match.player1_id ? match.player2_score : match.player1_score;
        const formattedDate = this.formatDate(match.gameFinishedAt || match.createdAt);

        enhancedMatches.push({
          ...match,
          player1_nickname,
          player2_nickname,
          winner_nickname: match.winner_id ? `User${match.winner_id}` : null,
          isWin,
          isLoss,
          opponentNickname,
          resultText,
          resultBadgeClass,
          playerScore,
          opponentScore,
          formattedDate
        });
      }
    }

    return enhancedMatches;
  }

  private async fetchUserProfile(userId: number): Promise<{ nickname: string } | null> {
    try {
      const response = await authService.authenticatedFetch(
        getApiUrl(`/profiles/user/${userId}`)
      );
      
      if (response.ok) {
        return response.json();
      }
      return null;
    } catch (error) {
      console.error(`Error fetching profile for user ${userId}:`, error);
      return null;
    }
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private computePaginatedMatches(matches: MatchWithNicknames[], currentPage: number, pageSize: number): MatchWithNicknames[] {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return matches.slice(startIndex, endIndex);
  }

  public previousPage(): void {
    if (this.state.currentPage > 1) {
      const newPage = this.state.currentPage - 1;
      this.setState({ 
        currentPage: newPage,
        paginatedMatches: this.computePaginatedMatches(this.state.matches, newPage, this.state.pageSize),
        showPagination: this.state.totalPages > 1,
        hasMatches: this.state.matches.length > 0,
        noMatches: this.state.matches.length === 0
      });
    }
  }

  public nextPage(): void {
    if (this.state.currentPage < this.state.totalPages) {
      const newPage = this.state.currentPage + 1;
      this.setState({ 
        currentPage: newPage,
        paginatedMatches: this.computePaginatedMatches(this.state.matches, newPage, this.state.pageSize),
        showPagination: this.state.totalPages > 1,
        hasMatches: this.state.matches.length > 0,
        noMatches: this.state.matches.length === 0
      });
    }
  }

  private updatePaginationButtons(): void {
    const prevBtn = this.element.querySelector('#prev-page') as HTMLButtonElement;
    const nextBtn = this.element.querySelector('#next-page') as HTMLButtonElement;

    if (prevBtn) {
      const isDisabled = this.state.currentPage === 1;
      prevBtn.disabled = isDisabled;
      prevBtn.style.opacity = isDisabled ? '0.5' : '1';
      prevBtn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
    }

    if (nextBtn) {
      const isDisabled = this.state.currentPage === this.state.totalPages;
      nextBtn.disabled = isDisabled;
      nextBtn.style.opacity = isDisabled ? '0.5' : '1';
      nextBtn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
    }
  }

  public async handleRefresh(): Promise<void> {
    await this.loadMatchHistory();
  }

  protected override onMount(): void {
    // Add event listeners
    const refreshBtn = this.element.querySelector('#refresh-matches');
    const prevBtn = this.element.querySelector('#prev-page');
    const nextBtn = this.element.querySelector('#next-page');

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.handleRefresh());
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousPage());
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextPage());
    }
  }

  render() {
    // Update pagination button states after render
    setTimeout(() => this.updatePaginationButtons(), 0);
  }
}