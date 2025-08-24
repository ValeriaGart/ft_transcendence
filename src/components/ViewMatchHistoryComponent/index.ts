import { Component } from "@blitz-ts/Component";
import { getApiUrl, API_CONFIG } from "../../config/api";
import type { MatchWithNicknames, MatchStats } from "../../types/match";

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
    pageSize: 2,
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
    this.addEventListener('#refresh-matches', 'click', (e) => { e.preventDefault(); this.loadForNickname(); });
    this.addEventListener('#prev-page', 'click', (e) => { e.preventDefault(); this.previousPage(); });
    this.addEventListener('#next-page', 'click', (e) => { e.preventDefault(); this.nextPage(); });
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
      setTimeout(() => { this.updatePaginationButtons(); this.renderMatchesList(); }, 0);
    } catch (e) {
      console.error('Error loading viewed match history:', e);
      this.setState({ error: 'Failed to load match history', loading: false });
    }
  }

  private async fetchMatchesFor(userId: number): Promise<MatchWithNicknames[]> {
    const response = await fetch(getApiUrl(`/match/history/${userId}`), { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch matches');
    const payload: any = await response.json();
    const items: any[] = Array.isArray(payload?.matches) ? payload.matches : [];
    // Only include finished online 1v1 (bestof) matches; AI games are not saved by backend flow
    const filtered = items.filter((it: any) => String(it.matchType || '').toLowerCase() === 'bestof');
    return filtered.map((item: any, idx: number) => {
      const isWin = String(item.result || '').toLowerCase() === 'win';
      const player1_nickname = String(item.player1_nickname || '');
      const player2_nickname = String(item.player2_nickname || item.opponent || '');
      const winner_nickname = String(item.winner_nickname || (isWin ? player1_nickname : player2_nickname) || '');
      const formattedDate = this.formatDate(item.date || item.createdAt);
      return {
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
        opponentNickname: player2_nickname,
        isWin,
        isLoss: !isWin,
        resultText: isWin ? 'W' : 'L',
        resultBadgeClass: isWin ? 'bg-green-500' : 'bg-red-500',
        playerScore: Number(item.playerScore) || 0,
        opponentScore: Number(item.opponentScore) || 0,
        formattedDate,
      } as MatchWithNicknames;
    });
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
      setTimeout(() => { this.updatePaginationButtons(); this.renderMatchesList(); }, 0);
    }
  }

  public nextPage(): void {
    const totalPages = Math.max(1, Math.ceil((this.state.matches || []).length / (this.state.pageSize || 2)));
    if (this.state.currentPage < totalPages) {
      const newPage = this.state.currentPage + 1;
      this.setState({
        currentPage: newPage,
        paginatedMatches: this.computePaginatedMatches(this.state.matches, newPage, this.state.pageSize),
        showPagination: this.state.totalPages > 1,
        hasMatches: this.state.matches.length > 0,
        noMatches: this.state.matches.length === 0,
      });
      setTimeout(() => { this.updatePaginationButtons(); this.renderMatchesList(); }, 0);
    }
  }

  render() {
    setTimeout(() => { this.updatePaginationButtons(); this.renderMatchesList(); }, 0);
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
      const totalPages = Math.max(1, Math.ceil((this.state.matches || []).length / (this.state.pageSize || 2)));
      const isDisabled = this.state.currentPage >= totalPages;
      nextBtn.disabled = isDisabled;
      nextBtn.style.opacity = isDisabled ? '0.5' : '1';
      nextBtn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
    }
  }

  private renderMatchesList(): void {
    const container = this.element.querySelector('#matches-list') as HTMLElement | null;
    if (!container) return;
    const items = this.paginated();
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

  private paginated(): MatchWithNicknames[] {
    const startIndex = ((this.state.currentPage || 1) - 1) * (this.state.pageSize || 2);
    const endIndex = startIndex + (this.state.pageSize || 2);
    return (this.state.matches || []).slice(startIndex, endIndex);
  }
}


