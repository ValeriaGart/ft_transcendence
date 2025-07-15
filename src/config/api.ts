
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  
  ENDPOINTS: {
    GOOGLE_SIGNUP: '/auth/google/signup',
    GOOGLE_SIGNIN: '/auth/google/signin',
    REGISTER: '/auth/register', 
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    VERIFY: '/auth/verify',
    ME: '/auth/me',
    
    // Users
    USERS: '/users'
  }
};

export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}

export function getApiBaseUrl(): string {
  return API_CONFIG.BASE_URL;
}

export { API_CONFIG };
