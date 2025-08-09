export class WebSocketService {
  private static instance: WebSocketService;
  public ws!: WebSocket;
  private onlineStatusCallbacks: ((onlineFriends: number[]) => void)[] = [];
  private lastStartMatchMessage: MessageEvent | null = null;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }
  

  public isConnected(): boolean {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  //Added prevention of dup connections
  public connect(url: string): void {
    if (this.isConnected()) {
      console.log('WebSocketService: Already connected to WebSocket server');
      return;
    }

    // Close existing connection if it exists but isn't open
    if (this.ws) {
      this.ws.close();
    }
    
    this.ws = new WebSocket(url);
    this.setupEventListeners();
  }

  public sendMessage(message: string): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    }
  }

  /**
   * Request online friends status from the server
   */
  public requestOnlineFriends(): void {
    if (this.isConnected()) {
      const message = {
        type: 2
      };
      this.sendMessage(JSON.stringify(message));
    }
  }

  /**
   * Subscribe to online status updates
   */
  public onOnlineStatusUpdate(callback: (onlineFriends: number[]) => void): void {
    this.onlineStatusCallbacks.push(callback);
  }

  /**
   * Unsubscribe from online status updates
   */
  public offOnlineStatusUpdate(callback: (onlineFriends: number[]) => void): void {
    const index = this.onlineStatusCallbacks.indexOf(callback);
    if (index > -1) {
      this.onlineStatusCallbacks.splice(index, 1);
    }
  }

  /**
   * Get the last STARTMATCH message (for GamePage)
   */
  public getLastStartMatchMessage(): MessageEvent | null {
    return this.lastStartMatchMessage;
  }

  /**
   * Clear the last STARTMATCH message (after GamePage uses it)
   */
  public clearLastStartMatchMessage(): void {
    this.lastStartMatchMessage = null;
  }

  private setupEventListeners(): void {
    this.ws.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    this.ws.onmessage = (event) => {
      console.log('Received message:', event.data);
      
      try {
        const data = JSON.parse(event.data);
        
        // Handle online friends status update
        if (data.onlineFriends) {
          const onlineFriendIds = data.onlineFriends.map((friend: any) => friend.userId);
          console.log('Online friends received:', onlineFriendIds);
          
          // Notify all subscribers
          this.onlineStatusCallbacks.forEach(callback => {
            callback(onlineFriendIds);
          });
        }
        
        // Store STARTMATCH messages for GamePage
        if (data.type === "STARTMATCH") {
          console.log('Storing STARTMATCH message for GamePage');
          this.lastStartMatchMessage = event;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
  }
}