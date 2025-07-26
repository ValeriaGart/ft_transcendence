import { Component } from "@blitz-ts/Component";
import { Router } from "@blitz-ts";
import { WebSocketService } from "./../../lib/webSocket";

interface MatchComponentState {
  error: string | null;
}

export class MatchComponent extends Component<MatchComponentState> {
  protected static state: MatchComponentState = {
    error: null,
  }

  constructor() {
    super();
  }

  /**
   * Lifecycle method called when component is mounted to DOM
   * Sets up event listeners
   */
  protected onMount(): void {
    this.setupStartAiMatchButton();
  }

  /**
   * Setup the "Start AI Match" button functionality
   * Navigates to AI game page
   */
  private setupStartAiMatchButton(): void {
    const startAiButton = document.getElementById('start-ai-match');
    if (startAiButton) {
      startAiButton.addEventListener('click', () => {
        this.handleStartAiMatch();
      });
    }
  }

  /**
   * Handle AI match start button click
   * Navigates to AI game page
   */
  private handleStartAiMatch(): void {
    try {
      console.log('Starting AI match...');

      const ws = WebSocketService.getInstance();
      ws.connect('ws://localhost:3000/hello-ws');

      const msg = {
        "type": 3,
        "players": [
          {"nick": "gio", "ai": false},
          {"nick": "CPU", "ai": true},
        ],
        "gameMode": "bestof",
        "oppMode": "single"
        };

      ws.sendMessage(JSON.stringify(msg));
      
      // Navigate to the game page
      const router = Router.getInstance();
      if (router) {
        router.navigate('/game');
      } else {
        // Fallback: use window.location if router is not available
        window.location.href = '/game';
      }
      
    } catch (error) {
      console.error('Error starting AI match:', error);
      this.setState({
        error: 'Failed to start AI match. Please try again.'
      });
    }

    console.log('AI Match started');
  }

  render() {
    if (this.state.error) {
      console.error('MatchComponent error:', this.state.error);
      // TODO: Display error message to user
    }
  }
}