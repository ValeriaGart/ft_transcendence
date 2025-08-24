import { Component } from "@blitz-ts/Component";
import { getApiUrl } from "../../config/api";
import { ErrorManager } from "../Error";
import { authService, type User } from "../../lib/auth";
import { WebSocketService } from "../../lib/webSocket";
import { sanitizeForTemplate } from "../../utils/sanitization";

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
  user: User | null;
  onlineFriends: number[];
  showStartGamePopup: boolean;
  selectedFriendIds: number[];
  invitationHandler?: (event: MessageEvent) => void;
}

export class MatchComponent extends Component<MatchComponentState> {
  private onlineStatusHandler?: (onlineFriends: number[]) => void;
  protected static state: MatchComponentState = {
    currentPage: 'show-friends',
    error: null,
    showError: false,
    friendships: [],
    loading: true,
    showAddFriendForm: false,
    userProfiles: {},
    user: null,
    onlineFriends: [],
    showStartGamePopup: false,
    selectedFriendIds: [],
    invitationHandler: undefined
  }

  constructor() {
    super();
    // Initialize instance-specific state
    this.state = {
      ...this.state,
      showStartGamePopup: false,
      selectedFriendIds: []
    };
  }

  /**
   * Lifecycle method called when component is mounted to DOM
   * Sets up event listeners and fetches friendships
   */
  protected onMount(): void {
    console.log('MatchComponent onMount called');
  
    // Make component instance available globally for onclick handlers
    (window as any).matchComponent = this;
  
    // Mark showStartGamePopup as structural since it affects template rendering
    this.markStructural('showStartGamePopup');
  
    this.setupStartAiMatchButton();
    this.setupToggleButtons();
    this.setupOnlineStatus();
    this.fetchFriendships();
    this.updatePageVisibility();
    this.updatePlayButtonText();
  }

  /**
   * Setup online status tracking via WebSocket
   */
  private setupOnlineStatus(): void {
    const ws = WebSocketService.getInstance();
    
    // Subscribe to online status updates
    this.onlineStatusHandler = this.handleOnlineStatusUpdate.bind(this);
    ws.onOnlineStatusUpdate(this.onlineStatusHandler);

    // Setup WebSocket message handling for errors
    this.setupWebSocketErrorHandling();

    // Request initial online friends status
    if (ws.isConnected()) {
      ws.requestOnlineFriends();
    } else {
      // If not connected, wait for connection and then request
      const checkConnection = () => {
        if (ws.isConnected()) {
          ws.requestOnlineFriends();
        } else {
          setTimeout(checkConnection, 1000);
        }
      };
      checkConnection();
    }
  }

