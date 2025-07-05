import { myJSX } from './util/mini-jsx';
import { AppOne } from './pageOne/AppOne';
import { LoadingPage } from './pageOne/LoadingPage';
import { getAuthState, subscribeToAuth, logout, setGameInProgress } from './util/auth/authState';

export function App() {
  let authState = getAuthState();

  subscribeToAuth((newState) => {
    authState = newState;
    updateView();
  });

  const cleanupGoogleElements = () => {
    // Remove all Google-related elements that might be lingering
    const selectors = [
      '[data-client]',
      '.g_id_signin', 
      'div[data-id="g_id_onload"]',
      'iframe[src*="accounts.google.com"]',
      '[id*="credential_picker"]',
      '.g_id_container',
      '.g-recaptcha',
      'div[role="dialog"][aria-label*="Google"]',
      'button[data-hl*="en"]'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => element.remove());
    });
    
    // Also clean up any potential overlays or popups
    const overlays = document.querySelectorAll('div[style*="position: fixed"], div[style*="z-index"]');
    overlays.forEach(overlay => {
      if (overlay.innerHTML.includes('google') || overlay.innerHTML.includes('Sign in')) {
        overlay.remove();
      }
    });
  };

  const handleLogout = async () => {
    try {
      setGameInProgress(false);
      await logout();
      cleanupGoogleElements();
      updateView();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const updateView = () => {
    const appContainer = document.getElementById('app-container');
    if (!appContainer) return;

    if (authState.isAuthenticated && authState.user) {
      appContainer.innerHTML = '';
      cleanupGoogleElements();
      
      appContainer.innerHTML = `
        <style>
          /* Hide any Google Sign-in elements that might appear */
          [data-client],
          .g_id_signin,
          div[data-id="g_id_onload"],
          iframe[src*="accounts.google.com"],
          [id*="credential_picker"],
          .g_id_container,
          div[role="dialog"][aria-label*="Google"],
          button[data-hl*="en"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            position: absolute !important;
            left: -9999px !important;
          }
        </style>
        <div class="h-screen bg-gray-900 flex items-center justify-center text-white relative">
          <!-- Sound Button -->
          <button id="sound-btn" class="absolute bottom-4 right-4 hover:opacity-80">
            <img id="sound-icon" src="/art/sound_button_off.svg" alt="Sound" class="h-[40px] w-[40px]" />
          </button>
          
          <div class="text-center">
            <h1 class="text-3xl font-bold mb-4">Welcome to ft_transcendence!</h1>
            <p class="text-lg mb-6">Ready to play?</p>
            <div class="space-x-4">
              <button id="start-game-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
                Start Game
              </button>
              <button id="logout-btn" class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg">
                Logout
              </button>
            </div>
          </div>
        </div>
      `;
      
      // Add button event listeners
      const logoutBtn = document.getElementById('logout-btn');
      const startGameBtn = document.getElementById('start-game-btn');
      const soundBtn = document.getElementById('sound-btn');
      const soundIcon = document.getElementById('sound-icon');
      
      if (soundBtn && soundIcon) {
        let isSoundEnabled = localStorage.getItem('soundEnabled') === 'true';
        const iconImg = soundIcon as HTMLImageElement;
        
        if (isSoundEnabled) {
          iconImg.src = '/art/sound-button.svg';
        } else {
          iconImg.src = '/art/sound_button_off.svg';
        }
        
        soundBtn.addEventListener('click', () => {
          if (isSoundEnabled) {
            const oldAudio = document.getElementById('bgMusic');
            if (oldAudio) {
              oldAudio.remove();
            }
            isSoundEnabled = false;
            localStorage.setItem('soundEnabled', 'false');
            iconImg.src = '/art/sound_button_off.svg';
          } else {
            const audio = document.createElement('audio');
            audio.id = 'bgMusic';
            audio.loop = true;
            const source = document.createElement('source');
            source.src = '/music/game_music.mp3';
            source.type = 'audio/mpeg';
            audio.appendChild(source);
            document.body.appendChild(audio);
            audio.play();
            isSoundEnabled = true;
            localStorage.setItem('soundEnabled', 'true');
            iconImg.src = '/art/sound-button.svg';
          }
        });
      }
      
      if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
      }
      
      if (startGameBtn) {
        startGameBtn.addEventListener('click', async () => {
          setGameInProgress(true);
          
          const gameContainer = document.getElementById('app-container');
          if (gameContainer) {
            gameContainer.innerHTML = `
              <div class="h-screen bg-black flex items-center justify-center relative">
                <!-- Sound Button for game -->
                <button id="game-sound-btn" class="absolute top-4 right-4 hover:opacity-80 z-10">
                  <img id="game-sound-icon" src="/art/sound_button_off.svg" alt="Sound" class="h-[40px] w-[40px]" />
                </button>
                
                <!-- Back to Menu Button -->
                <button id="back-to-menu-btn" class="absolute top-4 left-4 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded z-10">
                  Back to Menu
                </button>
                
                <!-- Game Canvas -->
                <canvas id="gameCanvas"></canvas>
                
                <!-- Loading indicator -->
                <div id="game-loading" class="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-50">
                  <div class="text-center">
                    <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                    <p class="text-lg">Loading Game...</p>
                  </div>
                </div>
              </div>
            `;
            
            const backToMenuBtn = document.getElementById('back-to-menu-btn');
            if (backToMenuBtn) {
              backToMenuBtn.addEventListener('click', () => {
                setGameInProgress(false);
                location.reload();
              });
            }
            
            const gameSoundBtn = document.getElementById('game-sound-btn');
            const gameSoundIcon = document.getElementById('game-sound-icon') as HTMLImageElement;
            if (gameSoundBtn && gameSoundIcon) {
              let isGameSoundEnabled = localStorage.getItem('soundEnabled') === 'true';
              
              gameSoundIcon.src = isGameSoundEnabled ? '/art/sound-button.svg' : '/art/sound_button_off.svg';
              
              gameSoundBtn.addEventListener('click', () => {
                if (isGameSoundEnabled) {
                  const oldAudio = document.getElementById('bgMusic');
                  if (oldAudio) {
                    oldAudio.remove();
                  }
                  isGameSoundEnabled = false;
                  localStorage.setItem('soundEnabled', 'false');
                  gameSoundIcon.src = '/art/sound_button_off.svg';
                } else {
                  const audio = document.createElement('audio');
                  audio.id = 'bgMusic';
                  audio.loop = true;
                  const source = document.createElement('source');
                  source.src = '/music/game_music.mp3';
                  source.type = 'audio/mpeg';
                  audio.appendChild(source);
                  document.body.appendChild(audio);
                  audio.play();
                  isGameSoundEnabled = true;
                  localStorage.setItem('soundEnabled', 'true');
                  gameSoundIcon.src = '/art/sound-button.svg';
                }
              });
            }
            
            try {
              const currentAuthState = getAuthState();
              
              const gameLoadSubscription = subscribeToAuth((newState) => {
                if (!newState.isAuthenticated && currentAuthState.isAuthenticated) {
                  console.error('UNEXPECTED LOGOUT DETECTED during game load!');
                  console.error('Previous state:', currentAuthState);
                  console.error('New state:', newState);
                }
              });
              
              const { GameEngine } = await import('./game/gameEngine');
              
              gameLoadSubscription();
              
              const loadingElement = document.getElementById('game-loading');
              if (loadingElement) {
                loadingElement.style.display = 'none';
              }
              
              const authStateAfterLoad = getAuthState();
              
              if (!authStateAfterLoad.isAuthenticated) {
                console.error('User was logged out during game loading! Redirecting...');
                setGameInProgress(false);
                location.reload();
                return;
              }
              
              const game = new GameEngine('gameCanvas');
              game.startGameLoop();
            } catch (error) {
              console.error('Failed to load game:', error);
              
              const gameContainer = document.getElementById('app-container');
              if (gameContainer) {
                gameContainer.innerHTML = `
                  <div class="h-screen bg-red-900 flex items-center justify-center text-white">
                    <div class="text-center">
                      <h1 class="text-3xl font-bold mb-4">Failed to Load Game</h1>
                      <p class="text-lg mb-6">Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
                      <button onclick="location.reload()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Back to Main Menu
                      </button>
                    </div>
                  </div>
                `;
              }
            }
          }
        });
      }
      
      setTimeout(() => {
        cleanupGoogleElements();
      }, 100);
      
      const handleAuthChange = () => {
        if (authState.isAuthenticated) {
          cleanupGoogleElements();
        }
      };
      
      subscribeToAuth(handleAuthChange);
    } else {
      appContainer.innerHTML = '';
      const appOneElement = myJSX(AppOne, { onEnterClick: handleEnterClick });
      appContainer.appendChild(appOneElement);
    }
  };

  const handleEnterClick = () => {
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
      appContainer.innerHTML = '';
      const loadingPageElement = myJSX(LoadingPage, {});
      appContainer.appendChild(loadingPageElement);
      
      const handleAuthSuccess = () => {
        updateView();
        window.removeEventListener('auth-success', handleAuthSuccess);
      };
      window.addEventListener('auth-success', handleAuthSuccess);
      
      let authSuccessReceived = false;
      const fallbackTimeout = setTimeout(() => {
        if (!authSuccessReceived) {
          updateView();
          window.removeEventListener('auth-success', handleAuthSuccess);
        }
      }, 5000);
      
      const originalHandler = handleAuthSuccess;
      const enhancedHandler = () => {
        authSuccessReceived = true;
        clearTimeout(fallbackTimeout);
        originalHandler();
      };
      window.removeEventListener('auth-success', handleAuthSuccess);
      window.addEventListener('auth-success', enhancedHandler);
    }
  };

  setTimeout(() => {
    updateView();
  }, 100);

  return myJSX('div', { id: 'app-container' });
}
