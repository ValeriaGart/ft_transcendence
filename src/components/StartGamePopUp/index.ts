import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts";
import { getApiUrl } from "../../config/api";
import { ErrorManager } from "../Error";
import { authService } from "../../lib/auth";
import { WebSocketService } from "../../lib/webSocket";
import { escapeHtml } from "../../utils/html-escape";

interface StartGamePopUpState {
  showError: boolean;
  error: string | null;
  loading: boolean;
  invitationHandler?: (event: MessageEvent) => void;
  pendingRoomId?: string;
  gameMode?: 'ai' | '1v1';
  invitationData?: any;
  aiOpenListener?: (e: Event) => void;
  defaultContentHtml?: string;
  pendingParticipants?: string[];
  pendingInviteType?: '1v1' | 'tournament' | 'teams';
}

export class StartGamePopUp extends Component<StartGamePopUpState> {
  protected static state: StartGamePopUpState = {
    showError: false,
    error: null,
    loading: false,
    invitationHandler: undefined,
    pendingRoomId: undefined,
    gameMode: undefined,
    invitationData: undefined,
    aiOpenListener: undefined,
    defaultContentHtml: undefined,
    pendingParticipants: undefined,
    pendingInviteType: undefined
  }

  constructor() {
    super();
  }

  /**
   * Lifecycle method called when component is mounted to DOM
   */
  protected onMount(): void {
    console.log('StartGamePopUp onMount called');
    console.log('StartGamePopUp: Element:', this.element);
    console.log('StartGamePopUp: Element HTML:', this.element.innerHTML);
    // Save default content to restore for AI popup
    const content = this.element.querySelector('.text-center') as HTMLElement | null;
    if (content) {
      this.setState({ defaultContentHtml: content.innerHTML });
    }
    this.setupStartMatchButton();
    this.setupCloseButton();
    this.setupInvitationHandling();
    this.setupAiOpenListener();
    this.setupChoiceOpenListener();
    this.setupAiStartListener();
    this.setupPendingParticipantsListener();
    // Send cancel on page hide if there is a pending room (pre-STARTMATCH)
    try {
      const pageHideHandler = () => {
        try {
          // Avoid double-cancel if user already pressed Close
          if ((this.state as any)._cancelSent === true) return;
          const ws = WebSocketService.getInstance();
          const roomId = (this.state.pendingRoomId) || (localStorage.getItem('current_room_id') || undefined);
          if (roomId) {
            const cancel = { type: 5, roomId, status: 'cancel' };
            ws.sendMessage(JSON.stringify(cancel));
            try { localStorage.setItem('force_cancel_room_id', String(roomId)); } catch {}
          }
        } catch {}
      };
      window.addEventListener('pagehide', pageHideHandler, { capture: true });
      // keep reference for cleanup
      (this.state as any)._pageHideHandler = pageHideHandler;
    } catch {}
    // Ensure dynamic Close buttons work (delegated listener)
    this.element.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('#close-popup')) {
        e.preventDefault();
        console.log('Decline invitation clicked');
        this.declineInvitation();
        // Force a full reload after sending cancel to reset all UI state cleanly
        setTimeout(() => {
          try { window.location.reload(); } catch {}
          try { (window as any).location.href = window.location.href; } catch {}
          try { window.location.assign('/user'); } catch {}
          try { Router.getInstance().navigate('/user'); } catch {}
        }, 50);
      }
      if (target && target.closest('#acknowledge-close')) {
        e.preventDefault();
        this.closePopup(false);
        // Reload to fully reset the state after acknowledging cancel
        setTimeout(() => {
          try { window.location.reload(); } catch {}
          try { (window as any).location.href = window.location.href; } catch {}
          try { window.location.assign('/user'); } catch {}
          try { Router.getInstance().navigate('/user'); } catch {}
        }, 50);
      }
    });
  }

  /**
   * Setup the "Start New Match" button functionality
   */
  private setupStartMatchButton(): void {
    this.addEventListener('#start-new-match', 'click', async (e) => {
      e.preventDefault();
      console.log('Start new match button clicked');
      await this.handleStartMatch();
    });
  }

  /**
   * Setup invitation response handling
   */
  private setupInvitationHandling(): void {
    const ws = WebSocketService.getInstance();
    
    // Listen for invitation messages
    const handleInvitation = (event: MessageEvent) => {
      try {
        const parsedData = JSON.parse(event.data);
        console.log('StartGamePopUp received message:', parsedData);
        
        if (parsedData.type === "INVITATION" && parsedData.roomId) {
          console.log('Received 1v1 invitation, showing accept/decline options...');
          // Store the invitation data
          const players = Array.isArray(parsedData.players) ? parsedData.players : [];
          const fourPlayers = players.length === 4;
          const pendingType: '1v1' | 'tournament' | 'teams' = fourPlayers ? (parsedData.gameMode === 'teams' ? 'teams' : 'tournament') : '1v1';
          this.setState({ 
            invitationData: parsedData,
            pendingRoomId: parsedData.roomId,
            pendingInviteType: pendingType,
            pendingParticipants: players.map((p: any) => String(p.nick)),
            gameMode: '1v1'
          });
          // Show the invitation popup with accept/decline buttons
          this.showInvitationPopup(parsedData);
          // Show the popup
          this.showPopup();
        } else if (
          parsedData.type === "INFO" && parsedData.roomId &&
          typeof parsedData.message === 'string' && parsedData.message.includes("room was created")
        ) {
          console.log('Received room creation info:', parsedData);
          // If AI flow is active, do NOT show waiting popup
          if (this.state.gameMode === 'ai') {
            console.log('AI mode active: ignoring waiting popup');
            return;
          }
          // Otherwise (1v1 initiator) show waiting popup
          this.setState({ pendingRoomId: parsedData.roomId });
          try { localStorage.setItem('current_room_id', String(parsedData.roomId)); } catch {}
          this.showWaitingPopup(parsedData);
          this.showPopup();
        } else if (parsedData.type === "STARTMATCH") {
          console.log('Match starting! Navigating to game if not already there...');
          try { localStorage.removeItem('current_room_id'); } catch {}
          // Clear any tournament wait timeout
          try {
            const tid = (this as any)._waitTimeoutId;
            if (typeof tid === 'number') {
              clearTimeout(tid);
              (this as any)._waitTimeoutId = undefined;
            }
          } catch {}
          // Close the popup
          this.closePopup();
          // Navigate only if not already on the game route to avoid double-mount
          if (window.location.pathname !== '/user/game') {
            const router = Router.getInstance();
            router.navigate('/user/game');
          }
        } else if (parsedData.type === "CANCELMATCH") {
          console.log('Match was cancelled (declined or timed out).');
          try { localStorage.removeItem('current_room_id'); } catch {}
          // Clear any tournament wait timeout
          try {
            const tid = (this as any)._waitTimeoutId;
            if (typeof tid === 'number') {
              clearTimeout(tid);
              (this as any)._waitTimeoutId = undefined;
            }
          } catch {}
          // Ensure any way of closing this popup triggers a full reload
          try { (this as any)._reloadOnClose = true; } catch {}
          // Keep popup open but replace content with decline message and who declined if available
          const declinedByNick = this.state.invitationData?.players?.find((p: any) => p.accepted === 'declined')?.nick;
          const baseMessage = parsedData.message || 'Invitation declined or match was cancelled.';
          const message = declinedByNick
            ? `Invitation declined by ${escapeHtml(declinedByNick)}.`
            : escapeHtml(baseMessage);

          const content = this.element.querySelector('.text-center') as HTMLElement | null;
          if (content) {
            content.innerHTML = `
              <h2 class="text-[#B784F2] font-['Irish_Grover'] text-2xl lg:text-3xl mb-6">Invitation Update</h2>
              <p class="text-[#81C3C3] font-['Irish_Grover'] text-lg mb-6">${message}</p>
              <button id="acknowledge-close" class="px-6 py-3 bg-[#B784F2] text-white font-['Irish_Grover'] text-lg rounded-2xl hover:scale-105 transition-transform duration-300 cursor-pointer">Close</button>
            `;
            this.showPopup();
            // Rebind close button
            const closeBtn = this.element.querySelector('#acknowledge-close') as HTMLButtonElement | null;
            if (closeBtn) closeBtn.addEventListener('click', (e) => { e.preventDefault(); this.closePopup(false); window.location.reload(); });
          } else {
            // Fallback: close and show error banner
            this.closePopup(false);
            this.showError(message);
            setTimeout(() => window.location.reload(), 100);
          }
        } else if (parsedData.type === "ERROR") {
          const msg = String(parsedData.message || 'An error occurred.');
          // Suppress the (5) error after we already sent cancel ourselves
          if (!((this.state as any)._cancelSent === true) || !msg.includes('(5)')) {
            this.showError(msg.includes('Players are busy')
              ? 'One or both players are currently in a game. Please wait for the current game to finish or try again later.'
              : msg);
          }
        } else {
          console.log('StartGamePopUp: Received other message type:', parsedData.type, parsedData);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        // Don't throw the error, just log it
      }
    };

    // Add message listener
    if (ws.ws && ws.isConnected()) {
      ws.ws.addEventListener('message', handleInvitation);
      this.setState({ invitationHandler: handleInvitation });
    } else {
      // If not connected, wait for connection and then add listener
      const checkConnection = () => {
        if (ws.ws && ws.isConnected()) {
          ws.ws.addEventListener('message', handleInvitation);
          this.setState({ invitationHandler: handleInvitation });
        } else {
          setTimeout(checkConnection, 1000);
        }
      };
      checkConnection();
    }
  }

  /**
   * Setup the close button functionality
   */
  private setupCloseButton(): void {
    this.addEventListener('#close-popup', 'click', (e) => {
      e.preventDefault();
      console.log('Close popup button clicked');
      console.log('Decline invitation clicked');
        this.declineInvitation();
        window.location.reload();
    });

    // Also close when clicking outside the popup
    this.addEventListener('#start-game-popup', 'click', (e) => {
      if (e.target === e.currentTarget) {
        console.log('Decline invitation clicked');
        this.declineInvitation();
        window.location.reload();
      }
    });
  }

  /**
   * Close the popup
   */
  private closePopup(shouldCancel: boolean = false): void {
    // Optionally cancel match if this is a user-initiated close on 1v1 flow
    if (shouldCancel && this.state.gameMode === '1v1' && this.state.pendingRoomId) {
      try {
        const ws = WebSocketService.getInstance();
        const cancelMsg = { type: 5, roomId: this.state.pendingRoomId, status: 'cancel' };
        ws.sendMessage(JSON.stringify(cancelMsg));
      } catch {}
    }

    // Remove the event listener
    if (this.state.invitationHandler) {
      const ws = WebSocketService.getInstance();
      ws.ws.removeEventListener('message', this.state.invitationHandler);
    }
    
    // Hide the popup instead of removing it
    const popupElement = this.element;
    if (popupElement) {
      (popupElement as HTMLElement).style.display = 'none';
      console.log('StartGamePopUp: Popup hidden');
    }

    // If requested, force a reload after closing (e.g., after CANCELMATCH)
    try {
      if ((this as any)._reloadOnClose === true) {
        setTimeout(() => window.location.reload(), 50);
        return;
      }
    } catch {}

    // If user-initiated cancellation/close in 1v1, reload their page to reset UI
    if (shouldCancel && this.state.gameMode === '1v1') {
      setTimeout(() => window.location.reload(), 100);
    }
  }

  /**
   * Show the popup
   */
  private showPopup(): void {
    console.log('StartGamePopUp: Attempting to show popup');
    console.log('StartGamePopUp: Element:', this.element);
    console.log('StartGamePopUp: Element HTML:', this.element.innerHTML);
    
    // The element itself is the popup
    const popupElement = this.element;
    if (popupElement) {
      (popupElement as HTMLElement).style.display = 'flex';
      console.log('StartGamePopUp: Popup shown');
    } else {
      console.error('StartGamePopUp: Popup element not found');
      console.log('StartGamePopUp: Available elements:', this.element.innerHTML);
    }
  }

  /**
   * Listen for external requests to open AI popup
   */
  private setupAiOpenListener(): void {
    const handler = () => {
      // Restore default AI content
      const content = this.element.querySelector('.text-center') as HTMLElement | null;
      if (content && this.state.defaultContentHtml) {
        content.innerHTML = this.state.defaultContentHtml;
        // Re-bind buttons after resetting content
        this.addButtonListeners();
      }
      this.setState({ gameMode: 'ai' });
      this.showPopup();
    };
    window.addEventListener('open-ai-popup', handler);
    this.setState({ aiOpenListener: handler });
  }

  /**
   * Listen for external requests to open a choice popup (AI vs Local)
   */
  private setupChoiceOpenListener(): void {
    const handler = () => {
      const content = this.element.querySelector('.text-center') as HTMLElement | null;
      if (content) {
        content.innerHTML = `
          <h2 class="text-[#B784F2] font-['Irish_Grover'] text-2xl lg:text-3xl mb-6">Choose Opponent</h2>
          <p class="text-[#81C3C3] font-['Irish_Grover'] text-lg mb-8">How would you like to play?</p>
          <div class="flex space-x-4">
            <button id="choose-ai" class="flex-1 px-6 py-3 bg-[#B784F2] text-white font-['Irish_Grover'] text-lg rounded-2xl hover:scale-105 transition-transform duration-300 cursor-pointer">Play vs AI</button>
            <button id="choose-local" class="flex-1 px-6 py-3 bg-[#81C3C3] text-white font-['Irish_Grover'] text-lg rounded-2xl hover:scale-105 transition-transform duration-300 cursor-pointer">Local Game</button>
          </div>
        `;
        // Bind buttons
        const aiBtn = this.element.querySelector('#choose-ai') as HTMLButtonElement | null;
        const localBtn = this.element.querySelector('#choose-local') as HTMLButtonElement | null;
        if (aiBtn) {
          aiBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Reuse AI popup flow
            window.dispatchEvent(new Event('request-ai-start'));
          });
        }
        if (localBtn) {
          localBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLocalOptions();
          });
        }
      }
      this.setState({ gameMode: undefined });
      this.showPopup();
    };
    window.addEventListener('open-choice-popup', handler);
  }

  private showLocalOptions(): void {
    const content = this.element.querySelector('.text-center') as HTMLElement | null;
    if (!content) return;
    content.innerHTML = `
      <h2 class="text-[#B784F2] font-['Irish_Grover'] text-2xl lg:text-3xl mb-6">Local Game</h2>
      <p class="text-[#81C3C3] font-['Irish_Grover'] text-lg mb-4">Choose a mode:</p>
      <div class="flex flex-col space-y-3">
        <button id="local-bestof" class="px-6 py-3 bg-[#B784F2] text-white font-['Irish_Grover'] text-lg rounded-2xl hover:scale-105 transition-transform duration-300 cursor-pointer">Best of 1v1</button>
        <button id="local-infinite" class="px-6 py-3 bg-[#81C3C3] text-white font-['Irish_Grover'] text-lg rounded-2xl hover:scale-105 transition-transform duration-300 cursor-pointer">Infinite 1v1</button>
        <button id="local-tournament" class="px-6 py-3 bg-[#EE9C47] text-white font-['Irish_Grover'] text-lg rounded-2xl hover:scale-105 transition-transform duration-300 cursor-pointer">Local Tournament</button>
        <button id="local-teams" class="px-6 py-3 bg-[#9C89B8] text-white font-['Irish_Grover'] text-lg rounded-2xl hover:scale-105 transition-transform duration-300 cursor-pointer">Teams (2v2)</button>
      </div>
    `;
    const bestBtn = this.element.querySelector('#local-bestof') as HTMLButtonElement | null;
    const infBtn = this.element.querySelector('#local-infinite') as HTMLButtonElement | null;
    const tourBtn = this.element.querySelector('#local-tournament') as HTMLButtonElement | null;
    const teamsBtn = this.element.querySelector('#local-teams') as HTMLButtonElement | null;
    if (bestBtn) bestBtn.addEventListener('click', (e) => { e.preventDefault(); this.showLocalConfirm('bestof'); });
    if (infBtn) infBtn.addEventListener('click', (e) => { e.preventDefault(); this.showLocalConfirm('infinite'); });
    if (tourBtn) tourBtn.addEventListener('click', (e) => { e.preventDefault(); this.showLocalTournamentConfirm(); });
    if (teamsBtn) teamsBtn.addEventListener('click', (e) => { e.preventDefault(); this.showLocalTeamsConfirm(); });
  }

  private showLocalConfirm(mode: 'bestof' | 'infinite' = 'bestof'): void {
    const content = this.element.querySelector('.text-center') as HTMLElement | null;
    if (!content) return;
    content.innerHTML = `
      <h2 class="text-[#B784F2] font-['Irish_Grover'] text-2xl lg:text-3xl mb-6">Local 1v1</h2>
      <p class="text-[#81C3C3] font-['Irish_Grover'] text-lg mb-4">Enter Player 2 alias:</p>
      <div class="mb-6">
        <input id="local-alias" type="text" placeholder="Player 2" class="px-3 py-2 border-2 border-[#81C3C3] rounded-2xl text-[#81C3C3] w-[220px]" />
      </div>
      <div class="flex space-x-4">
        <button id="confirm-local" class="flex-1 px-6 py-3 bg-[#B784F2] text-white font-['Irish_Grover'] text-lg rounded-2xl hover:scale-105 transition-transform duration-300 cursor-pointer">Confirm</button>
        <button id="cancel-local" class="flex-1 px-6 py-3 bg-[#EF7D77] text-white font-['Irish_Grover'] text-lg rounded-2xl hover:scale-105 transition-transform duration-300 cursor-pointer">Cancel</button>
      </div>
    `;
    const confirmBtn = this.element.querySelector('#confirm-local') as HTMLButtonElement | null;
    const cancelBtn = this.element.querySelector('#cancel-local') as HTMLButtonElement | null;
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const input = this.element.querySelector('#local-alias') as HTMLInputElement | null;
        const alias = (input?.value || 'Player 2').trim() || 'Player 2';
        // Resolve Player 1 alias from profile
        let p1Alias = 'Player 1';
        try {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            const resp = await authService.authenticatedFetch(getApiUrl('/profiles/me'));
            if (resp.ok) {
              const data = await resp.json();
              p1Alias = (data?.nickname && String(data.nickname).trim() !== '') ? data.nickname : `User${currentUser.id}`;
            }
          }
        } catch {}
        try {
          localStorage.setItem('local_p1_alias', p1Alias);
          localStorage.setItem('local_p2_alias', alias);
          localStorage.setItem('local_mode', 'MULTI');
          localStorage.setItem('local_gameMode', mode);
        } catch {}
        this.closePopup(false);
        try {
          const { Router } = await import('@blitz-ts');
          Router.getInstance().navigate('/user/game');
        } catch {
          window.location.href = '/user/game';
        }
      });
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closePopup(false);
      });
    }
  }

  private showLocalTeamsConfirm(): void {
    const content = this.element.querySelector('.text-center') as HTMLElement | null;
    if (!content) return;
    content.innerHTML = `
      <h2 class="text-[#B784F2] font-['Irish_Grover'] text-2xl lg:text-3xl mb-6">Local Teams (2v2)</h2>
      <p class="text-[#81C3C3] font-['Irish_Grover'] text-lg mb-4">Enter 3 player names (teammate and two opponents):</p>
      <div class="mb-3"><input id="teams-alias-2" type="text" placeholder="Teammate" class="px-3 py-2 border-2 border-[#81C3C3] rounded-2xl text-[#81C3C3] w-[240px]" /></div>
      <div class="mb-3"><input id="teams-alias-3" type="text" placeholder="Opponent 1" class="px-3 py-2 border-2 border-[#81C3C3] rounded-2xl text-[#81C3C3] w-[240px]" /></div>
      <div class="mb-6"><input id="teams-alias-4" type="text" placeholder="Opponent 2" class="px-3 py-2 border-2 border-[#81C3C3] rounded-2xl text-[#81C3C3] w-[240px]" /></div>
      <div class="flex space-x-4">
        <button id="confirm-local-teams" class="flex-1 px-6 py-3 bg-[#B784F2] text-white font-['Irish_Grover'] text-lg rounded-2xl hover:scale-105 transition-transform duration-300 cursor-pointer">Confirm</button>
        <button id="cancel-local-teams" class="flex-1 px-6 py-3 bg-[#EF7D77] text-white font-['Irish_Grover'] text-lg rounded-2xl hover:scale-105 transition-transform duration-300 cursor-pointer">Cancel</button>
      </div>
    `;
    const confirmBtn = this.element.querySelector('#confirm-local-teams') as HTMLButtonElement | null;
    const cancelBtn = this.element.querySelector('#cancel-local-teams') as HTMLButtonElement | null;
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const a2 = (this.element.querySelector('#teams-alias-2') as HTMLInputElement | null)?.value?.trim() || 'Teammate';
        const a3 = (this.element.querySelector('#teams-alias-3') as HTMLInputElement | null)?.value?.trim() || 'Opponent 1';
        const a4 = (this.element.querySelector('#teams-alias-4') as HTMLInputElement | null)?.value?.trim() || 'Opponent 2';
        // Resolve Player 1 alias from profile
        let p1Alias = 'Player 1';
        try {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            const resp = await authService.authenticatedFetch(getApiUrl('/profiles/me'));
            if (resp.ok) {
              const data = await resp.json();
              p1Alias = (data?.nickname && String(data.nickname).trim() !== '') ? data.nickname : `User${currentUser.id}`;
            }
          }
        } catch {}
        try {
          localStorage.setItem('local_p1_alias', p1Alias);
          localStorage.setItem('local_mode', 'TEAMS');
          localStorage.setItem('local_gameMode', 'teams');
          localStorage.setItem('local_teams_aliases', JSON.stringify([a2, a3, a4]));
        } catch {}
        this.closePopup(false);
        try {
          const { Router } = await import('@blitz-ts');
          Router.getInstance().navigate('/user/game');
        } catch {
          window.location.href = '/user/game';
        }
      });
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closePopup(false);
      });
    }
  }
  private showLocalTournamentConfirm(): void {
    const content = this.element.querySelector('.text-center') as HTMLElement | null;
    if (!content) return;
    content.innerHTML = `
      <h2 class="text-[#B784F2] font-['Irish_Grover'] text-2xl lg:text-3xl mb-6">Local Tournament</h2>
      <p class="text-[#81C3C3] font-['Irish_Grover'] text-lg mb-4">Enter 3 player names:</p>
      <div class="mb-3"><input id="local-alias-2" type="text" placeholder="Player 2" class="px-3 py-2 border-2 border-[#81C3C3] rounded-2xl text-[#81C3C3] w-[240px]" /></div>
      <div class="mb-3"><input id="local-alias-3" type="text" placeholder="Player 3" class="px-3 py-2 border-2 border-[#81C3C3] rounded-2xl text-[#81C3C3] w-[240px]" /></div>
      <div class="mb-6"><input id="local-alias-4" type="text" placeholder="Player 4" class="px-3 py-2 border-2 border-[#81C3C3] rounded-2xl text-[#81C3C3] w-[240px]" /></div>
      <div class="flex space-x-4">
        <button id="confirm-local-tournament" class="flex-1 px-6 py-3 bg-[#B784F2] text-white font-['Irish_Grover'] text-lg rounded-2xl hover:scale-105 transition-transform duration-300 cursor-pointer">Confirm</button>
        <button id="cancel-local-tournament" class="flex-1 px-6 py-3 bg-[#EF7D77] text-white font-['Irish_Grover'] text-lg rounded-2xl hover:scale-105 transition-transform duration-300 cursor-pointer">Cancel</button>
      </div>
    `;
    const confirmBtn = this.element.querySelector('#confirm-local-tournament') as HTMLButtonElement | null;
    const cancelBtn = this.element.querySelector('#cancel-local-tournament') as HTMLButtonElement | null;
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const a2 = (this.element.querySelector('#local-alias-2') as HTMLInputElement | null)?.value?.trim() || 'Player 2';
        const a3 = (this.element.querySelector('#local-alias-3') as HTMLInputElement | null)?.value?.trim() || 'Player 3';
        const a4 = (this.element.querySelector('#local-alias-4') as HTMLInputElement | null)?.value?.trim() || 'Player 4';
        // Resolve Player 1 alias from profile
        let p1Alias = 'Player 1';
        try {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            const resp = await authService.authenticatedFetch(getApiUrl('/profiles/me'));
            if (resp.ok) {
              const data = await resp.json();
              p1Alias = (data?.nickname && String(data.nickname).trim() !== '') ? data.nickname : `User${currentUser.id}`;
            }
          }
        } catch {}
        try {
          localStorage.setItem('local_p1_alias', p1Alias);
          localStorage.setItem('local_mode', 'TOURNAMENT');
          localStorage.setItem('local_gameMode', 'tournament');
          localStorage.setItem('local_tournament_aliases', JSON.stringify([a2, a3, a4]));
        } catch {}
        this.closePopup(false);
        try {
          const { Router } = await import('@blitz-ts');
          Router.getInstance().navigate('/user/game');
        } catch {
          window.location.href = '/user/game';
        }
      });
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closePopup(false);
      });
    }
  }

  /**
   * Listen for external requests to start AI match immediately
   */
  private setupAiStartListener(): void {
    window.addEventListener('request-ai-start', async () => {
      // Ensure popup is visible and content is default
      const content = this.element.querySelector('.text-center') as HTMLElement | null;
      if (content && this.state.defaultContentHtml) {
        content.innerHTML = this.state.defaultContentHtml;
        this.addButtonListeners();
        // Rebind the AI confirm button explicitly in case delegation doesn't catch dynamic HTML
        const aiBtn = this.element.querySelector('#start-new-match') as HTMLButtonElement | null;
        if (aiBtn) {
          aiBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.handleStartMatch();
          });
        }
      }
      this.setState({ gameMode: 'ai' });
      this.showPopup();
      // Do NOT auto-start the AI match; wait for user to press the confirm button in the popup
    });
  }

  /**
   * Receive participants list from MatchComponent (for initiator waiting view)
   */
  private setupPendingParticipantsListener(): void {
    window.addEventListener('set-pending-participants', (e: Event) => {
      const ce = e as CustomEvent<{participants: string[]; type: '1v1'|'tournament'}>;
      if (ce.detail) {
        this.setState({ pendingParticipants: ce.detail.participants, pendingInviteType: ce.detail.type });
      }
    });
  }

  /**
   * Show the invitation popup for 1v1 matches
   */
  private showInvitationPopup(invitationData: any): void {
    console.log('StartGamePopUp: Showing invitation popup');
    
    // Update the popup content to show accept/decline buttons
    const popupContent = this.element.querySelector('.text-center');
    if (popupContent) {
      const players = Array.isArray(invitationData.players) ? invitationData.players : [];
      const isFour = players.length === 4;
      const title = isFour ? (invitationData.gameMode === 'teams' ? 'Teams Invitation' : 'Tournament Invitation') : '1v1 Invitation';
      const listHtml = players.map((p: any) => `<li class="text-[#81C3C3]">${escapeHtml(p.nick)}${p.ai ? ' (AI)' : ''}</li>`).join('');
      popupContent.innerHTML = `
        <h2 class="text-[#B784F2] font-['Irish_Grover'] text-2xl lg:text-3xl mb-6">${title}</h2>
        
        <p class="text-[#81C3C3] font-['Irish_Grover'] text-lg mb-8">
          You've been invited to play!
        </p>
        ${players.length ? `<ul class="mb-4 space-y-1">${listHtml}</ul>` : ''}
        
        <div class="mb-4">
          <p class="text-sm text-[#81C3C3]">Game Mode: ${invitationData.gameMode}</p>
          <p class="text-sm text-[#81C3C3]">Room ID: ${invitationData.roomId}</p>
        </div>
        
        <div class="flex space-x-4">
          <button 
            id="accept-invitation" 
            class="flex-1 px-6 py-3 bg-green-500 text-white font-['Irish_Grover'] text-lg rounded-2xl hover:scale-105 transition-transform duration-300 cursor-pointer"
          >
            Accept
          </button>
          <button 
            id="decline-invitation" 
            class="flex-1 px-6 py-3 bg-red-500 text-white font-['Irish_Grover'] text-lg rounded-2xl hover:scale-105 transition-transform duration-300 cursor-pointer"
          >
            Decline
          </button>
        </div>
      `;
      
      // Add event listeners to the buttons
      this.addButtonListeners();
    }
  }

  /**
   * Show the waiting popup for 1v1 initiator
   */
  private showWaitingPopup(infoData: any): void {
    console.log('StartGamePopUp: Showing waiting popup for initiator');
    
    // Update the popup content to show waiting message
    const popupContent = this.element.querySelector('.text-center');
    if (popupContent) {
      const participants = (this.state.pendingParticipants ?? []) as string[];
      const isFour = participants.length === 4;
      const pit = this.state.pendingInviteType;
      const title = pit === 'teams' ? 'Waiting for Team Players' : (isFour ? 'Waiting for Players' : 'Waiting for Player');
      const listHtml = participants.length ? `<ul class=\"mb-4 space-y-1\">${participants.map((n: string) => `<li class=\\\"text-[#81C3C3]\\\">${n}</li>`).join('')}</ul>` : '';
      popupContent.innerHTML = `
        <h2 class="text-[#B784F2] font-['Irish_Grover'] text-2xl lg:text-3xl mb-6">${title}</h2>
        <p class="text-[#81C3C3] font-['Irish_Grover'] text-lg mb-8">Your room was created. Waiting for participants to accept...</p>
        ${listHtml}
        <div class="mb-4">
          <p class="text-sm text-[#81C3C3]">Room ID: ${infoData.roomId}</p>
        </div>
        <div class="flex justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B784F2]"></div>
        </div>
      `;

      // If tournament wait takes too long, cancel and route to user with message
      try {
        if (isFour) {
          const roomId = String(infoData.roomId || this.state.pendingRoomId || localStorage.getItem('current_room_id') || '');
          // Clear any existing timer first
          try {
            const existing = (this as any)._waitTimeoutId;
            if (typeof existing === 'number') {
              clearTimeout(existing);
            }
          } catch {}
          const timeoutMs = 10000;
          const tid = window.setTimeout(() => {
            try {
              const ws = WebSocketService.getInstance();
              if (roomId) {
                const cancel = { type: 5, roomId, status: 'cancel' } as any;
                ws.sendMessage(JSON.stringify(cancel));
              }
            } catch {}
            try { localStorage.setItem('last_cancel_message', 'Match was cancelled due to timeout waiting for players.'); } catch {}
            try { window.location.assign('/user'); } catch {}
          }, timeoutMs);
          try { (this as any)._waitTimeoutId = tid; } catch {}
        }
      } catch {}
    }
  }

  /**
   * Add event listeners to dynamically created buttons
   */
  private addButtonListeners(): void {
    // Add event listeners to accept button
    const acceptButton = this.element.querySelector('#accept-invitation');
    if (acceptButton) {
      console.log('Adding listener to accept button');
      acceptButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Accept invitation clicked');
        this.acceptInvitation();
      });
    }

    // Add event listeners to decline button
    const declineButton = this.element.querySelector('#decline-invitation');
    if (declineButton) {
      console.log('Adding listener to decline button');
      declineButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Decline invitation clicked');
        this.declineInvitation();
        window.location.reload();
      });
    }
  }

  /**
   * Accept the game invitation
   */
  private acceptInvitation(): void {
    if (!this.state.pendingRoomId) {
      console.error('No pending room ID');
      return;
    }

    const ws = WebSocketService.getInstance();
    
    // Normal 1v1 accept flow
    const acceptMessage = {
      type: 4,
      roomId: this.state.pendingRoomId,
      acceptance: 'accepted'
    };
    console.log('Sending accept message:', acceptMessage);
    ws.sendMessage(JSON.stringify(acceptMessage));
    console.log('Accept message sent, waiting for STARTMATCH or other response...');

    // Immediately update UI to "waiting" so the player sees progress
    try {
      const players = Array.isArray(this.state.invitationData?.players) ? this.state.invitationData!.players : [];
      const isTournament = players.length === 4;
      const participantNames = players.map((p: any) => String(p.nick));
      this.setState({
        pendingInviteType: isTournament ? 'tournament' : '1v1',
        pendingParticipants: participantNames
      });
      this.showWaitingPopup({ roomId: this.state.pendingRoomId });
      this.showPopup();
    } catch {}
  }

  /**
   * Decline the game invitation
   */
  private declineInvitation(): void {
    // Prevent duplicate cancels from double-click or multiple listeners
    try { if ((this.state as any)._cancelSent === true) return; } catch {}
    if (!this.state.pendingRoomId) {
      console.error('No pending room ID');
      return;
    }

    const ws = WebSocketService.getInstance();
    // Do not send cancel for local synthetic rooms
    const isLocalRoom = String(this.state.pendingRoomId) === 'local';
    if (!isLocalRoom) {
      const cancelMessage = {
        type: 5,
        roomId: this.state.pendingRoomId,
        status: 'cancel'
      };
      console.log('Sending cancel message (decline):', cancelMessage);
      try { (this.state as any)._cancelSent = true; } catch {}
      ws.sendMessage(JSON.stringify(cancelMessage));
      try { localStorage.setItem('force_cancel_room_id', String(this.state.pendingRoomId)); } catch {}
    }
    
    // Close the popup
    this.closePopup();
  }

  /**
   * Show error message
   */
  private showError(message: string) {
    this.setState({
      showError: true,
      error: message
    });

    ErrorManager.showError(message, this.element, () => {
      this.setState({
        showError: false,
        error: null
      });
    });
  }

  /**
   * Handle match start button click
   * Creates a match with AI opponent
   */
  private async handleStartMatch(): Promise<void> {
    try {
      console.log('Starting new match...');
      this.setState({ loading: true });

      // Ensure any lingering room is cancelled before creating a new one (avoids "players are busy")
      try {
        const ws = WebSocketService.getInstance();
        const roomIds: string[] = [];
        const a = localStorage.getItem('force_cancel_room_id'); if (a) roomIds.push(a);
        const b = localStorage.getItem('current_room_id'); if (b) roomIds.push(b);
        for (const id of Array.from(new Set(roomIds))) {
          const cancel = { type: 5, roomId: id, status: 'cancel' };
          console.log('Pre-start: sending cancel for lingering room', cancel);
          ws.sendMessage(JSON.stringify(cancel));
        }
        if (roomIds.length) {
          try { localStorage.removeItem('force_cancel_room_id'); } catch {}
          try { localStorage.removeItem('current_room_id'); } catch {}
          await new Promise(r => setTimeout(r, 400));
        }
      } catch {}

      // Get current user's profile to get their nickname
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        this.showError('You must be logged in to start a game');
        return;
      }

      // Fetch current user's profile to get nickname
      const profileResponse = await authService.authenticatedFetch(getApiUrl('/profiles/me'));
      if (!profileResponse.ok) {
        this.showError('Failed to get user profile');
        return;
      }

      const profileData = await profileResponse.json();
      const userNickname = profileData.nickname || `User${currentUser.id}`;

      if (!userNickname || userNickname.trim() === '') {
        this.showError('Please set a nickname in your profile before starting a game');
        return;
      }

      console.log('Using nickname for match:', userNickname);

      const ws = WebSocketService.getInstance();

      // Send type 3 message to create the match
      const message = {
        type: 3,
        players: [
          {"nick": userNickname, "ai": false},
          {"nick": "CPU", "ai": true}
        ],
        gameMode: "bestof",
        oppMode: "single"
      };
      
      console.log('Sending match request:', JSON.stringify(message));
      ws.sendMessage(JSON.stringify(message));
      
      // For AI flow (oppMode: 'single'), navigate to game immediately and let GamePage await STARTMATCH
      if (message.oppMode === 'single') {
        this.closePopup();
        const router = Router.getInstance();
        if (window.location.pathname !== '/user/game') {
          router.navigate('/user/game');
        }
      }
    } catch (error) {
      console.error('Error starting match:', error);
      this.showError('Failed to start match. Please try again.');
    } finally {
      this.setState({ loading: false });
    }

    console.log('Match started');
  }

  protected onUnmount(): void {
    console.log('StartGamePopUp onUnmount called');
    // Remove AI open listener
    if (this.state.aiOpenListener) {
      window.removeEventListener('open-ai-popup', this.state.aiOpenListener);
    }
    try {
      const h = (this.state as any)._pageHideHandler as any;
      if (h) window.removeEventListener('pagehide', h, { capture: true } as any);
      (this.state as any)._pageHideHandler = undefined;
    } catch {}
    // Clear any pending wait timeout
    try {
      const tid = (this as any)._waitTimeoutId;
      if (typeof tid === 'number') {
        clearTimeout(tid);
        (this as any)._waitTimeoutId = undefined;
      }
    } catch {}
  }

  render() {
    if (this.state.error) {
      console.error('StartGamePopUp error:', this.state.error);
    }
  }
}

export default StartGamePopUp;