  /**
   * Setup WebSocket error handling
   */
  private setupWebSocketErrorHandling(): void {
    const ws = WebSocketService.getInstance();
    
    // Add message listener to handle errors
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle error messages
        if (data.type === "ERROR") {
          console.log('WebSocket error received:', data.message);
          
          if (data.message.includes('Players are busy')) {
            this.showError('One or both players are currently in a game. Please wait for the current game to finish or try again later.');
          } else {
            this.showError(data.message || 'An error occurred while creating the match.');
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    // Add the message listener only if WebSocket is connected
    if (ws.ws && ws.isConnected()) {
      ws.ws.addEventListener('message', handleMessage);
      // Store the handler for cleanup
      this.setState({ invitationHandler: handleMessage });
    } else {
      // If not connected, wait for connection and then add listener
      const checkConnection = () => {
        if (ws.ws && ws.isConnected()) {
          ws.ws.addEventListener('message', handleMessage);
          this.setState({ invitationHandler: handleMessage });
        } else {
          setTimeout(checkConnection, 1000);
        }
      };
      checkConnection();
    }
  }
  /**
   * Show the start game popup
   */
  private showStartGamePopup(): void {
    // Deprecated: StartGamePopUp is always mounted in UserPage. Use window events instead.
    console.warn('showStartGamePopup called but deprecated; use window events.');
  }

  /**
   * Setup the "Play" button functionality
   * Starts AI match if no friend selected, or 1v1 match if friend selected
   */
  private setupStartAiMatchButton(): void {
    console.log('Setting up Play button...');
    
    // Use the component's event listener system
    this.addEventListener('#start-ai-match', 'click', async (e) => {
      e.preventDefault();
      console.log('Play button clicked');
      
      const selectedIds = this.state.selectedFriendIds;
      if (selectedIds.length > 1) {
        await this.startTournament(selectedIds);
        return;
      }
      if (selectedIds.length === 1) {
        // Backward compatibility: reuse 1v1 path
        (this.state as any).selectedFriendId = selectedIds[0];
        await this.start1v1Match();
        return;
      }
      // No friend selected: ask user to choose AI vs Local
      // Open StartGamePopUp with choice UI matching AI popup style
      window.dispatchEvent(new Event('open-choice-popup'));
    });
    
    console.log('Event listener attached using component system');
  }

  /**
   * Start 1v1 match with selected friend
   */
  private async start1v1Match(): Promise<void> {
    console.log('Starting 1v1 match with friend...');
    
    try {
      // Get current user's profile to get their nickname
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        console.error('User not authenticated');
        return;
      }

      // Fetch current user's profile to get nickname
      const profileResponse = await authService.authenticatedFetch(getApiUrl('/profiles/me'));
      if (!profileResponse.ok) {
        console.error('Failed to get user profile');
        return;
      }

      const profileData = await profileResponse.json();
      const userNickname = profileData.nickname || `User${currentUser.id}`;

      if (!userNickname || userNickname.trim() === '') {
        console.error('User nickname not set');
        return;
      }

      // Get the selected friend's profile
      const selectedFriendProfile = this.state.userProfiles[this.state.selectedFriendId];
      if (!selectedFriendProfile || !selectedFriendProfile.nickname) {
        this.showError('Selected friend profile not found');
        return;
      }

      // Prevent inviting offline friend
      const friendId = this.state.selectedFriendId as number;
      const isFriendOnline = this.state.onlineFriends.includes(friendId);
      if (!isFriendOnline) {
        this.showError('Friend is offline');
        return;
      }

      console.log('Starting 1v1 match with friend:', selectedFriendProfile.nickname);

      const ws = WebSocketService.getInstance();

      // Send type 3 message for 1v1 match with friend
      const msg = {
        "type": 3,
        "players": [
          {"nick": userNickname, "ai": false},
          {"nick": selectedFriendProfile.nickname, "ai": false}
        ],
        "gameMode": "bestof",
        "oppMode": "online"
      };

      console.log('Sending 1v1 match request:', JSON.stringify(msg));
      ws.sendMessage(JSON.stringify(msg));
      
      // Show the popup for 1v1 matches too
      this.showStartGamePopup();
      
      // Show success message
      console.log('1v1 match invitation sent to friend');
      
    } catch (error) {
      console.error('Error starting 1v1 match:', error);
      this.showError('Failed to start 1v1 match. Please try again.');
    }
  }

  private async startTournament(selectedFriendIds: number[]): Promise<void> {
    console.log('Starting tournament with selected friends:', selectedFriendIds);
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        this.showError('You must be logged in to start a game');
        return;
      }

      // Get current user's nickname
      const meResp = await authService.authenticatedFetch(getApiUrl('/profiles/me'));
      if (!meResp.ok) {
        this.showError('Failed to get user profile');
        return;
      }
      const meData = await meResp.json();
      const meNick = (meData.nickname || `User${currentUser.id}`).trim();
      if (!meNick) {
        this.showError('Please set a nickname in your profile before starting a game');
        return;
      }

      // Build players list: me + selected friends (2 or 3). If only 2 friends, fill the 4th slot with AI.
      const players: { nick: string; ai: boolean }[] = [];
      players.push({ nick: meNick, ai: false });

      for (const fid of selectedFriendIds) {
        // online check
        if (!this.state.onlineFriends.includes(fid)) {
          this.showError('One of the selected friends is offline');
          return;
        }
        // fetch nickname
        let nick = '';
        try {
          const r = await fetch(getApiUrl(`/profiles/${fid}`), { credentials: 'include' });
          if (r.ok) {
            const fp = await r.json();
            nick = (fp?.nickname || '').trim();
          }
        } catch {}
        if (!nick) {
          const cached = this.state.userProfiles[fid];
          nick = (cached?.nickname || '').trim();
        }
        if (!nick) {
          this.showError('Failed to resolve a player nickname');
          return;
        }
        players.push({ nick, ai: false });
        if (players.length >= 4) break;
      }

      while (players.length < 4) {
        players.push({ nick: 'CPU', ai: true });
      }

      // Validate unique nicks (backend will also validate)
      const nicks = new Set(players.map(p => p.nick));
      if (nicks.size !== players.length) {
        this.showError('Duplicate nicknames detected. Please adjust selections.');
        return;
      }

      // Send tournament request
      const ws = WebSocketService.getInstance();
      const msg = {
        type: 3,
        players,
        gameMode: 'tournament',
        oppMode: 'online'
      };
      console.log('Sending tournament request:', JSON.stringify(msg));
      ws.sendMessage(JSON.stringify(msg));

      // Inform StartGamePopUp about pending participants for better waiting UI
      try {
        const participantNames = players.map(p => p.nick);
        window.dispatchEvent(new CustomEvent('set-pending-participants', { detail: { participants: participantNames, type: 'tournament' } }));
      } catch {}

      // Show waiting popup is handled by StartGamePopUp via INFO/CANCEL/STARTMATCH
    } catch (e) {
      console.error('Error starting tournament:', e);
      this.showError('Failed to start tournament. Please try again.');
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
        
        // Refresh online status after fetching friendships
        this.refreshOnlineStatus();
        
        // Update play button text after loading friendships
        this.updatePlayButtonText();
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
   * Refresh online status from WebSocket
   */
  private refreshOnlineStatus(): void {
    const ws = WebSocketService.getInstance();
    if (ws.isConnected()) {
      ws.requestOnlineFriends();
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
        this.refreshOnlineStatus();
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

    const nickname = inputElement.value.trim();
    if (!nickname) {
		return this.showError('Please enter a nickname');
	}
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) { 
	  return this.showError('You must be logged in to add friends');
	}

    try {
      // Check if trying to add yourself
      const profileResponse = await authService.authenticatedFetch(getApiUrl('/profiles/me'));
      if (!profileResponse.ok) {
		return this.showError('Failed to get your profile');
	  }
      
      const currentUserProfile = await profileResponse.json();
      if (currentUserProfile.nickname === nickname) {
        return this.showError('You cannot add yourself as a friend');
      }

      // Send friend request using nickname
      const response = await fetch(getApiUrl('/friend/me'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          friend_nickname: nickname
        }),
      });

      if (response.ok) {
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
    // Clear input and switch back to friends list
    const inputElement = this.element.querySelector('#add-friends-input') as HTMLInputElement;
    if (inputElement) {
      inputElement.value = '';
    }
    
    this.setState({ currentPage: 'show-friends' });
    this.updatePageVisibility();
    
    // Refresh the friendships list
    this.fetchFriendships();
    this.refreshOnlineStatus();
  }

  /**
   * Handle friend selection for 1v1 game
   */
  public handleFriendSelection(friendId: number): void {
    console.log('Friend selected:', friendId);
    const current = new Set<number>(this.state.selectedFriendIds);
    if (current.has(friendId)) {
      current.delete(friendId);
    } else {
      if (current.size >= 3) {
        this.showError('You can select at most 3 friends (tournament of 4)');
        return;
      }
      current.add(friendId);
    }
    this.setState({ selectedFriendIds: Array.from(current) });
    this.renderFriendshipsList();
    this.updatePlayButtonText();
  }

  /**
   * Update the play button text based on friend selection
   */
  private updatePlayButtonText(): void {
    const playButton = this.element.querySelector('#start-ai-match') as HTMLButtonElement;
    if (playButton) {
      const count = this.state.selectedFriendIds.length;
      if (count === 0) {
        playButton.textContent = 'Play vs AI || locally';
      } else if (count === 1) {
        const fid = this.state.selectedFriendIds[0];
        const friendName = sanitizeForTemplate(this.state.userProfiles[fid]?.nickname || `User ${fid}`);
        playButton.textContent = `Play vs ${friendName}`;
      } else {
        playButton.textContent = `Start Tournament (${count + 1}/4)`;
      }
    }
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
       const safeUserId = Number.isInteger(otherUserId) ? otherUserId : 0;
       const otherUserProfile = this.state.userProfiles?.[otherUserId];
       const displayName = sanitizeForTemplate(otherUserProfile?.nickname || `User ${otherUserId}`);

       // Check if friend is online
       const isOnline = this.state.onlineFriends.includes(otherUserId);
       const onlineStatusColor = '';
       const onlineStatusText = isOnline ? 'Online' : 'Offline';

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
          statusColor = '';
          buttonHtml = `
            <div class="px-4 py-2 ml-[30%] text-[#81C3C3] font-['Irish_Grover'] text-sm">
              Pending...
            </div>
          `;
        } else if (isRecipient) {
          // User received the request - show "Confirm" button
          statusText = 'Pending';
          statusColor = '';
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

      // Only allow selection for accepted friends
      const canSelect = isAccepted;
      const isSelected = this.state.selectedFriendIds.includes(otherUserId);
      const selectedClass = isSelected ? 'bg-[#f2e6ff]' : '';
      const borderStyle = isSelected ? 'border-2 border-[#B784F2]' : '';
      
      const cursorStyle = 'cursor-default';
      const friendItemClass = canSelect ? 'friend-item' : '';
      
      return `
        <div class="flex items-center justify-start p-2 mb-1 ${cursorStyle} hover:bg-[#f2e6ff] transition-colors duration-200 ${friendItemClass} ${borderStyle} ${selectedClass}" 
             data-friend-id="${safeUserId}"
             ${canSelect ? `onclick="window.matchComponent && window.matchComponent.handleFriendSelection(${safeUserId})"` : ''}>
          <div class="flex items-center ">
            <div>
              <div class="text-[#81C3C3] font-['Irish_Grover'] text-lg flex items-center gap-1">
                <span class="hover:underline hover:text-[#B784F2] cursor-pointer" onclick="event.stopPropagation(); window.blitzNavigate && window.blitzNavigate('/view/${encodeURIComponent(displayName)}');">${displayName}</span>
                <div class="w-2 h-2 rounded-full ${onlineStatusColor} flex-shrink-0" style="background-color: ${isOnline ? '#AEDFAD' : '#FFA9A3'};" title="${onlineStatusText}"></div>
              </div>
              <div class="text-[#81C3C3] text-xs opacity-50 ">
                Created: ${new Date(friendship.createdAt).toLocaleDateString()}
              </div>
              <div class="text-xs ${statusColor} font-semibold" style="${statusText === 'Pending' ? 'color: #FFA9A3;' : ''}">
                ${statusText}
              </div>
            </div>
          </div>
          ${buttonHtml}
        </div>
      `;
    }).join('');

    friendListContainer.innerHTML = `
      <div class="w-full h-[95%] lg:h-full overflow-y-auto -ml-[5%]">
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
    
    // Clean up WebSocket subscription
    const ws = WebSocketService.getInstance();
    if (this.onlineStatusHandler) {
      ws.offOnlineStatusUpdate(this.onlineStatusHandler);
    }
    
    // Clean up message handler
    if (this.state.invitationHandler && ws.ws) {
      ws.ws.removeEventListener('message', this.state.invitationHandler);
    }
  }

  /**
   * Handle online status updates from WebSocket
   */
  private handleOnlineStatusUpdate(onlineFriends: number[]): void {
    console.log('Online friends update received:', onlineFriends);
    this.setState({ onlineFriends });
    this.renderFriendshipsList(); // Re-render to update status indicators
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