import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts";
import { getApiUrl } from "../../config/api";
import { ErrorManager } from "../Error";
import { authService } from "../../lib/auth";
import { WebSocketService } from "../../lib/webSocket";

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
  userProfiles: Record<number, { nickname?: string }>;
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

    // Use event delegation for dynamically created confirm buttons

    this.addEventListener('button.confirm-friend-btn', 'click', (e) => {
      e.preventDefault();
      console.log('confirm-friend-btn clicked');
      const button = e.target as HTMLElement;
      const initiatorId = button.getAttribute('data-initiator-id');
      console.log('Initiator ID:', initiatorId);
      this.handleConfirmFriend(parseInt(initiatorId || '0'));
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
        const allFriendships: Friendship[] = await response.json();
        console.log('All friendships received:', allFriendships);
        
        // Filter friendships to only include the current user's friendships
        const currentUser = authService.getCurrentUser();
        const currentUserId = currentUser?.id;
        
        if (!currentUserId) {
          this.showError('Could not get current user ID');
          return;
        }
        
        const userFriendships = allFriendships.filter(friendship => 
          friendship.initiator_id === currentUserId || friendship.recipient_id === currentUserId
        );
        
        console.log('Filtered friendships for user', currentUserId, ':', userFriendships);
        
        this.setState({ 
          friendships: userFriendships || [],
          loading: false 
        });

        // Fetch user profiles for all unique user IDs in friendships
        await this.fetchUserProfiles(userFriendships);
      } else {
        const errorData = await response.json();
        console.error('API Error response:', errorData);
        
        // If the error is "No friends found", treat it as an empty list instead of an error
        if (errorData.details && errorData.details.includes('No friends found')) {
          console.log('No friendships found, treating as empty list');
          this.setState({ 
            friendships: [],
            loading: false 
          });
        } else {
          throw new Error(`Failed to fetch friendships: ${response.status} ${JSON.stringify(errorData)}`);
        }
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
   * Fetch user profiles for all unique user IDs in friendships
   */
  private async fetchUserProfiles(friendships: Friendship[]): Promise<void> {
    try {
      // Get all unique user IDs from friendships
      const userIds = new Set<number>();
      friendships.forEach(friendship => {
        userIds.add(friendship.initiator_id);
        userIds.add(friendship.recipient_id);
      });

      // Remove current user ID since we don't need their profile
      const currentUser = authService.getCurrentUser();
      if (currentUser?.id) {
        userIds.delete(currentUser.id);
      }

      console.log('Fetching profiles for user IDs:', Array.from(userIds));

      // Fetch profiles for each user
      const userProfiles: Record<number, { nickname?: string }> = {};
      
      for (const userId of userIds) {
        try {
          const response = await fetch(getApiUrl(`/profiles/${userId}`), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (response.ok) {
            const profile = await response.json();
            userProfiles[userId] = profile;
          } else {
            console.warn(`Failed to fetch profile for user ${userId}`);
            userProfiles[userId] = { nickname: undefined };
          }
        } catch (error) {
          console.error(`Error fetching profile for user ${userId}:`, error);
          userProfiles[userId] = { nickname: undefined };
        }
      }

      this.setState({ userProfiles });
      console.log('User profiles loaded:', userProfiles);
    } catch (error) {
      console.error('Error fetching user profiles:', error);
    }
  }

  private async handleConfirmFriend(initiatorId: number): Promise<void> {
    if (!initiatorId) {
      this.showError('Invalid initiator ID');
      return;
    }

    try {
      const response = await fetch(getApiUrl('/friend/me'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          friend_id: initiatorId
        }),
      });

      if (response.ok) {
        console.log('Friend request accepted successfully');
        await this.fetchFriendships();
        this.renderFriendshipsList();
        this.updatePageVisibility();
      } else {
        const errorData = await response.json();
        console.error('Accept friend request failed:', errorData);
        this.showError(errorData.details || 'Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      this.showError('Network error while accepting friend request');
    }
  }

  private async handleAddFriend(): Promise<void> {
    const inputElement = this.element.querySelector('#add-friends-input') as HTMLInputElement;
    if (!inputElement) {
      this.showError('Input field not found');
      return;
    }

    const userIdStr = inputElement.value.trim();
    if (!userIdStr) {
      const storedUser = authService.getCurrentUser();
      this.showError('Please enter a user ID');
      console.log('Debug - storedUser:', storedUser);
      return;
    }

    const userId = parseInt(userIdStr);
    if (isNaN(userId)) {
      this.showError('Please enter a valid user ID (number)');
      return;
    }

    console.log('Adding friend with user ID:', userId);

    // Check if trying to add yourself
    const currentUser = authService.getCurrentUser();
    console.log('Current user id:', currentUser?.id, 'userId:', userId);
    if (currentUser?.id === userId) {
      this.showError('You cannot add yourself as a friend');
      return;
    }

    // Send friend request - backend will validate user existence
    try {
      const response = await fetch(getApiUrl('/friend/me'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          friend_id: userId
        }),
      });

      if (response.ok) {
        console.log('Friend request sent successfully');
        this.handleFriendRequestSuccess();
      } else {
        const errorData = await response.json();
        console.error('Friend request failed:', errorData);
        this.showError(errorData.details || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      this.showError('Network error while sending friend request');
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

    const currentUser = authService.getCurrentUser();
    const currentUserId = currentUser?.id;
    if (!currentUserId) {
      console.error('Could not get current user ID for rendering friendships');
      return;
    }

         // Sort friendships: accepted first, then pending
         const sortedFriendships = [...this.state.friendships].sort((a, b) => {
           const aAccepted = a.accepted === 1;
           const bAccepted = b.accepted === 1;
           if (aAccepted && !bAccepted) return -1; // a comes first
           if (!aAccepted && bAccepted) return 1;  // b comes first
           return 0; // same status, maintain original order
         });

         const friendshipsHtml = sortedFriendships.map((friendship: Friendship) => {
       const isAccepted = friendship.accepted === 1;
       const isPending = friendship.accepted === null || friendship.accepted === undefined;
       const isInitiator = friendship.initiator_id === currentUserId;
       const isRecipient = friendship.recipient_id === currentUserId;

       // Get the other user's nickname
       const otherUserId = isInitiator ? friendship.recipient_id : friendship.initiator_id;
       const otherUserProfile = this.state.userProfiles?.[otherUserId];
       const displayName = otherUserProfile?.nickname || `User ${otherUserId}`;

      let statusText = '';
      let statusColor = '';
      let buttonHtml = '';
    
      if (isAccepted) {
        statusText = 'Friend';
        statusColor = 'text-[#81C3C3]';
        buttonHtml = '';
      } else if (isPending) {
        if (isInitiator) {
          // User initiated the request - show "Pending..."
          statusText = 'Pending';
          statusColor = 'text-yellow-600';
          buttonHtml = `
            <div class="px-4 py-2 ml-[30%] text-[#81C3C3] font-['Irish_Grover'] text-sm">
              Pending...
            </div>
          `;
        } else if (isRecipient) {
          // User received the request - show "Confirm" button
          statusText = 'Pending';
          statusColor = 'text-yellow-600';
                     const buttonId = `confirm-btn-${friendship.id}`;
           buttonHtml = `
             <button id="${buttonId}" class="confirm-friend-btn px-4 py-2 ml-[20%] lg:ml-[30%] bg-[#81C3C3] text-white font-['Irish_Grover'] text-sm rounded-lg hover:scale-105 transition-transform duration-300 cursor-pointer" 
                     data-initiator-id="${friendship.initiator_id}">
               Confirm
             </button>
           `;
           console.log('Created confirm button for friendship:', friendship.id, 'initiator:', friendship.initiator_id);
        }
      }

      return `
        <div class="flex items-center justify-start p-2 mb-1">
          <div class="flex items-center">
            <div>
              <div class="text-[#81C3C3] font-['Irish_Grover'] text-lg">${displayName}</div>
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

    // Add event listeners to confirm buttons after rendering
    this.state.friendships.forEach((friendship: Friendship) => {
      const isPending = friendship.accepted === null || friendship.accepted === undefined;
      const isRecipient = friendship.recipient_id === currentUserId;
      
      if (isPending && isRecipient) {
        const buttonId = `confirm-btn-${friendship.id}`;
        const button = document.getElementById(buttonId);
        if (button) {
          console.log('Adding event listener to button:', buttonId);
          button.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Direct button click for friendship:', friendship.id);
            this.handleConfirmFriend(friendship.initiator_id);
          });
        }
      }
    });
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