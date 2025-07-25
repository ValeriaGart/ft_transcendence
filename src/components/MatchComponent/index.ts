import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts";
import { getApiUrl } from "../../config/api";
import { ErrorManager } from "../Error";
// import { webSocketService } from "../../lib/websocket";

interface Friendship {
  id: number;
  initiator_id: number;
  recipient_id: number;
  accepted: number;
  createdAt: string;
  acceptedAt: string;
}

interface MatchComponentState {
  currentPage: 'show-friends' | 'add-friend';
  showError: boolean;
  error: string | null;
  friendships: Friendship[];
  loading: boolean;
  showAddFriendForm: boolean;
}

export class MatchComponent extends Component<MatchComponentState> {
  protected static state: MatchComponentState = {
    currentPage: 'show-friends',
    error: null,
    showError: false,
    friendships: [],
    loading: true,
    showAddFriendForm: false
  }

  constructor() {
    super();
  }

  /**
   * Lifecycle method called when component is mounted to DOM
   * Sets up event listeners and fetches friendships
   */
  protected onMount(): void {
    console.log('MatchComponent onMount called, isMounted:');
  
    this.setupStartAiMatchButton();
    this.setupToggleButtons();
    // this.setupWebSocketHandlers();
    this.fetchFriendships();
    this.updatePageVisibility();
  }

