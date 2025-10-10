import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './apiConfig';

class DashboardAPI {
  constructor() {
    this.baseURL = API_CONFIG.getBaseURL();
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // Helper method to get auth headers
  async getAuthHeaders() {
    try {
      const token = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
      return {
        ...API_CONFIG.DEFAULT_HEADERS,
        'Authorization': token ? `Bearer ${token}` : '',
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return API_CONFIG.DEFAULT_HEADERS;
    }
  }

  // Helper method to make API requests
  async makeRequest(endpoint, options = {}) {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${this.baseURL}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        timeout: this.timeout,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Request Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get delivery boy dashboard data
  async getDashboard() {
    try {
      const response = await this.makeRequest('/delivery/dashboard');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      return {
        success: false,
        error: error.message,
        data: {
          todayStats: {
            totalOrders: 0,
            completedOrders: 0,
            earnings: 0
          },
          pendingOrders: [],
          currentStatus: 'offline'
        }
      };
    }
  }

  // Update availability status
  async updateAvailability(status, location = null) {
    try {
      const body = { status };
      if (location) {
        body.location = location;
      }

      const response = await this.makeRequest('/delivery/availability', {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      console.log(`✅ Availability updated to ${status}:`, response.data);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error updating availability:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Update current location
  async updateLocation(latitude, longitude, address) {
    try {
      const response = await this.makeRequest('/delivery/location', {
        method: 'PUT',
        body: JSON.stringify({
          latitude,
          longitude,
          address,
        }),
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error updating location:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get assigned deliveries
  async getAssignedDeliveries(page = 1, limit = 10) {
    try {
      const response = await this.makeRequest(`/delivery/deliveries?page=${page}&limit=${limit}`);
      console.log('✅ Fetched assigned deliveries:', response.data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error fetching assigned deliveries:', error);
      return {
        success: false,
        error: error.message,
        data: {
          orders: [],
          pagination: {
            current: 1,
            pages: 1,
            total: 0
          }
        }
      };
    }
  }

  // Update delivery status
  async updateDeliveryStatus(orderId, status) {
    try {
      const response = await this.makeRequest(`/delivery/deliveries/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error updating delivery status:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Mark order as picked up
  async markPickedUp(orderId) {
    try {
      const response = await this.makeRequest(`/delivery/deliveries/${orderId}/picked-up`, {
        method: 'PUT',
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error marking order as picked up:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Mark order as delivered
  async markDelivered(orderId, deliveryNotes = '', customerRating = null) {
    try {
      const body = { deliveryNotes };
      if (customerRating) {
        body.customerRating = customerRating;
      }

      const response = await this.makeRequest(`/delivery/deliveries/${orderId}/delivered`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error marking order as delivered:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Report delivery issue
  async reportIssue(orderId, issue, description = '', images = []) {
    try {
      const response = await this.makeRequest(`/delivery/issues/${orderId}`, {
        method: 'POST',
        body: JSON.stringify({
          issue,
          description,
          images,
        }),
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error reporting issue:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get delivery history
  async getDeliveryHistory(page = 1, limit = 10, startDate = null, endDate = null) {
    try {
      let endpoint = `/delivery/history?page=${page}&limit=${limit}`;
      
      if (startDate && endDate) {
        endpoint += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await this.makeRequest(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error fetching delivery history:', error);
      return {
        success: false,
        error: error.message,
        data: {
          orders: [],
          pagination: {
            current: 1,
            pages: 1,
            total: 0
          },
          earnings: 0
        }
      };
    }
  }

  // Get earnings
  async getEarnings(period = 'week') {
    try {
      const response = await this.makeRequest(`/delivery/earnings?period=${period}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error fetching earnings:', error);
      return {
        success: false,
        error: error.message,
        data: {
          totalEarnings: 0,
          totalOrders: 0,
          avgEarningsPerOrder: 0,
          earningsByDate: {}
        }
      };
    }
  }

  // Get delivery boy profile
  async getProfile() {
    try {
      console.log('🔄 getProfile - Fetching from /delivery/profile');
      const response = await this.makeRequest('/delivery/profile');
      console.log('✅ getProfile - Success:', response);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('❌ getProfile - Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get notifications
  async getNotifications(page = 1, limit = 10) {
    try {
      const response = await this.makeRequest(`/delivery/notifications?page=${page}&limit=${limit}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return {
        success: false,
        error: error.message,
        data: {
          notifications: [],
          unreadCount: 0
        }
      };
    }
  }

  // Mark notification as read
  async markNotificationRead(notificationId) {
    try {
      const response = await this.makeRequest(`/delivery/notifications/${notificationId}/read`, {
        method: 'PUT',
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Update delivery boy profile
  async updateProfile(profileData) {
    try {
      console.log('🔄 updateProfile - Sending data to /delivery/profile:', JSON.stringify(profileData, null, 2));
      
      const response = await this.makeRequest('/delivery/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      console.log('✅ updateProfile - Success:', response);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('❌ updateProfile - Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Export singleton instance
export const dashboardAPI = new DashboardAPI();
export default dashboardAPI;
