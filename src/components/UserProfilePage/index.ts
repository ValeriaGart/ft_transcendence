import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts";
import { getApiUrl } from "../../config/api";
import { ErrorManager } from "../Error";
import { authService, type User } from "../../lib/auth";
import { WebSocketService } from "../../lib/webSocket";

interface Friendship {
  id: number;
  initiator_id: number;
  recipient_id: number;
  accepted: number;
  createdAt: string;
  acceptedAt: string;
}

interface UserProfilePageProps {
  nickname?: string;
}

interface UserProfilePageState {
  showError: boolean;
  error: string | null;
  friendships: Friendship[];
  loading: boolean;
  userProfiles: Record<number, { nickname?: string }>;
  user: User | null;
  onlineFriends: number[];
  targetUser: { id: number; nickname: string } | null;
  targetUserLoading: boolean;
}

export class UserProfilePage extends Component<UserProfilePageProps, UserProfilePageState> {
  protected static state: UserProfilePageState = {
    error: null,
    showError: false,
    friendships: [],
    loading: true,
    userProfiles: {},
    user: null,
    onlineFriends: [],
    targetUser: null,
    targetUserLoading: true
  }

  constructor(props?: UserProfilePageProps) {
    super(props || {});
  }

  /**
   * Lifecycle method called when component is mounted to DOM
   * Sets up event listeners and fetches data
   */
  protected onMount(): void {
    console.log('UserProfilePage onMount called');
  
    this.setupOnlineStatus();
    this.fetchTargetUser();
    this.fetchFriendships();
  }

  /**
   * Setup online status tracking via WebSocket
   */
  private setupOnlineStatus(): void {
    const ws = WebSocketService.getInstance();
    
    // Subscribe to online status updates
    ws.onOnlineStatusUpdate(this.handleOnlineStatusUpdate.bind(this));

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
   * Fetch the target user's information based on nickname from props
   */
  private async fetchTargetUser(): Promise<void> {
    try {
      this.setState({ targetUserLoading: true });
      
      // Get nickname from props
      const nickname = this.props.nickname;
      
      if (!nickname) {
        this.showError('Invalid user profile URL');
        return;
      }

      console.log('Fetching user profile for nickname:', nickname);

      // Search for user by nickname
      const response = await fetch(getApiUrl(`/profiles/search?nickname=${encodeURIComponent(nickname)}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        this.setState({ 
          targetUser: { id: userData.id, nickname: userData.nickname },
          targetUserLoading: false 
        });
      } else {
        const errorData = await response.json();
        console.error('User search failed:', errorData);
        this.showError('User not found');
        this.setState({ targetUserLoading: false });
      }
    } catch (error) {
      console.error('Error fetching target user:', error);
      this.showError('Failed to load user profile');
      this.setState({ targetUserLoading: false });
    }
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

      // Check if friend is online
      const isOnline = this.state.onlineFriends.includes(otherUserId);
      const onlineStatusColor = '';
      const onlineStatusText = isOnline ? 'Online' : 'Offline';

      let statusText = '';
      let statusColor = '';
    
      if (isAccepted) {
        statusText = 'Friend';
        statusColor = 'text-[#81C3C3]';
      } else if (isPending) {
        if (isInitiator) {
          // User initiated the request - show "Pending..."
          statusText = 'Pending';
          statusColor = '';
        } else if (isRecipient) {
          // User received the request - show "Pending"
          statusText = 'Pending';
          statusColor = '';
        }
      }

      return `
        <div class="flex items-center justify-start p-2 mb-1 ">
          <div class="flex items-center ">
            <div>
              <div class="text-[#81C3C3] font-['Irish_Grover'] text-lg flex items-center gap-1">
                ${displayName}
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
        </div>
      `;
    }).join('');

    friendListContainer.innerHTML = `
      <div class="w-full h-[95%] lg:h-full overflow-y-auto -ml-[5%]">
        ${friendshipsHtml}
      </div>
    `;
  }

  protected onUnmount(): void {
    console.log('UserProfilePage onUnmount called');
    
    // Clean up WebSocket subscription
    const ws = WebSocketService.getInstance();
    ws.offOnlineStatusUpdate(this.handleOnlineStatusUpdate.bind(this));
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
      console.error('UserProfilePage error:', this.state.error);
    }
    
    setTimeout(() => {
      this.renderFriendshipsList();
    }, 100);
  }
} 