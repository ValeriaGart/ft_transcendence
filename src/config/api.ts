
// Detect if we're using SSL based on the current page protocol
const isSSL = typeof window !== 'undefined' && window.location.protocol === 'https:';
const wsProtocol = isSSL ? 'wss:' : 'ws:';

// Determine WebSocket URL based on environment
const getDefaultWsUrl = () => {
  // Use the same host as the current page (nginx proxy)
  // This connects to wss://hostname/hello-ws through the nginx proxy
  const baseUrl = typeof window !== 'undefined' 
    ? `${wsProtocol}//${window.location.host}` 
    : `${wsProtocol}//localhost`;
  
  console.log('Using secure WebSocket URL via nginx proxy:', baseUrl);
  return baseUrl;
};

const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  WS_BASE_URL: import.meta.env.VITE_WS_BASE_URL || getDefaultWsUrl(),
  
  ENDPOINTS: {
    GOOGLE_SIGNUP: '/auth/google/signup',
    GOOGLE_SIGNIN: '/auth/google/signin',
    REGISTER: '/auth/register', 
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    VERIFY: '/auth/verify',
    ME: '/auth/me',
    
    // Users
    USERS: '/users',
    
    // Matches
    MATCHES: '/match',
    MATCH_HISTORY: '/match/me',
    MATCH_STATS: '/match/wl'
  }
};

export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}

export function getWebSocketUrl(endpoint: string): string {
  return `${API_CONFIG.WS_BASE_URL}${endpoint}`;
}

export function getApiBaseUrl(): string {
  return API_CONFIG.BASE_URL;
}

export { API_CONFIG };
