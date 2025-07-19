import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from '../config/api';

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface FriendRequest {
  fromUserId: number;
  toUserId: number;
  fromUserEmail: string;
  toUserEmail: string;
}

export interface UserSearchResult {
  id: number;
  email: string;
  nickname?: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket(): void {
    const wsUrl = getApiBaseUrl().replace('http', 'ws');
    this.socket = io(wsUrl, {
      transports: ['websocket'],
      autoConnect: true,
      withCredentials: true
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
    });

    this.socket.on('message', (message: WebSocketMessage) => {
      console.log('WebSocket message received:', message);
      this.handleMessage(message);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message.data));
    }
  }

  public on(event: string, handler: (data: any) => void): void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event)!.push(handler);
  }

  public off(event: string, handler: (data: any) => void): void {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  public emit(event: string, data: any): void {
    console.log('WebSocket emit called:', event, data);
    console.log('Socket connected:', this.isConnected);
    
    if (this.socket && this.isConnected) {
      console.log('Using WebSocket for:', event);
      this.socket.emit(event, data);
    } else {
      console.log('WebSocket not connected, falling back to HTTP requests for:', event);
      this.handleHttpFallback(event, data);
    }
  }

  private async handleHttpFallback(event: string, data: any): Promise<void> {
    console.log('HTTP fallback called for event:', event, 'with data:', data);
    try {
      switch (event) {
        case 'add_friend':
          console.log('Calling addFriendHttp with recipient_id:', data.recipient_id);
          await this.addFriendHttp(data.recipient_id);
          break;
        case 'get_current_user':
          console.log('Calling getCurrentUserHttp');
          await this.getCurrentUserHttp();
          break;
        default:
          console.error('Unknown WebSocket event:', event);
      }
    } catch (error) {
      console.error('HTTP fallback error:', error);
    }
  }

  private async searchUserHttp(userId: number): Promise<void> {
    try {
      console.log('Searching for user with ID:', userId);
      
      // Get user by ID
      const response = await fetch(`${getApiBaseUrl()}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('User response status:', response.status);
      console.log('User response URL:', `${getApiBaseUrl()}/users/${userId}`);
      
      if (response.ok) {
        const user = await response.json();
        console.log('Found user:', user);
        
        this.handleMessage({ type: 'user_search_result', data: { success: true, user } });
      } else {
        const errorText = await response.text();
        console.error('User endpoint error:', errorText);
        console.error('Response status:', response.status);
        this.handleMessage({ type: 'user_search_result', data: { success: false, error: 'User not found' } });
      }
    } catch (error) {
      console.error('Search user HTTP error:', error);
      this.handleMessage({ type: 'user_search_result', data: { success: false, error: 'Network error' } });
    }
  }

  private async addFriendHttp(recipientId: number): Promise<void> {
    try {
      console.log('Sending friend request to:', `${getApiBaseUrl()}/friend/me`);
      console.log('Request body:', { friend_id: recipientId });
      
      const response = await fetch(`${getApiBaseUrl()}/friend/me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ friend_id: recipientId })
      });

      console.log('Friend request response status:', response.status);
      
      if (response.ok) {
        console.log('Friend request successful');
        this.handleMessage({ type: 'friend_request_result', data: { success: true } });
      } else {
        const errorText = await response.text();
        console.error('Friend request error:', errorText);
        this.handleMessage({ type: 'friend_request_result', data: { success: false, error: errorText } });
      }
    } catch (error) {
      console.error('Friend request network error:', error);
      this.handleMessage({ type: 'friend_request_result', data: { success: false, error: 'Network error' } });
    }
  }

  private async getCurrentUserHttp(): Promise<void> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        this.handleMessage({ type: 'current_user_result', data: { success: true, user: userData.user } });
      } else {
        this.handleMessage({ type: 'current_user_result', data: { success: false, error: 'Failed to get current user' } });
      }
    } catch (error) {
      this.handleMessage({ type: 'current_user_result', data: { success: false, error: 'Network error' } });
    }
  }

  // Note: User search is disabled since we can't access other users' data
  // public searchUser(userId: number): void {
  //   this.emit('search_user', { userId });
  // }

  public addFriend(recipientId: number): void {
    this.emit('add_friend', { recipient_id: recipientId });
  }

  public getCurrentUser(): void {
    this.emit('get_current_user', {});
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  public isSocketConnected(): boolean {
    return this.isConnected;
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService(); 