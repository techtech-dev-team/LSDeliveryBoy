// API Configuration
export const API_CONFIG = {
  // Production API URL
  BASE_URL: 'http://15.207.111.106/api',
  
  ENDPOINTS: {
    DASHBOARD: '/delivery/dashboard',
    AVAILABILITY: '/delivery/availability',
    ORDER_STATUS: '/delivery/order',
    NOTIFICATIONS: '/delivery/notifications',
    REPORT_ISSUE: '/delivery/order'
  },
  
  TIMEOUT: 10000, // 10 seconds
};

export default API_CONFIG;