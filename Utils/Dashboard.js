import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from './config';

export class DashboardAPI {
  
  // Get authentication token
  static async getAuthToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Create headers with authentication
  static async getHeaders() {
    const token = await this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${authToken}` : '',
    };
  }

  // Get dashboard data
  static async getDashboard() {
    try {
      const headers = await this.getHeaders();
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DASHBOARD}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch dashboard data');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Dashboard API Error:', error);
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  // Update delivery boy availability status
  static async updateAvailability(status) {
    try {
      const headers = await this.getHeaders();
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AVAILABILITY}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status }) // 'online' or 'offline'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update availability');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Availability API Error:', error);
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  // Update order status
  static async updateOrderStatus(orderId, status) {
    try {
      const headers = await this.getHeaders();
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDER_STATUS}/${orderId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update order status');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Order Status API Error:', error);
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  // Report issue with order
  static async reportIssue(orderId, issueType, description = '') {
    try {
      const headers = await this.getHeaders();
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REPORT_ISSUE}/${orderId}/issue`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          issueType,
          description 
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to report issue');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Report Issue API Error:', error);
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  // Get notifications
  static async getNotifications() {
    try {
      const headers = await this.getHeaders();
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch notifications');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Notifications API Error:', error);
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  // Mark notification as read
  static async markNotificationRead(notificationId) {
    try {
      const headers = await this.getHeaders();
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/${notificationId}/read`, {
        method: 'PUT',
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark notification as read');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Mark Notification API Error:', error);
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }
}

// Data transformation utilities
export class DashboardDataTransformer {
  
  // Transform API order data to match frontend format
  static transformOrder(apiOrder) {
    return {
      id: apiOrder._id,
      customerName: apiOrder.customer ? 
        `${apiOrder.customer.firstName} ${apiOrder.customer.lastName}` : 
        'Unknown Customer',
      customerPhone: apiOrder.customer?.phoneNumber || '',
      address: apiOrder.deliveryAddress || apiOrder.vendor?.address || '',
      items: apiOrder.items?.map(item => 
        `${item.quantity}x ${item.name}`
      ) || [],
      amount: `₹${apiOrder.totalAmount || 0}`,
      status: this.mapOrderStatus(apiOrder.status),
      distance: apiOrder.distance || '0 km',
      estimatedTime: apiOrder.estimatedDeliveryTime || '0 mins',
      assignedBy: apiOrder.vendor ? 'vendor' : 'system',
      assignedVendor: apiOrder.vendor?._id || null,
      orderType: apiOrder.vendor ? 'vendor_managed' : 'lalaji_store',
      priority: this.mapOrderPriority(apiOrder.priority),
      vendorName: apiOrder.vendor?.storeName || '',
      vendorPhone: apiOrder.vendor?.phoneNumber || '',
      createdAt: apiOrder.createdAt,
      updatedAt: apiOrder.updatedAt
    };
  }

  // Map API order status to frontend status
  static mapOrderStatus(apiStatus) {
    const statusMap = {
      'assigned': 'assigned',
      'picked_up': 'picked_up', 
      'out_for_delivery': 'out_for_delivery',
      'delivered': 'delivered',
      'cancelled': 'cancelled'
    };
    return statusMap[apiStatus] || 'assigned';
  }

  // Map order priority
  static mapOrderPriority(apiPriority) {
    return apiPriority || 'normal';
  }

  // Transform dashboard stats
  static transformDashboardStats(apiData) {
    return {
      todayStats: {
        totalOrders: apiData.todayStats?.totalOrders || 0,
        completedOrders: apiData.todayStats?.completedOrders || 0,
        earnings: apiData.todayStats?.earnings || 0
      },
      pendingOrders: (apiData.pendingOrders || []).map(order => 
        this.transformOrder(order)
      ),
      currentStatus: apiData.currentStatus || 'offline'
    };
  }
}

export default DashboardAPI;