  /**
   * Setup the "Start AI Match" button functionality
   * Navigates to AI game page
   */
  private setupStartAiMatchButton(): void {
    const startAiButton = document.getElementById('start-ai-match');
    if (startAiButton) {
      // Remove any existing event listeners to prevent duplicates
      const newButton = startAiButton.cloneNode(true);
      startAiButton.parentNode?.replaceChild(newButton, startAiButton);
      
      // Add the event listener to the new button
      newButton.addEventListener('click', () => {
        this.handleStartAiMatch();
      });
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  // private setupWebSocketHandlers(): void {
  //   // Handle friend request results
  //   webSocketService.on('friend_request_result', (data: { success: boolean; error?: string }) => {
  //     if (data.success) {
  //       this.handleFriendRequestSuccess();
  //     } else {
  //       this.showError(data.error || 'Failed to add friend');
  //     }
  //   });

    // Handle current user info
  //   webSocketService.on('current_user_result', (data: { success: boolean; user?: any; error?: string }) => {
  //     if (data.success && data.user) {
  //       console.log('hello My user ID:', data.user.id);
  //     } else {
  //       console.log('hello Could not fetch current user ID');
  //     }
  //   });
  // }

  /**
   * Setup toggle buttons for switching between friends list and add friend form
   */
  private setupToggleButtons(): void {

    this.addEventListener('#add-a-friend', 'click', (e) => {
      e.preventDefault();
      console.log('add-a-friend clicked');
      this.setState({ currentPage: 'add-friend' });
      this.updatePageVisibility();
    });

    this.addEventListener('#close_button', 'click', (e) => {
      e.preventDefault();
      console.log('close_button clicked');
      this.setState({ currentPage: 'show-friends' });
      this.updatePageVisibility();
    });

    this.addEventListener('#add-friends-button', 'click', (e) => {
      e.preventDefault();
      console.log('add-friends-button clicked');
      this.handleAddFriend();
    });
  }

  /**
   * Update the visibility of friends container and add friends form
   */
  private updatePageVisibility(): void {
    const showfriends = this.element.querySelector('#friends-container') as HTMLElement;
    const addfriend = this.element.querySelector('#add-friends-container') as HTMLElement;


    if (showfriends) {
      showfriends.style.display = 'none';
      console.log('Hidden showfriends');
    }
    if (addfriend) {
      addfriend.style.display = 'none';
      console.log('Hidden addfriend');
    }

    // Show the current page
    switch (this.state.currentPage) {
      case 'show-friends':
        if (showfriends) {
          showfriends.style.display = 'flex';
          console.log('Showing showfriends');
        }
        break;
      case 'add-friend':
        if (addfriend) {
          addfriend.style.display = 'flex';
          console.log('Showing addfriend');
        }
        break;
    }
  }

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
   * Fetch all friendships from the API using getAllFriendships endpoint
   */
  private async fetchFriendships(): Promise<void> {
    try {
      this.setState({ loading: true });
      
      const response = await fetch(getApiUrl('/friend'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const friendships: Friendship[] = await response.json();
        console.log('Friendships received:', friendships);
        
        this.setState({ 
          friendships: friendships || [],
          loading: false 
        });
      } else {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`Failed to fetch friendships: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Error fetching friendships:', error);
      this.setState({ 
        error: `Failed to load friendships: ${error instanceof Error ? error.message : 'Unknown error'}`,
        loading: false 
      });
    }
  }

  /**
   * Handle adding a new friend using WebSockets
   */
  private handleAddFriend(): void {
    const inputElement = this.element.querySelector('#add-friends-input') as HTMLInputElement;
    if (!inputElement) {
      this.showError('Input field not found');
      return;
    }

    const userIdStr = inputElement.value.trim();
    if (!userIdStr) {
      this.showError('Please enter a user ID');
      return;
    }

    const userId = parseInt(userIdStr);
    if (isNaN(userId)) {
      this.showError('Please enter a valid user ID (number)');
      return;
    }

    console.log('Adding friend with user ID:', userId);
    // console.log('WebSocket service available:', !!webSocketService);
    // console.log('WebSocket service methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(webSocketService)));

    // Get current user info via WebSocket
    console.log('Calling getCurrentUser...');
    // webSocketService.getCurrentUser();

    // Send friend request directly (skip user search since we can't access other users)
    console.log('Calling addFriend...');
    // webSocketService.addFriend(userId);
  }



  /**
   * Handle successful friend request
   */
  private handleFriendRequestSuccess(): void {
    console.log('Friend request sent successfully');
    
    // Clear input and switch back to friends list
    const inputElement = this.element.querySelector('#add-friends-input') as HTMLInputElement;
    if (inputElement) {
      inputElement.value = '';
    }
    
    this.setState({ currentPage: 'show-friends' });
    this.updatePageVisibility();
    
    // Refresh the friendships list
    this.fetchFriendships();
  }

  /**
   * Handle AI match start button click
   * Navigates to AI game page
   */
  private handleStartAiMatch(): void {
    try {
      console.log('Starting AI match...');
      
      // Prevent multiple navigation calls
      if (window.location.pathname === '/game') {
        console.log('Already on game page, skipping navigation');
        return;
      }


      const router = Router.getInstance();
      if (router) {
        router.navigate('/user/game');
      } else {
        // Fallback: use window.location if router is not available
        window.location.href = `/game`;
      }
      
    } catch (error) {
      console.error('Error starting AI match:', error);
      this.setState({
        error: 'Failed to start AI match. Please try again.'
      });
    }

    console.log('AI Match started');
  }

  /**
   * Render friendships list in the friend-list container
   */
  private renderFriendshipsList(): void {
    const friendListContainer = document.getElementById('friend-list');
    if (!friendListContainer) return;

    if (this.state.loading) {
      friendListContainer.innerHTML = `
        <div class="flex items-start justify-start h-full">
          <div class="text-[#81C3C3] font-['Irish_Grover'] text-lg">Loading friendships...</div>
        </div>
      `;
      return;
    }

    if (this.state.error) {
      this.showError(this.state.error);
      return;
    }

    if (this.state.friendships.length === 0) {
      friendListContainer.innerHTML = `
        <div class="flex flex-col items-center justify-start h-full w-[90%] text-center ">
          <div class="text-[#81C3C3] font-['Irish_Grover'] text-xl mb-2">No friendships yet...</div>
          <div class="text-[#81C3C3] font-['Irish_Grover'] text-lg">womp womp :( </div>
        </div>
      `;
      return;
    }

    // Render friendships list
    const friendshipsHtml = this.state.friendships.map((friendship: Friendship) => `
      <div class="flex items-center justify-between p-3 mb-2 bg-[#F0F7F7] rounded-lg border border-[#81C3C3]">
        <div class="flex items-center">
          <img src="/art/profile/profile_no.svg" alt="Profile" class="w-8 h-8 rounded-full mr-3" />
          <div>
            <div class="text-[#81C3C3] font-['Irish_Grover'] text-lg">Friendship ${friendship.id}</div>
            <div class="text-[#81C3C3] text-sm opacity-75">
              ${friendship.initiator_id} → ${friendship.recipient_id}
              ${friendship.accepted ? ' (Accepted)' : ' (Pending)'}
            </div>
            <div class="text-[#81C3C3] text-xs opacity-50">
              Created: ${new Date(friendship.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        <button class="px-4 py-2 bg-[#B784F2] text-white font-['Irish_Grover'] text-sm rounded-lg hover:scale-105 transition-transform duration-300">
          Play
        </button>
      </div>
    `).join('');

    friendListContainer.innerHTML = `
      <div class="w-full h-full overflow-y-auto">
        ${friendshipsHtml}
      </div>
    `;
  }

  protected onUnmount(): void {
    console.log('MatchComponent onUnmount called');
  }

  render() {
    if (this.state.error) {
      console.error('MatchComponent error:', this.state.error);
    }
    
    setTimeout(() => {
      this.renderFriendshipsList();
      this.updatePageVisibility();
    }, 100);
  }
}