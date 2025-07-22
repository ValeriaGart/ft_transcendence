import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts";
import { getApiUrl } from "../../config/api";
import { ErrorManager } from "../Error";
import { WebSocketService } from "../../lib/websocket";

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
  userProfiles: { [userId: number]: { nickname: string | null } };
}

export class MatchComponent extends Component<MatchComponentState> {

  protected static state: MatchComponentState = {
    currentPage: 'show-friends',
    error: null,
    showError: false,
    friendships: [],
    loading: true,
    showAddFriendForm: false,
    userProfiles: {}
  }

  // Store references to event handlers for cleanup
  private webSocketHandlers: Array<{ eventType: string; handler: (data: any) => void }> = [];
  private startAiMatchHandler: (() => void) | null = null;
  private startAiButton: HTMLElement | null = null;

  /**
   * Lifecycle method called when component is mounted to DOM
   * Sets up event listeners and fetches friendships
   */
  protected onMount(): void {
    this.setupStartAiMatchButton();
    this.setupToggleButtons();
    this.setupWebSocketHandlers().catch(error => {
      console.error('Error setting up WebSocket handlers:', error);
    });
    this.setupConfirmFriendButtons();
    this.fetchFriendships();
    this.updatePageVisibility();
  }

  /**
   * Lifecycle method called when component is unmounted from DOM
   * Cleans up all event listeners and resources
   */
  protected onUnmount(): void {
    console.log('MatchComponent onUnmount called');
    
    // Clean up WebSocket event listeners
    this.cleanupWebSocketHandlers();
    
    // Clean up manual DOM event listeners
    this.cleanupManualEventListeners();
    
    // Remove any error components
    ErrorManager.removeError();
    
    // Clear any pending timeouts
    this.addCleanup(() => {
      // This will be called during unmount to clear any remaining timeouts
    });
  }

  /**
   * Clean up WebSocket event handlers
   */
  private async cleanupWebSocketHandlers(): Promise<void> {
    try {
      const webSocketModule = await import('../../lib/websocket');
      if (webSocketModule.webSocketService) {
        this.webSocketHandlers.forEach(({ eventType, handler }) => {
          webSocketModule.webSocketService.off(eventType, handler);
        });
        this.webSocketHandlers = [];
        console.log('WebSocket handlers cleaned up');
      }
    } catch (error) {
      console.error('Error cleaning up WebSocket handlers:', error);
    }
  }

  /**
   * Clean up manual DOM event listeners
   */
  private cleanupManualEventListeners(): void {
    if (this.startAiButton && this.startAiMatchHandler) {
      this.startAiButton.removeEventListener('click', this.startAiMatchHandler);
      this.startAiButton = null;
      this.startAiMatchHandler = null;
      console.log('Manual event listeners cleaned up');
    }
  }

  /**
   * Setup the "Start AI Match" button functionality
   * Navigates to AI game page
   */
  private setupStartAiMatchButton(): void {
    const startAiButton = document.getElementById('start-ai-match');
    if (startAiButton) {
      // Store reference to the button
      this.startAiButton = startAiButton;
      
      // Create the event handler
      this.startAiMatchHandler = () => {
        this.handleStartAiMatch();
      };
      
      // Remove any existing event listeners to prevent duplicates
      const newButton = startAiButton.cloneNode(true) as HTMLElement;
      startAiButton.parentNode?.replaceChild(newButton, startAiButton);
      
      // Update our reference to the new button
      this.startAiButton = newButton;
      
      // Add the event listener to the new button
      newButton.addEventListener('click', this.startAiMatchHandler);
    }
  }

