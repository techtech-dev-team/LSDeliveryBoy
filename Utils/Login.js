import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './config';

export class LoginAPI {
  static async loginWithPassword(phoneNumber, password, role = 'deliveryBoy') {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          password,
          authMethod: 'password',
          role
        }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Store authentication data
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        await AsyncStorage.setItem('userRole', role);
        
        return {
          success: true,
          user: data.user,
          token: data.token
        };
      } else {
        return {
          success: false,
          error: data.error || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.'
      };
    }
  }

  static async loginWithOTP(phoneNumber, firebaseToken, role = 'deliveryBoy') {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          firebaseToken,
          authMethod: 'otp',
          role
        }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Store authentication data
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        await AsyncStorage.setItem('userRole', role);
        
        return {
          success: true,
          user: data.user,
          token: data.token
        };
      } else {
        return {
          success: false,
          error: data.error || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.'
      };
    }
  }

  static async logout() {
    try {
      // Clear all stored authentication data
      await AsyncStorage.multiRemove([
        'userToken',
        'userData',
        'userRole'
      ]);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: 'Failed to logout'
      };
    }
  }

  static async checkAuthStatus() {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      const userRole = await AsyncStorage.getItem('userRole');

      if (token && userData) {
        return {
          success: true,
          isAuthenticated: true,
          token,
          user: JSON.parse(userData),
          role: userRole
        };
      } else {
        return {
          success: true,
          isAuthenticated: false
        };
      }
    } catch (error) {
      console.error('Auth check error:', error);
      return {
        success: false,
        error: 'Failed to check authentication status'
      };
    }
  }

  static async validateToken() {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        return {
          success: false,
          error: 'No token found'
        };
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/validate-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          valid: true,
          user: data.user
        };
      } else {
        // Token is invalid, clear stored data
        await this.logout();
        return {
          success: false,
          valid: false,
          error: 'Token is invalid'
        };
      }
    } catch (error) {
      console.error('Token validation error:', error);
      return {
        success: false,
        error: 'Failed to validate token'
      };
    }
  }

  static async forgotPassword(phoneNumber, role = 'deliveryBoy') {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          role
        }),
      });

      const data = await response.json();

      return {
        success: data.success,
        error: data.error || null,
        message: data.message || 'Password reset instructions sent'
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.'
      };
    }
  }

  static async resetPassword(phoneNumber, newPassword, otp, role = 'deliveryBoy') {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          newPassword,
          otp,
          role
        }),
      });

      const data = await response.json();

      return {
        success: data.success,
        error: data.error || null,
        message: data.message || 'Password reset successfully'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.'
      };
    }
  }
}

// Utility functions
export const AuthUtils = {
  formatPhoneNumber: (phoneNumber) => {
    // Remove any non-numeric characters and ensure +91 prefix
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.startsWith('91') && cleanNumber.length === 12) {
      return `+${cleanNumber}`;
    } else if (cleanNumber.length === 10) {
      return `+91${cleanNumber}`;
    } else {
      return phoneNumber; // Return as is if format is unclear
    }
  },

  validatePhoneNumber: (phoneNumber) => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    return cleanNumber.length === 10 || (cleanNumber.startsWith('91') && cleanNumber.length === 12);
  },

  validatePassword: (password) => {
    // Basic password validation
    return password && password.length >= 6;
  }
};
