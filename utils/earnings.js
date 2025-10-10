import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './apiConfig';

class EarningsAPI {
  constructor() {
    this.baseURL = API_CONFIG.getBaseURL();
    this.timeout = API_CONFIG.TIMEOUT;
  }

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
      if (!response.ok) throw new Error(data.message || `HTTP error! status: ${response.status}`);
      return data;
    } catch (error) {
      console.error(`API Request Error for ${endpoint}:`, error);
      throw error;
    }
  }

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
          earningsByDate: {},
        },
      };
    }
  }
}

export const earningsAPI = new EarningsAPI();
export default earningsAPI;