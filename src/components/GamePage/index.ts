import { Component } from "@blitz-ts";
import { GameEngine } from "../../game/gameEngine";

interface GamePageState {
  gameMode: string;
  opponentMode: string;
}

interface GamePageProps {
  mode?: string;
  opponent?: string;
}

export class GamePage extends Component<GamePageProps, GamePageState> {
    // Singleton instance to prevent multiple instances
    private static isMounted: boolean = false;
    
    private gameEngine: GameEngine | null = null;

    protected static state: GamePageState = {
        gameMode: 'ai',
        opponentMode: 'single'
    };

    constructor(props: GamePageProps = {}) {
        super(props);
    }

    render() {
        // Read parameters from props (router) or URL
        this.readParameters();
        
        // Create canvas element for the game
        const canvas = document.createElement('canvas');
        canvas.id = 'gameCanvas';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.maxWidth = '1600px';
        canvas.style.maxHeight = '900px';
        
        const element = this.getElement();
        if (element) {
            element.innerHTML = '';
            element.appendChild(canvas);

            setTimeout(() => {
                this.initializeGame();
            }, 0);
        }
    }

    private readParameters(): void {
        // First try to get parameters from props (router parameters)
        let mode = this.props.mode;
        let opponent = this.props.opponent;
        
        // If not in props, fall back to URL parameters
        if (!mode || !opponent) {
            const urlParams = new URLSearchParams(window.location.search);
            mode = mode || urlParams.get('mode') || 'ai';
            opponent = opponent || urlParams.get('opponent') || 'single';
        }
        
        this.setState({
            gameMode: mode,
            opponentMode: opponent
        });
        
        console.log('Game parameters:', { mode, opponent });
    }

    private initializeGame(): void {
        try {
            this.gameEngine = new GameEngine('gameCanvas');
            
            // Start the game with the parameters
            if (this.state.gameMode === 'ai') {
                // You can pass these parameters to your game engine
                // For now, just start the game loop
                this.gameEngine.startGameLoop();
                console.log('AI game started with opponent mode:', this.state.opponentMode);
            } else {
                this.gameEngine.startGameLoop();
                console.log('Game started with mode:', this.state.gameMode);
            }
            
            console.log('Game engine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game engine:', error);
        }
    }

    protected onMount(): void {
        console.log('GamePage onMount called, isMounted:', GamePage.isMounted);
        
        // Prevent multiple onMount calls
        if (GamePage.isMounted) {
            console.log('GamePage already mounted, skipping onMount');
            return;
        }
        
        GamePage.isMounted = true;
        console.log('GamePage mounted');
    }

    protected onUnmount(): void {
        console.log('GamePage onUnmount called');
        GamePage.isMounted = false;
        
        if (this.gameEngine) {
            // Add any cleanup logic here if needed
            console.log('GamePage component unmounted');
        }
        super.onUnmount();
    }
}
