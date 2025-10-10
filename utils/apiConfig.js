// API Configuration
export const API_CONFIG = {
  // Development/Local API URL
  LOCAL_API_URL: 'http://15.207.111.106/api',
  
  // Production API URL (update this with your actual production URL)
  PRODUCTION_API_URL: 'https://your-production-api.com/api',
  
  // Current environment (change this based on your environment)
  ENVIRONMENT: 'development', // 'development' or 'production'
  
  // Get the base URL based on environment
  getBaseURL: () => {
    return API_CONFIG.ENVIRONMENT === 'production' 
      ? API_CONFIG.PRODUCTION_API_URL 
      : API_CONFIG.LOCAL_API_URL;
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 30000,
  
  // Default headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Storage keys
  STORAGE_KEYS: {
    TOKEN: 'delivery_boy_token',
    USER_DATA: 'delivery_boy_user_data',
    REFRESH_TOKEN: 'delivery_boy_refresh_token',
  },
  
  // API Endpoints
  ENDPOINTS: {
    AUTH: {
      REGISTER: '/auth/delivery-boy-register',
      LOGIN: '/auth/delivery-boy-login',
      LOGOUT: '/auth/logout',
      VERIFY_TOKEN: '/auth/verify-firebase-token',
      REFRESH_TOKEN: '/auth/refresh-token',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      UPDATE_PROFILE: '/auth/update-profile',
      PROFILE: '/auth/profile',
      ME: '/auth/me',
    },
    UPLOAD: {
      DOCUMENT: '/upload/document',
      AVATAR: '/upload/avatar',
    },
    DELIVERY: {
      DASHBOARD: '/delivery/dashboard',
      EARNINGS: '/delivery/earnings',
      PROFILE: '/delivery/profile',
      AVAILABILITY: '/delivery/availability',
      DELIVERIES: '/delivery/deliveries',
      HISTORY: '/delivery/history',
      LOCATION: '/delivery/location',
      ISSUES: '/delivery/issues',
    }
  }
};

export default API_CONFIG;
