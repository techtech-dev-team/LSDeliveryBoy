import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from './apiConfig';

class ApprovalAPI {
  async getAuthHeaders() {
    try {
      const token = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
      
      if (!token) {
        console.warn('ApprovalAPI - No token found in storage');
        return API_CONFIG.DEFAULT_HEADERS;
      }

      const cleanToken = token.trim();
      
      console.log('ApprovalAPI - Token exists:', !!cleanToken);
      console.log('ApprovalAPI - Token preview:', cleanToken.substring(0, 20) + '...');

      return {
        ...API_CONFIG.DEFAULT_HEADERS,
        Authorization: `Bearer ${cleanToken}`,
      };
    } catch (err) {
      console.error('ApprovalAPI - getAuthHeaders error:', err);
      return API_CONFIG.DEFAULT_HEADERS;
    }
  }

  // Get user profile (requires authentication)
  async getProfile() {
    try {
      const token = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
      
      if (!token) {
        console.error('ApprovalAPI.getProfile - No authentication token found');
        return { 
          success: false, 
          error: 'No authentication token found. Please login again.',
          needsLogin: true 
        };
      }

      const headers = await this.getAuthHeaders();
      const url = `${API_CONFIG.getBaseURL()}${API_CONFIG.ENDPOINTS.AUTH.PROFILE}`;
      
      console.log('ApprovalAPI.getProfile - Request URL:', url);
      console.log('ApprovalAPI.getProfile - Headers:', JSON.stringify(headers, null, 2));

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const data = await response.json();
      
      console.log('ApprovalAPI.getProfile - Response status:', response.status);
      console.log('ApprovalAPI.getProfile - Response data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        if (response.status === 401) {
          console.error('ApprovalAPI.getProfile - Unauthorized: Token may be expired or invalid');
          await AsyncStorage.removeItem(API_CONFIG.STORAGE_KEYS.TOKEN);
          return { 
            success: false, 
            error: 'Session expired. Please login again.',
            needsLogin: true,
            statusCode: 401
          };
        }

        console.error('ApprovalAPI.getProfile - HTTP error', response.status, data);
        return { 
          success: false, 
          error: data.error || data.message || `HTTP ${response.status}`,
          statusCode: response.status
        };
      }

      console.log('ApprovalAPI.getProfile - Success');
      return { success: true, data: data.data || data };
    } catch (error) {
      console.error('ApprovalAPI.getProfile error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch profile',
        isNetworkError: error.message.includes('Network') || error.message.includes('fetch')
      };
    }
  }

  // Get all pending approvals (delivery boys awaiting verification)
  async getPendingApprovals() {
    try {
      const token = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
      
      if (!token) {
        return { 
          success: false, 
          error: 'No authentication token found',
          needsLogin: true 
        };
      }

      const headers = await this.getAuthHeaders();
      const url = `${API_CONFIG.getBaseURL()}${API_CONFIG.ENDPOINTS.ADMIN.PENDING_APPROVALS}`;
      
      console.log('ApprovalAPI.getPendingApprovals - Request URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          await AsyncStorage.removeItem(API_CONFIG.STORAGE_KEYS.TOKEN);
          return { 
            success: false, 
            error: 'Session expired. Please login again.',
            needsLogin: true,
            statusCode: 401
          };
        }

        return { 
          success: false, 
          error: data.error || data.message || `HTTP ${response.status}`,
          statusCode: response.status
        };
      }

      return { success: true, data: data.data || data };
    } catch (error) {
      console.error('ApprovalAPI.getPendingApprovals error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch pending approvals'
      };
    }
  }

  // Approve delivery boy
  async approveDeliveryBoy(deliveryBoyId, approvalData = {}) {
    try {
      const token = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
      
      if (!token) {
        return { 
          success: false, 
          error: 'No authentication token found',
          needsLogin: true 
        };
      }

      const headers = await this.getAuthHeaders();
      const url = `${API_CONFIG.getBaseURL()}${API_CONFIG.ENDPOINTS.ADMIN.APPROVE_DELIVERY_BOY}/${deliveryBoyId}`;
      
      console.log('ApprovalAPI.approveDeliveryBoy - Request URL:', url);

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(approvalData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          await AsyncStorage.removeItem(API_CONFIG.STORAGE_KEYS.TOKEN);
          return { 
            success: false, 
            error: 'Session expired. Please login again.',
            needsLogin: true,
            statusCode: 401
          };
        }

        return { 
          success: false, 
          error: data.error || data.message || `HTTP ${response.status}`,
          statusCode: response.status
        };
      }

      return { success: true, data: data.data || data };
    } catch (error) {
      console.error('ApprovalAPI.approveDeliveryBoy error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to approve delivery boy'
      };
    }
  }

  // Reject delivery boy
  async rejectDeliveryBoy(deliveryBoyId, rejectionData = {}) {
    try {
      const token = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
      
      if (!token) {
        return { 
          success: false, 
          error: 'No authentication token found',
          needsLogin: true 
        };
      }

      const headers = await this.getAuthHeaders();
      const url = `${API_CONFIG.getBaseURL()}${API_CONFIG.ENDPOINTS.ADMIN.REJECT_DELIVERY_BOY}/${deliveryBoyId}`;
      
      console.log('ApprovalAPI.rejectDeliveryBoy - Request URL:', url);

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(rejectionData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          await AsyncStorage.removeItem(API_CONFIG.STORAGE_KEYS.TOKEN);
          return { 
            success: false, 
            error: 'Session expired. Please login again.',
            needsLogin: true,
            statusCode: 401
          };
        }

        return { 
          success: false, 
          error: data.error || data.message || `HTTP ${response.status}`,
          statusCode: response.status
        };
      }

      return { success: true, data: data.data || data };
    } catch (error) {
      console.error('ApprovalAPI.rejectDeliveryBoy error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to reject delivery boy'
      };
    }
  }

  // Helper method to check if token is expired (if using JWT)
  isTokenExpired(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      const payload = JSON.parse(atob(parts[1]));
      
      if (payload.exp) {
        const expirationTime = payload.exp * 1000;
        const currentTime = Date.now();
        const isExpired = currentTime >= expirationTime;
        
        if (isExpired) {
          console.warn('ApprovalAPI - Token is expired');
        }
        
        return isExpired;
      }
      
      return false;
    } catch (error) {
      console.error('ApprovalAPI - Error checking token expiration:', error);
      return false;
    }
  }

  // Helper method to validate token before making requests
  async validateToken() {
    const token = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
    
    if (!token) {
      return { valid: false, reason: 'No token found' };
    }

    if (this.isTokenExpired(token)) {
      await AsyncStorage.removeItem(API_CONFIG.STORAGE_KEYS.TOKEN);
      return { valid: false, reason: 'Token expired' };
    }

    return { valid: true };
  }

  // Method to manually set token (useful for testing)
  async setToken(token) {
    try {
      await AsyncStorage.setItem(API_CONFIG.STORAGE_KEYS.TOKEN, token);
      console.log('ApprovalAPI - Token set successfully');
      return true;
    } catch (error) {
      console.error('ApprovalAPI - Error setting token:', error);
      return false;
    }
  }

  // Method to clear token (for logout)
  async clearToken() {
    try {
      await AsyncStorage.removeItem(API_CONFIG.STORAGE_KEYS.TOKEN);
      console.log('ApprovalAPI - Token cleared successfully');
      return true;
    } catch (error) {
      console.error('ApprovalAPI - Error clearing token:', error);
      return false;
    }
  }
}

export const approvalAPI = new ApprovalAPI();
export default approvalAPI;