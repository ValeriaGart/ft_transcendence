import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts";
import { getApiUrl } from "../../config/api";
import { ErrorManager } from "../Error";
import { authService, type User } from "../../lib/auth";
import { WebSocketService } from "../../lib/webSocket";

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
    defaultContentHtml: undefined
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
    this.setupAiStartListener();
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
          this.setState({ 
            invitationData: parsedData,
            pendingRoomId: parsedData.roomId,
            gameMode: '1v1'
          });
          // Show the invitation popup with accept/decline buttons
          this.showInvitationPopup(parsedData);
          // Show the popup
          this.showPopup();
        } else if (parsedData.type === "INFO" && parsedData.roomId && parsedData.message.includes("room was created")) {
          console.log('Received room creation info:', parsedData);
          // If AI flow is active, do NOT show waiting popup
          if (this.state.gameMode === 'ai') {
            console.log('AI mode active: ignoring waiting popup');
            return;
          }
          // Otherwise (1v1 initiator) show waiting popup
          this.setState({ 
            pendingRoomId: parsedData.roomId,
            gameMode: '1v1'
          });
          this.showWaitingPopup(parsedData);
          this.showPopup();
        } else if (parsedData.type === "STARTMATCH") {
          console.log('Match starting! Navigating to game if not already there...');
          // Close the popup
          this.closePopup();
          // Navigate only if not already on the game route to avoid double-mount
          if (window.location.pathname !== '/user/game') {
            const router = Router.getInstance();
            router.navigate('/user/game');
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
      this.closePopup();
    });

    // Also close when clicking outside the popup
    this.addEventListener('#start-game-popup', 'click', (e) => {
      if (e.target === e.currentTarget) {
        this.closePopup();
      }
    });
  }

  /**
   * Close the popup
   */
  private closePopup(): void {
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
   * Show the invitation popup for 1v1 matches
   */
  private showInvitationPopup(invitationData: any): void {
    console.log('StartGamePopUp: Showing invitation popup');
    
    // Update the popup content to show accept/decline buttons
    const popupContent = this.element.querySelector('.text-center');
    if (popupContent) {
      popupContent.innerHTML = `
        <h2 class="text-[#B784F2] font-['Irish_Grover'] text-2xl lg:text-3xl mb-6">
          Game Invitation
        </h2>
        
        <p class="text-[#81C3C3] font-['Irish_Grover'] text-lg mb-8">
          You've been invited to play a 1v1 game!
        </p>
        
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
      popupContent.innerHTML = `
        <h2 class="text-[#B784F2] font-['Irish_Grover'] text-2xl lg:text-3xl mb-6">
          Waiting for Player
        </h2>
        
        <p class="text-[#81C3C3] font-['Irish_Grover'] text-lg mb-8">
          Your game room has been created. Waiting for the other player to accept the invitation...
        </p>
        
        <div class="mb-4">
          <p class="text-sm text-[#81C3C3]">Room ID: ${infoData.roomId}</p>
        </div>
        
        <div class="flex justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B784F2]"></div>
        </div>
      `;
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
    const acceptMessage = {
      type: 4,
      roomId: this.state.pendingRoomId,
      acceptance: "accepted"
    };
    
    console.log('Sending accept message:', acceptMessage);
    ws.sendMessage(JSON.stringify(acceptMessage));
    
    console.log('Accept message sent, waiting for STARTMATCH or other response...');
    
    // Don't close the popup immediately - wait for STARTMATCH message
    // The popup will be closed when STARTMATCH is received
  }

  /**
   * Decline the game invitation
   */
  private declineInvitation(): void {
    if (!this.state.pendingRoomId) {
      console.error('No pending room ID');
      return;
    }

    const ws = WebSocketService.getInstance();
    const declineMessage = {
      type: 4,
      roomId: this.state.pendingRoomId,
      acceptance: "declined"
    };
    
    console.log('Sending decline message:', declineMessage);
    ws.sendMessage(JSON.stringify(declineMessage));
    
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
  }

  render() {
    if (this.state.error) {
      console.error('StartGamePopUp error:', this.state.error);
    }
  }
}

export default StartGamePopUp;
