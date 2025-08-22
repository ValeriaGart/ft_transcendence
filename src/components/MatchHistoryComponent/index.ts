import { Component } from "@blitz-ts/Component";
import { authService, type User } from '../../lib/auth';
import { getApiUrl, API_CONFIG } from '../../config/api';
import type { Match, MatchWithNicknames, MatchStats } from '../../types/match';
import { sanitizeForTemplate } from '../../utils/sanitization';

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
    pageSize: 2,
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
      setTimeout(() => {
        this.updatePaginationButtons();
        this.renderMatchesList();
      }, 0);

    } catch (error) {
      console.error('Error loading match history:', error);
      this.setState({
        error: 'Failed to load match history. Please try again.',
        loading: false
      });
    }
  }

  private async fetchMatches(): Promise<MatchWithNicknames[]> {
    // Prefer backend-computed history for "non-AI bestof" matches
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return [];

    // Resolve current user's nickname once
    const selfProfile = await this.fetchUserProfile(currentUser.id);
    const selfNicknameRaw = (selfProfile?.nickname || `User${currentUser.id}`).trim();
    const selfNickname = sanitizeForTemplate(selfNicknameRaw);

    const response = await authService.authenticatedFetch(
      getApiUrl('/match/history/me')
    );
    if (!response.ok) throw new Error('Failed to fetch match history');
    const payload: any = await response.json();
    const items: any[] = Array.isArray(payload?.matches) ? payload.matches : [];
    const filtered = items.filter((it: any) => String(it.matchType || '').toLowerCase() === 'bestof');

    // Map to display entries: opponent provided; winner based on result
    const mapped: MatchWithNicknames[] = filtered.map((item: any, idx: number) => {
      const isWin = String(item.result || '').toLowerCase() === 'win';
      const opponentRaw = String(item.opponent || 'Unknown');
      const player1_nickname = selfNickname;
      const player2_nickname = sanitizeForTemplate(opponentRaw);
      const winner_nickname = isWin ? player1_nickname : player2_nickname;
      const formattedDate = this.formatDate(item.date || item.createdAt);
      const participantsDisplay = sanitizeForTemplate(`${player1_nickname} vs ${player2_nickname}`);
      const base: any = {
        id: Number(item.id) || idx,
        type: String(item.matchType || 'bestof'),
        player1_id: 0,
        player2_id: 0,
        winner_id: null,
        player1_score: Number(item.playerScore) || 0,
        player2_score: Number(item.opponentScore) || 0,
        createdAt: item.date || item.createdAt || new Date().toISOString(),
        gameFinishedAt: item.date || null,
        player1_nickname,
        player2_nickname,
        winner_nickname,
        isWin,
        isLoss: !isWin,
        opponentNickname: player2_nickname,
        resultText: isWin ? 'W' : 'L',
        resultBadgeClass: isWin ? 'bg-green-500' : 'bg-red-500',
        playerScore: Number(item.playerScore) || 0,
        opponentScore: Number(item.opponentScore) || 0,
        formattedDate,
      } as MatchWithNicknames;
      (base as any).winnerDisplay = sanitizeForTemplate(winner_nickname || 'Unknown');
      (base as any).participantsDisplay = participantsDisplay;
      return base;
    });

    return mapped;
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

  private renderMatchesList(): void {
    const container = this.element.querySelector('#matches-list') as HTMLElement | null;
    if (!container) return;
    const items = this.computePaginatedMatches(
      this.state.matches || [],
      this.state.currentPage || 1,
      this.state.pageSize || 2
    );
    // Update totalPages in case matches length changed
    const totalPages = Math.max(1, Math.ceil((this.state.matches || []).length / (this.state.pageSize || 2)));
    if (totalPages !== this.state.totalPages) {
      this.setState({ totalPages });
    }
    container.innerHTML = items.map((m) => {
      const badgeColor = m.isWin ? '#AEDFAD' : '#FFA9A3';
      const resultBadge = `<div class="flex items-center justify-center w-8 h-8 rounded-full" style="background-color: ${badgeColor};"><span class="text-white font-bold text-xs">${m.resultText}</span></div>`;
      const participants = `${m.player1_nickname || ''} vs ${m.player2_nickname || m.opponentNickname || ''}`.trim();
      const winner = m.winner_nickname || (m.isWin ? m.player1_nickname : m.player2_nickname) || 'Unknown';
      const score = `<span class="${m.isWin ? 'text-[#AEDFAD]' : 'text-[#FFA9A3]'}">${m.playerScore}</span><span class="text-gray-500 mx-1">-</span><span class="${m.isLoss ? 'text-[#AEDFAD]' : 'text-[#FFA9A3]'}">${m.opponentScore}</span>`;
      return `
        <div class="flex items-center justify-between bg-gray-100 rounded-md p-2">
          <div class="flex items-center gap-3">
            ${resultBadge}
            <div class="flex flex-col text-left">
              <span class="text-sm font-semibold text-[#81C3C3]">${participants}</span>
              <span class="text-xs text-gray-500">Winner: ${winner}</span>
              <span class="text-xs text-gray-500">${m.formattedDate}</span>
            </div>
          </div>
          <div class="text-right text-sm font-bold">${score}</div>
        </div>`;
    }).join('');
  }

  public previousPage(): void {
    const totalPages = Math.max(1, Math.ceil((this.state.matches || []).length / (this.state.pageSize || 2)));
    if (this.state.currentPage > 1) {
      const newPage = this.state.currentPage - 1;
      console.log('Prev page ->', newPage, 'of', totalPages);
      this.setState({ 
        currentPage: newPage,
        showPagination: this.state.totalPages > 1,
        hasMatches: this.state.matches.length > 0,
        noMatches: this.state.matches.length === 0
      });
      setTimeout(() => {
        this.updatePaginationButtons();
        this.renderMatchesList();
      }, 0);
    }
  }

  public nextPage(): void {
    const totalPages = Math.max(1, Math.ceil((this.state.matches || []).length / (this.state.pageSize || 2)));
    if (this.state.currentPage < totalPages) {
      const newPage = this.state.currentPage + 1;
      console.log('Next page ->', newPage, 'of', totalPages);
      this.setState({ 
        currentPage: newPage,
        showPagination: this.state.totalPages > 1,
        hasMatches: this.state.matches.length > 0,
        noMatches: this.state.matches.length === 0
      });
      setTimeout(() => {
        this.updatePaginationButtons();
        this.renderMatchesList();
      }, 0);
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
    this.renderMatchesList();
  }

  protected override onMount(): void {
    // Add event listeners (delegated via base helper for reliability)
    this.addEventListener('#refresh-matches', 'click', (e) => { e.preventDefault(); this.handleRefresh(); });
    this.addEventListener('#prev-page', 'click', (e) => { e.preventDefault(); this.previousPage(); });
    this.addEventListener('#next-page', 'click', (e) => { e.preventDefault(); this.nextPage(); });
    // Initial render if data already loaded
    this.renderMatchesList();
  }

  render() {
    // Update pagination button states after render
    setTimeout(() => this.updatePaginationButtons(), 0);
    // keep list in sync
    this.renderMatchesList();
  }
}