import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts";
import { WebSocketService } from "../../lib/webSocket";

interface GameInvitationState {
  showError: boolean;
  error: string | null;
  loading: boolean;
  invitationHandler?: (event: MessageEvent) => void;
  pendingRoomId?: string;
  invitationData?: any;
}

export class GameInvitation extends Component<GameInvitationState> {
  protected static state: GameInvitationState = {
    showError: false,
    error: null,
    loading: false,
    invitationHandler: undefined,
    pendingRoomId: undefined,
    invitationData: undefined
  }

  constructor() {
    super();
    console.log('GameInvitation: Constructor called');
  }

  /**
   * Lifecycle method called when component is mounted to DOM
   */
  protected onMount(): void {
    console.log('GameInvitation onMount called');
    console.log('GameInvitation: Element:', this.element);
    console.log('GameInvitation: Element HTML:', this.element.innerHTML);
    this.setupInvitationHandling();
    this.setupButtons();
  }

  /**
   * Setup invitation response handling
   */
  private setupInvitationHandling(): void {
    const ws = WebSocketService.getInstance();
    
    console.log('GameInvitation: Setting up invitation handling');
    console.log('GameInvitation: WebSocket connected?', ws.isConnected());
    console.log('GameInvitation: WebSocket instance?', !!ws.ws);
    
    // Listen for invitation messages
    const handleInvitation = (event: MessageEvent) => {
      try {
        const parsedData = JSON.parse(event.data);
        console.log('GameInvitation received message:', parsedData);
        
        if (parsedData.type === "INVITATION" && parsedData.roomId) {
          console.log('Received game invitation:', parsedData);
          // Store the invitation data
          this.setState({ 
            invitationData: parsedData,
            pendingRoomId: parsedData.roomId 
          });
          
          // Show the invitation popup
          this.showInvitationPopup(parsedData);
        } else if (parsedData.type === "INFO" && parsedData.roomId && parsedData.message.includes("room was created")) {
          console.log('Received room creation info (initiator):', parsedData);
          // For the initiator, show a waiting popup
          this.showWaitingPopup(parsedData);
        } else if (parsedData.type === "STARTMATCH") {
          console.log('Match starting! Navigating to game...');
          // Navigate to the game page when match starts
          const router = Router.getInstance();
          router.navigate('/user/game');
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    // Add message listener
    if (ws.ws && ws.isConnected()) {
      console.log('GameInvitation: Adding message listener immediately');
      ws.ws.addEventListener('message', handleInvitation);
      this.setState({ invitationHandler: handleInvitation });
    } else {
      console.log('GameInvitation: WebSocket not ready, waiting...');
      // If not connected, wait for connection and then add listener
      const checkConnection = () => {
        if (ws.ws && ws.isConnected()) {
          console.log('GameInvitation: WebSocket ready, adding message listener');
          ws.ws.addEventListener('message', handleInvitation);
          this.setState({ invitationHandler: handleInvitation });
        } else {
          console.log('GameInvitation: Still waiting for WebSocket connection...');
          setTimeout(checkConnection, 1000);
        }
      };
      checkConnection();
    }
  }

  /**
   * Show the waiting popup for the initiator
   */
  private showWaitingPopup(infoData: any): void {
    console.log('GameInvitation: Showing waiting popup for initiator');
    
    // The popup container is this element itself
    const popupContainer = this.element;
    console.log('GameInvitation: Popup container found?', !!popupContainer);
    
    if (popupContainer) {
      console.log('GameInvitation: Creating waiting popup HTML');
      // Create the waiting popup HTML
      const popupHtml = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">Waiting for Player</h2>
            <p class="text-gray-600 mb-4">Your game room has been created. Waiting for the other player to accept the invitation...</p>
            <div class="mb-4">
              <p class="text-sm text-gray-500">Room ID: ${infoData.roomId}</p>
            </div>
            <div class="flex justify-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      `;
      
      popupContainer.innerHTML = popupHtml;
      (popupContainer as HTMLElement).style.display = 'block';
      console.log('Game invitation waiting popup shown');
      
      // Add event listeners to the buttons (if any)
      this.addButtonListeners();
    } else {
      console.error('Game invitation popup container not found!');
      console.log('GameInvitation: Available elements in component:', this.element.innerHTML);
    }
  }

  /**
   * Show the invitation popup
   */
  private showInvitationPopup(invitationData: any): void {
    console.log('GameInvitation: Attempting to show popup');
    console.log('GameInvitation: Element:', this.element);
    
    // The popup container is this element itself
    const popupContainer = this.element;
    console.log('GameInvitation: Popup container found?', !!popupContainer);
    
    if (popupContainer) {
      console.log('GameInvitation: Creating popup HTML');
      // Create the popup HTML
      const popupHtml = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">Game Invitation</h2>
            <p class="text-gray-600 mb-4">You've been invited to play a game!</p>
            <div class="mb-4">
              <p class="text-sm text-gray-500">Game Mode: ${invitationData.gameMode}</p>
              <p class="text-sm text-gray-500">Room ID: ${invitationData.roomId}</p>
            </div>
            <div class="flex space-x-4">
              <button id="accept-invitation" class="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">
                Accept
              </button>
              <button id="decline-invitation" class="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors">
                Decline
              </button>
            </div>
          </div>
        </div>
      `;
      
      popupContainer.innerHTML = popupHtml;
      (popupContainer as HTMLElement).style.display = 'block';
      console.log('Game invitation popup shown');
      
      // Add event listeners to the buttons
      this.addButtonListeners();
    } else {
      console.error('Game invitation popup container not found!');
      console.log('GameInvitation: Available elements in component:', this.element.innerHTML);
    }
  }

  /**
   * Setup the accept/decline buttons
   */
  private setupButtons(): void {
    // Use event delegation for dynamically created buttons
    this.addEventListener('#accept-invitation', 'click', (e) => {
      e.preventDefault();
      console.log('Accept invitation clicked');
      this.acceptInvitation();
    });

    this.addEventListener('#decline-invitation', 'click', (e) => {
      e.preventDefault();
      console.log('Decline invitation clicked');
      this.declineInvitation();
    });
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
    
    // Close the popup
    this.closeInvitationPopup();
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
    this.closeInvitationPopup();
  }

  /**
   * Close the invitation popup
   */
  private closeInvitationPopup(): void {
    const popupContainer = this.element;
    if (popupContainer) {
      popupContainer.innerHTML = '';
      (popupContainer as HTMLElement).style.display = 'none';
    }
  }

  protected onUnmount(): void {
    console.log('GameInvitation onUnmount called');
    
    // Clean up message handler
    if (this.state.invitationHandler) {
      const ws = WebSocketService.getInstance();
      if (ws.ws) {
        ws.ws.removeEventListener('message', this.state.invitationHandler);
      }
    }
  }

  render() {
    if (this.state.error) {
      console.error('GameInvitation error:', this.state.error);
    }
  }
}

export default GameInvitation; 