  /**
   * Setup WebSocket event handlers for listening to backend messages
   */
  private async setupWebSocketHandlers(): Promise<void> {
    try {
      // Import the singleton WebSocket service
      const webSocketModule = await import('../../lib/websocket');
      
      // Create server message handler
      const serverMessageHandler = (data: any) => {
        console.log('WebSocket: Server message received:', data);
        
        // Check if the message indicates a friend request or other relevant event
        if (data.message && data.message.includes('friend')) {
          // Refresh the friendships list when we receive friend-related messages
          this.fetchFriendships();
        }
      };

      // Create online friends handler
      const onlineFriendsHandler = (data: any) => {
        console.log('WebSocket: Online friends update:', data);
        // Handle online friends update (you can implement this later)
      };

      // Store references for cleanup
      this.webSocketHandlers.push(
        { eventType: 'server_message', handler: serverMessageHandler },
        { eventType: 'online_friends', handler: onlineFriendsHandler }
      );
      
      // Listen for server messages (general notifications)
      webSocketModule.webSocketService.on('server_message', serverMessageHandler);

      // Listen for online friends updates
      webSocketModule.webSocketService.on('online_friends', onlineFriendsHandler);

      console.log('WebSocket handlers set up for listening to backend messages');
    } catch (error) {
      console.error('Error setting up WebSocket handlers:', error);
    }
  }

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
   * Setup event delegation for confirm friend buttons
   */
  private setupConfirmFriendButtons(): void {
    // Use event delegation to handle confirm friend button clicks
    this.element.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('confirm-friend-btn')) {
        e.preventDefault();
        const friendshipId = target.getAttribute('data-friendship-id');
        if (friendshipId) {
          this.handleConfirmFriendRequest(parseInt(friendshipId));
        }
      }
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
   * Fetch user profile by user ID
   */
  private async fetchUserProfile(userId: number): Promise<{ nickname: string | null } | null> {
    try {
      // First try to get all profiles and find the one for this user
      const authModule = await import('../../lib/auth');
      const response = await authModule.authService.authenticatedFetch(getApiUrl('/profiles'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const profiles = await response.json();
        const userProfile = profiles.find((profile: any) => profile.userId === userId);
        
        if (userProfile) {
          return { nickname: userProfile.nickname };
        } else {
          console.warn(`No profile found for user ${userId}`);
          return null;
        }
      } else {
        console.warn(`Failed to fetch profiles:`, response.status);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching profile for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Fetch all friendships from the API using getAllFriendships endpoint
   */
  private async fetchFriendships(): Promise<void> {
    // Add a timeout to prevent infinite loading
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
    });

    try {
      this.setState({ loading: true, error: null });
      
      // Race between the actual fetch and the timeout
      await Promise.race([
        this.performFetchFriendships(),
        timeoutPromise
      ]);
    } catch (error) {
      console.error('Error fetching friendships:', error);
      this.setState({ 
        error: `Failed to load friendships: ${error instanceof Error ? error.message : 'Unknown error'}`,
        loading: false 
      });
    }
  }

  /**
   * Perform the actual friendship fetching logic
   */
  private async performFetchFriendships(): Promise<void> {
    try {
      // Get current user ID from auth service
      const currentUser = await this.getCurrentUserId();
      if (!currentUser) {
        throw new Error('Could not get current user ID');
      }
      
      // First try to get accepted friendships
      const authModule = await import('../../lib/auth');
      const response = await authModule.authService.authenticatedFetch(getApiUrl(`/friend/${currentUser}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      let acceptedFriendships: Friendship[] = [];
      
      if (response.ok) {
        acceptedFriendships = await response.json();
        console.log('Accepted friendships received:', acceptedFriendships);
      } else {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        
        // Check if it's the "no friends found" error (which is expected for new users)
        if (response.status === 500 && errorText.includes('No friends found for the specified user')) {
          console.log('No accepted friendships found - this is normal for new users');
          acceptedFriendships = [];
        } else {
          throw new Error(`Failed to fetch friendships: ${response.status} ${errorText}`);
        }
      }

      // Also get all friendships (including pending ones) to show pending requests
      const allFriendshipsResponse = await authModule.authService.authenticatedFetch(getApiUrl('/friend'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      let allFriendships: Friendship[] = [];
      
      if (allFriendshipsResponse.ok) {
        allFriendships = await allFriendshipsResponse.json();
        console.log('All friendships received:', allFriendships);
        
        // Filter to only show friendships involving the current user
        const userFriendships = allFriendships.filter((friendship: Friendship) => 
          friendship.initiator_id === currentUser || friendship.recipient_id === currentUser
        );
        
        console.log('User friendships (including pending):', userFriendships);
        
        // Fetch profiles for all users in friendships
        const userProfiles: { [userId: number]: { nickname: string | null } } = {};
        const uniqueUserIds = new Set<number>();
        
        // Collect all unique user IDs from friendships
        userFriendships.forEach((friendship: Friendship) => {
          uniqueUserIds.add(friendship.initiator_id);
          uniqueUserIds.add(friendship.recipient_id);
        });
        
        // Fetch profiles for all unique users
        for (const userId of uniqueUserIds) {
          try {
            const profile = await this.fetchUserProfile(userId);
            if (profile) {
              userProfiles[userId] = profile;
            }
          } catch (profileError) {
            console.warn(`Failed to fetch profile for user ${userId}:`, profileError);
            // Continue with other profiles even if one fails
          }
        }
        
        this.setState({ 
          friendships: userFriendships || [],
          userProfiles,
          loading: false,
          error: null
        });
      } else {
        // If we can't get all friendships, just use accepted ones
        this.setState({ 
          friendships: acceptedFriendships || [],
          loading: false,
          error: null
        });
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
   * Get current user ID from auth service
   */
  private async getCurrentUserId(): Promise<number | null> {
    try {
      // Try to get user ID from auth service
      const authModule = await import('../../lib/auth');
      const currentUser = authModule.authService.getCurrentUser();
      
      if (currentUser && currentUser.id) {
        return currentUser.id;
      }
      
      // If not available from auth service, try to get from API
      const response = await authModule.authService.authenticatedFetch(getApiUrl('/users/me'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        // The API returns { success: true, user: { id: ... } }
        if (userData.success && userData.user && userData.user.id) {
          return userData.user.id;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }

  /**
   * Handle adding a new friend using REST API
   */
  private async handleAddFriend(): Promise<void> {
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

    try {
      const authModule = await import('../../lib/auth');
      const response = await authModule.authService.authenticatedFetch(getApiUrl('/friend/me'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friend_id: userId }),
      });

      if (response.ok) {
        console.log('Friend request sent successfully');
        this.handleFriendRequestSuccess();
      } else {
        const errorData = await response.json();
        console.error('Failed to add friend:', errorData);
        
        // Handle specific error cases with user-friendly messages
        if (errorData.details && errorData.details.includes('Friendship already exists')) {
          this.showError('You have already sent a friend request to this user or are already friends');
        } else if (errorData.details && errorData.details.includes('User you want to befriend doesn\'t exist')) {
          this.showError('User not found. Please check the user ID and try again.');
        } else if (errorData.details && errorData.details.includes('You cannot send a friendship request to yourself')) {
          this.showError('You cannot add yourself as a friend');
        } else {
          this.showError(errorData.error || 'Failed to add friend');
        }
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      this.showError('Failed to add friend. Please try again.');
    }
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
   * Handle confirming a friend request
   */
  private async handleConfirmFriendRequest(friendshipId: number): Promise<void> {
    try {
      console.log('Confirming friend request for friendship:', friendshipId);
      
      // Find the friendship to get the initiator's ID
      const friendship = this.state.friendships.find((f: Friendship) => f.id === friendshipId);
      if (!friendship) {
        this.showError('Friendship not found');
        return;
      }
      
      // Get current user ID
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        this.showError('Could not get current user ID');
        return;
      }
      
      // Determine which user ID to send as friend_id
      // If current user is recipient, send initiator's ID
      // If current user is initiator, send recipient's ID
      const friendId = friendship.initiator_id === currentUserId 
        ? friendship.recipient_id 
        : friendship.initiator_id;
      
      const authModule = await import('../../lib/auth');
      const response = await authModule.authService.authenticatedFetch(getApiUrl('/friend/me'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friend_id: friendId }),
      });

      if (response.ok) {
        console.log('Friend request confirmed successfully');
        // Refresh the friendships list to show updated status
        this.fetchFriendships();
      } else {
        const errorData = await response.json();
        console.error('Failed to confirm friend request:', errorData);
        this.showError(errorData.error || 'Failed to confirm friend request');
      }
    } catch (error) {
      console.error('Error confirming friend request:', error);
      this.showError('Failed to confirm friend request. Please try again.');
    }
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
      
      const gameMode = 'ai';
      const opponentMode = 'single';
      const router = Router.getInstance();
      if (router) {
        router.navigate(`/game?mode=${gameMode}&opponent=${opponentMode}`);
      } else {
        // Fallback: use window.location if router is not available
        window.location.href = `/game?mode=${gameMode}&opponent=${opponentMode}`;
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
  private async renderFriendshipsList(): Promise<void> {
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

    // If loading has been going on for too long, show an error
    if (this.state.loading && this.state.friendships.length === 0) {
      friendListContainer.innerHTML = `
        <div class="flex items-start justify-start h-full">
          <div class="text-[#81C3C3] font-['Irish_Grover'] text-lg">Failed to load friendships. Please refresh the page.</div>
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

    // Get current user ID
    const currentUserId = await this.getCurrentUserId();
    if (!currentUserId) {
      console.error('Could not get current user ID for rendering friendships');
      return;
    }

    // Render friendships list
    const friendshipsHtml = this.state.friendships.map((friendship: Friendship) => {
      const isAccepted = friendship.accepted === 1;
      const isPending = friendship.accepted === null || friendship.accepted === undefined;
      const isInitiator = friendship.initiator_id === currentUserId;
      const isRecipient = friendship.recipient_id === currentUserId;
      
      // Get the other user's nickname
      const otherUserId = isInitiator ? friendship.recipient_id : friendship.initiator_id;
      const otherUserProfile = this.state.userProfiles[otherUserId];
      const displayName = otherUserProfile?.nickname || `User ${otherUserId}`;
      
      let statusText = '';
      let statusColor = '';
      let buttonHtml = '';
      
      if (isAccepted) {
        statusText = 'Accepted';
        statusColor = 'text-green-600';
        buttonHtml = `
          <button class="px-4 py-2 ml-[30%] lg:ml-[40%] bg-[#B784F2] text-white font-['Irish_Grover'] text-sm rounded-lg hover:scale-105 transition-transform duration-300">
            Play
          </button>
        `;
      } else if (isPending) {
        if (isInitiator) {
          // User initiated the request - show "Pending..."
          statusText = 'Pending';
          statusColor = 'text-yellow-600';
          buttonHtml = `
            <div class="px-4 py-2 ml-[40%] text-[#81C3C3] font-['Irish_Grover'] text-sm">
              Pending...
            </div>
          `;
        } else if (isRecipient) {
          // User received the request - show "Confirm" button
          statusText = 'Pending';
          statusColor = 'text-yellow-600';
          buttonHtml = `
            <button class="confirm-friend-btn px-4 py-2 ml-[30%] lg:ml-[40%] bg-[#81C3C3] text-white font-['Irish_Grover'] text-sm rounded-lg hover:scale-105 transition-transform duration-300" 
                    data-friendship-id="${friendship.id}">
              Confirm
            </button>
          `;
        }
      }
      
      return `
        <div class="flex items-center justify-start p-2 mb-1">
          <div class="flex items-center">
            <div>
              <div class="text-[#81C3C3] font-['Irish_Grover'] text-lg">${displayName}</div>
              <div class="text-[#81C3C3] text-sm opacity-75">
                ${friendship.initiator_id} → ${friendship.recipient_id}
              </div>
              <div class="text-[#81C3C3] text-xs opacity-50">
                Created: ${new Date(friendship.createdAt).toLocaleDateString()}
              </div>
              <div class="text-xs ${statusColor} font-semibold">
                ${statusText}
              </div>
            </div>
          </div>
          ${buttonHtml}
        </div>
      `;
    }).join('');

    friendListContainer.innerHTML = `
      <div class="w-full h-full overflow-y-auto">
        ${friendshipsHtml}
      </div>
    `;
  }


  render() {
    if (this.state.error) {
      console.error('MatchComponent error:', this.state.error);
    }
    
    setTimeout(async () => {
      try {
        await this.renderFriendshipsList();
        this.updatePageVisibility();
      } catch (error) {
        console.error('Error in render:', error);
        // If render fails, try to fetch friendships again
        if (this.state.loading) {
          console.log('Retrying friendship fetch due to render error');
          this.fetchFriendships();
        }
      }
    }, 100);
  }
}