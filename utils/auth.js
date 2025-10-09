import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from './apiConfig';
import { retryAPICall } from './errorHandler';

// Auth utility functions
export const authAPI = {
  // Register delivery boy
  registerDeliveryBoy: async (userData) => {
    try {
      console.log('Registering delivery boy:', userData);
      
      const apiCall = async () => {
        const response = await fetch(`${API_CONFIG.getBaseURL()}${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`, {
          method: 'POST',
          headers: {
            ...API_CONFIG.DEFAULT_HEADERS,
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          const error = new Error(errorData.error || errorData.message || 'Registration failed');
          error.details = errorData.details || [];
          error.status = response.status;
          throw error;
        }

        const data = await response.json();
        return data;
      };

      // Retry API call up to 3 times
      const data = await retryAPICall(apiCall, 3, 1000);

      // Store token and user data if registration is successful
      if (data.success && data.token) {
        await AsyncStorage.setItem(API_CONFIG.STORAGE_KEYS.TOKEN, data.token);
        if (data.data) {
          await AsyncStorage.setItem(API_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(data.data));
        }
      }

      return {
        success: true,
        data: data.data,
        token: data.token,
        message: data.message || 'Registration successful'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed',
        details: error.details || [],
        status: error.status || 500
      };
    }
  },

  // Login delivery boy
  loginDeliveryBoy: async (phoneNumber, password = null, firebaseToken = null) => {
    try {
      // Format phone number with country code if not already present
      const formattedPhoneNumber = phoneNumber.startsWith('+') 
        ? phoneNumber 
        : `+91${phoneNumber}`;

      const loginData = {
        phoneNumber: formattedPhoneNumber,
        role: 'delivery_boy'
      };

      // Add authentication method
      if (password) {
        loginData.password = password;
        loginData.authMethod = 'password';
      } else if (firebaseToken) {
        loginData.firebaseToken = firebaseToken;
        loginData.authMethod = 'otp';
      } else {
        throw new Error('Either password or Firebase token is required');
      }

      const apiCall = async () => {
        const response = await fetch(`${API_CONFIG.getBaseURL()}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, {
          method: 'POST',
          headers: {
            ...API_CONFIG.DEFAULT_HEADERS,
          },
          body: JSON.stringify(loginData),
        });

        const data = await response.json();
        
        if (!response.ok) {
          const error = new Error(data.error || data.message || 'Login failed');
          error.details = data.details || [];
          throw error;
        }

        return data;
      };

      const data = await retryAPICall(apiCall, 3, 1000);

      // Store token and user data if login is successful
      if (data.success && data.token) {
        await AsyncStorage.setItem(API_CONFIG.STORAGE_KEYS.TOKEN, data.token);
        if (data.data) {
          await AsyncStorage.setItem(API_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(data.data));
        }
      }

      return {
        success: true,
        data: data.data,
        token: data.token,
        message: data.message || 'Login successful'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed',
        details: error.details || []
      };
    }
  },

  // Logout
  logout: async () => {
    try {
      await AsyncStorage.removeItem(API_CONFIG.STORAGE_KEYS.TOKEN);
      await AsyncStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER_DATA);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get stored token
  getToken: async () => {
    try {
      const token = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.TOKEN);
      return token;
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  },

  // Get stored user data
  getUserData: async () => {
    try {
      const userData = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get user data error:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      const token = await authAPI.getToken();
      const userData = await authAPI.getUserData();
      return !!(token && userData);
    } catch (error) {
      console.error('Check auth error:', error);
      return false;
    }
  },

  // Verify Firebase token (for OTP authentication)
  verifyFirebaseToken: async (firebaseToken, phoneNumber) => {
    try {
      const response = await fetch(`${API_CONFIG.getBaseURL()}${API_CONFIG.ENDPOINTS.AUTH.VERIFY_TOKEN}`, {
        method: 'POST',
        headers: {
          ...API_CONFIG.DEFAULT_HEADERS,
        },
        body: JSON.stringify({
          firebaseToken,
          phoneNumber
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        const error = new Error(data.error || data.message || 'Token verification failed');
        error.details = data.details || [];
        throw error;
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Token verified successfully'
      };
    } catch (error) {
      console.error('Firebase token verification error:', error);
      return {
        success: false,
        error: error.message || 'Token verification failed',
        details: error.details || []
      };
    }
  },

  // Update profile
  updateProfile: async (updateData) => {
    try {
      const token = await authAPI.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_CONFIG.getBaseURL()}${API_CONFIG.ENDPOINTS.AUTH.UPDATE_PROFILE}`, {
        method: 'PUT',
        headers: {
          ...API_CONFIG.DEFAULT_HEADERS,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        const error = new Error(data.error || data.message || 'Profile update failed');
        error.details = data.details || [];
        throw error;
      }

      // Update stored user data
      if (data.success && data.data) {
        await AsyncStorage.setItem(API_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(data.data));
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: error.message || 'Profile update failed',
        details: error.details || []
      };
    }
  },

  // Upload document/image
  uploadDocument: async (fileUri, documentType) => {
    try {
      const token = await authAPI.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      formData.append('document', {
        uri: fileUri,
        type: 'image/jpeg',
        name: `${documentType}_${Date.now()}.jpg`,
      });
      formData.append('documentType', documentType);

      const response = await fetch(`${API_CONFIG.getBaseURL()}${API_CONFIG.ENDPOINTS.UPLOAD.DOCUMENT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        const error = new Error(data.error || data.message || 'Document upload failed');
        error.details = data.details || [];
        throw error;
      }

      return {
        success: true,
        data: data.data,
        url: data.url,
        message: data.message || 'Document uploaded successfully'
      };
    } catch (error) {
      console.error('Document upload error:', error);
      return {
        success: false,
        error: error.message || 'Document upload failed',
        details: error.details || []
      };
    }
  }
};

// Helper function to clean data - removes null, undefined, empty strings
const cleanData = (obj) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'object' && !Array.isArray(value)) {
        const cleanedNested = cleanData(value);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else if (Array.isArray(value) && value.length > 0) {
        cleaned[key] = value;
      } else if (typeof value === 'string' && value.trim() !== '') {
        cleaned[key] = value.trim();
      } else if (typeof value !== 'string') {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
};

// Helper function to format registration data
export const formatRegistrationData = (formData) => {
  const baseData = {
    name: formData.fullName,
    phoneNumber: formData.phoneNumber,
    password: formData.verificationPassword || null,
    authMethod: formData.verificationPassword ? 'password' : 'otp',
    firebaseToken: formData.firebaseToken || (formData.verificationPassword ? null : `mock_firebase_token_${formData.phoneNumber}_${Date.now()}`),
    deliveryBoyInfo: {
      personalInfo: {
        fullName: formData.fullName,
        mobileNumber: formData.phoneNumber,
        address: formData.address,
        emergencyContact: {
          mobileNumber: formData.emergencyContact
        }
      },
      documents: formData.idProofImage ? [formData.idProofImage] : [],
      identification: {
        panNumber: formData.panNumber || null
      },
      experience: {
        years: parseInt(formData.experienceYears) || 0
      },
      vehicleInfo: {
        type: formData.selectedVehicle?.toLowerCase() || 'motorcycle',
        vehicleNumber: formData.vehicleNumber
      },
      bankDetails: {},
      deliveryPartner: formData.deliveryPartner || 'lalaji_network',
      isAvailable: false,
      workingHours: {
        start: "09:00",
        end: "18:00"
      },
      serviceAreas: []
    }
  };

  // Add email only if provided and valid
  if (formData.email && formData.email.trim() !== '') {
    baseData.email = formData.email.trim();
    baseData.deliveryBoyInfo.personalInfo.email = formData.email.trim();
  }

  // Add bank details only if provided
  if (formData.accountNumber && formData.accountNumber.trim() !== '') {
    baseData.deliveryBoyInfo.bankDetails.accountNumber = formData.accountNumber.trim();
  }
  if (formData.accountHolderName && formData.accountHolderName.trim() !== '') {
    baseData.deliveryBoyInfo.bankDetails.accountHolderName = formData.accountHolderName.trim();
  }
  if (formData.ifsc && formData.ifsc.trim() !== '') {
    baseData.deliveryBoyInfo.bankDetails.ifsc = formData.ifsc.trim();
  }
  if (formData.upiId && formData.upiId.trim() !== '') {
    baseData.deliveryBoyInfo.bankDetails.upiId = formData.upiId.trim();
  }

  // Clean the data to remove any empty/null values
  return cleanData(baseData);
};

// Helper function to format login data
export const formatLoginData = (phoneNumber, password) => {
  return {
    phoneNumber,
    password,
    role: 'delivery_boy'
  };
};

export default authAPI;
