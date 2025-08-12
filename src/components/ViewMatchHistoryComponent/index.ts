import { Component } from "@blitz-ts/Component";
import { getApiUrl, API_CONFIG } from "../../config/api";
import type { Match, MatchWithNicknames, MatchStats } from "../../types/match";

interface ViewMatchHistoryProps {
  nickname?: string;
}

interface ViewMatchHistoryState {
  matches: MatchWithNicknames[];
  paginatedMatches: MatchWithNicknames[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  totalMatches: number;
  totalPages: number;
  stats: MatchStats | null;
  hasMatches: boolean;
  noMatches: boolean;
  showPagination: boolean;
  hasStats: boolean;
}

export class ViewMatchHistoryComponent extends Component<ViewMatchHistoryProps, ViewMatchHistoryState> {
  protected static state: ViewMatchHistoryState = {
    matches: [],
    paginatedMatches: [],
    loading: true,
    error: null,
    currentPage: 1,
    pageSize: 10,
    totalMatches: 0,
    totalPages: 0,
    stats: null,
    hasMatches: false,
    noMatches: false,
    showPagination: false,
    hasStats: false,
  };

  constructor(props?: ViewMatchHistoryProps) {
    super(props || {});
    this.markStructural(
      'loading','error','stats','matches','paginatedMatches','hasMatches','noMatches','showPagination','hasStats'
    );
  }

  protected onMount(): void {
    this.loadForNickname();
    this.addEventListeners();
  }

  private addEventListeners(): void {
    const refreshBtn = this.element.querySelector('#refresh-matches');
    const prevBtn = this.element.querySelector('#prev-page');
    const nextBtn = this.element.querySelector('#next-page');
    if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadForNickname());
    if (prevBtn) prevBtn.addEventListener('click', () => this.previousPage());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextPage());
  }

  private async loadForNickname(): Promise<void> {
    try {
      this.setState({ loading: true, error: null, hasMatches: false, noMatches: false });
      const nickname = (this.getProps().nickname || '').trim();
      if (!nickname) {
        this.setState({ error: 'No nickname provided', loading: false });
        return;
      }

      // Resolve viewed user's id
      const resp = await fetch(getApiUrl('/profiles'), { credentials: 'include' });
      if (!resp.ok) throw new Error('Failed to resolve profile');
      const profiles = await resp.json();
      const profile = Array.isArray(profiles)
        ? profiles.find((p: any) => (p?.nickname || '').trim() === nickname)
        : null;
      if (!profile?.userId) {
        this.setState({ error: 'Profile not found', loading: false });
        return;
      }
      const userId: number = profile.userId;

      const [matchesData, statsData] = await Promise.all([
        this.fetchMatchesFor(userId),
        this.fetchStats(userId),
      ]);

      this.setState({
        matches: matchesData,
        paginatedMatches: this.computePaginatedMatches(matchesData, this.state.currentPage, this.state.pageSize),
        totalMatches: matchesData.length,
        totalPages: Math.max(1, Math.ceil(matchesData.length / this.state.pageSize)),
        stats: statsData,
        loading: false,
        hasMatches: matchesData.length > 0,
        noMatches: matchesData.length === 0,
        showPagination: Math.ceil(matchesData.length / this.state.pageSize) > 1,
        hasStats: Boolean(statsData),
      });
    } catch (e) {
      console.error('Error loading viewed match history:', e);
      this.setState({ error: 'Failed to load match history', loading: false });
    }
  }

  private async fetchMatchesFor(userId: number): Promise<MatchWithNicknames[]> {
    const response = await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.MATCHES}?userId=${encodeURIComponent(userId)}`), {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch matches');
    const matches: Match[] = await response.json();
    if (!Array.isArray(matches)) return [];
    return this.enhanceMatches(matches, userId);
  }

  private async fetchStats(userId: number): Promise<MatchStats> {
    const response = await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.MATCH_STATS}/${userId}`), { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch match statistics');
    const data = await response.json();
    return {
      totalMatches: data.total || 0,
      wins: data.wins || 0,
      losses: data.losses || 0,
    };
  }

  private async enhanceMatches(matches: Match[], viewedUserId: number): Promise<MatchWithNicknames[]> {
    const enhanced: MatchWithNicknames[] = [];
    for (const match of matches) {
      try {
        const [p1, p2] = await Promise.all([
          this.fetchUserProfile(match.player1_id),
          this.fetchUserProfile(match.player2_id),
        ]);
        const p1Nick = p1?.nickname || `User${match.player1_id}`;
        const p2Nick = p2?.nickname || `User${match.player2_id}`;
        const isWin = match.winner_id === viewedUserId;
        const isLoss = match.winner_id !== null && match.winner_id !== viewedUserId;
        const opponentNickname = viewedUserId === match.player1_id ? p2Nick : p1Nick;
        const resultText = isWin ? 'W' : 'L';
        const resultBadgeClass = isWin ? 'bg-green-500' : 'bg-red-500';
        const playerScore = viewedUserId === match.player1_id ? match.player1_score : match.player2_score;
        const opponentScore = viewedUserId === match.player1_id ? match.player2_score : match.player1_score;
        const formattedDate = this.formatDate(match.gameFinishedAt || match.createdAt);
        enhanced.push({
          ...match,
          player1_nickname: p1Nick,
          player2_nickname: p2Nick,
          winner_nickname: match.winner_id === match.player1_id ? p1Nick : (match.winner_id === match.player2_id ? p2Nick : null),
          isWin,
          isLoss,
          opponentNickname,
          resultText,
          resultBadgeClass,
          playerScore,
          opponentScore,
          formattedDate,
        });
      } catch (e) {
        const isWin = match.winner_id === viewedUserId;
        const isLoss = match.winner_id !== null && match.winner_id !== viewedUserId;
        const p1Nick = `User${match.player1_id}`;
        const p2Nick = `User${match.player2_id}`;
        const opponentNickname = viewedUserId === match.player1_id ? p2Nick : p1Nick;
        const resultText = isWin ? 'W' : 'L';
        const resultBadgeClass = isWin ? 'bg-green-500' : 'bg-red-500';
        const playerScore = viewedUserId === match.player1_id ? match.player1_score : match.player2_score;
        const opponentScore = viewedUserId === match.player1_id ? match.player2_score : match.player1_score;
        const formattedDate = this.formatDate(match.gameFinishedAt || match.createdAt);
        enhanced.push({
          ...match,
          player1_nickname: p1Nick,
          player2_nickname: p2Nick,
          winner_nickname: match.winner_id ? `User${match.winner_id}` : null,
          isWin,
          isLoss,
          opponentNickname,
          resultText,
          resultBadgeClass,
          playerScore,
          opponentScore,
          formattedDate,
        });
      }
    }
    return enhanced;
  }

  private async fetchUserProfile(userId: number): Promise<{ nickname: string } | null> {
    try {
      const response = await fetch(getApiUrl(`/profiles/user/${userId}`), { credentials: 'include' });
      if (response.ok) return response.json();
      return null;
    } catch {
      return null;
    }
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
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
        noMatches: this.state.matches.length === 0,
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
        noMatches: this.state.matches.length === 0,
      });
    }
  }

  render() {
    setTimeout(() => this.updatePaginationButtons(), 0);
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
}


