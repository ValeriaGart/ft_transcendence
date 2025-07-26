export class WebSocketService {
  private static instance: WebSocketService;
  public ws!: WebSocket;

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

  private setupEventListeners(): void {
    this.ws.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    this.ws.onmessage = (event) => {
      console.log('Received message:', event.data);
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