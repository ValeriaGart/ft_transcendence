import { getApiBaseUrl } from '../config/api';
import { ErrorManager } from "../components/Error";

export interface WebSocketMessage {
  type: number;
  data?: any;
  message?: string;
  players?: any[];
  gameMode?: string;
  oppMode?: string;
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

export class WebSocketService {
  private socket: WebSocket | null = null;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  public on(eventType: string, handler: (data: any) => void): void {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, []);
    }
    this.messageHandlers.get(eventType)!.push(handler);
  }

  public off(eventType: string, handler?: (data: any) => void): void {
    if (!this.messageHandlers.has(eventType)) {
      return;
    }
    
    if (handler) {
      const handlers = this.messageHandlers.get(eventType)!;
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.messageHandlers.delete(eventType);
    }
  }

  public send(message: WebSocketMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close(1000, 'Manual disconnect');
      this.socket = null;
    }
  }

  public initializeSocket(): void {
    console.log('WebSocketService.initializeSocket() called');
    console.log('Current socket state:', this.socket ? this.socket.readyState : 'null');
    
    // Prevent multiple initializations
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      console.log('WebSocket already connected or connecting, skipping initialization');
      return;
    }
    
    // Get the auth token from localStorage
    const token = localStorage.getItem('auth_token');
    let wsUrl = getApiBaseUrl().replace('http', 'ws') + '/hello-ws';
    
    // Add token to URL if available
    if (token) {
      wsUrl += `?token=${encodeURIComponent(token)}`;
    }
    
    console.log('Attempting to connect to WebSocket:', wsUrl);
    
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connected successfully');
      this.reconnectAttempts = 0;
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      console.log('WebSocket close event details:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        reconnectAttempts: this.reconnectAttempts
      });
      
      // Attempt to reconnect if not a normal closure
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        setTimeout(() => this.initializeSocket(), this.reconnectDelay * this.reconnectAttempts);
      } else if (event.code !== 1000 && this.reconnectAttempts >= this.maxReconnectAttempts) {
        // Show error when max reconnection attempts are reached
        this.showWebSocketError('Connection lost and unable to reconnect. Please refresh the page to try again.');
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket connection error:', error);
      console.log('WebSocket URL was:', wsUrl);
      this.showWebSocketError('Failed to connect to the server. Please check your connection and try again.');
    };
  }

  private handleMessage(message: any): void {
    // Handle different message formats from the backend
    if (message.sender && message.message) {
      // Server broadcast message format
      const handlers = this.messageHandlers.get('server_message');
      if (handlers) {
        handlers.forEach(handler => handler({ sender: message.sender, message: message.message }));
      }
    } else if (message.onlineFriends) {
      // Online friends update format
      const handlers = this.messageHandlers.get('online_friends');
      if (handlers) {
        handlers.forEach(handler => handler(message.onlineFriends));
      }
    } else if (message.type !== undefined) {
      // Numeric type message format
      const handlers = this.messageHandlers.get(`type_${message.type}`);
      if (handlers) {
        handlers.forEach(handler => handler(message));
      }
    }
  }

  private showWebSocketError(message: string): void {
    // Find a suitable parent element to mount the error component
    const parentElement = document.body;
    ErrorManager.showError(message, parentElement);
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService();
