import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from './config';

export class RegisterAPI {
  
  // Register delivery boy with optional Firebase token
  static async registerDeliveryBoy(formData, firebaseToken = null, verificationMethod = 'otp') {
    try {
      const registrationData = {
        name: formData.fullName,
        phoneNumber: formData.phoneNumber,
        email: formData.email || null,
        avatar: null, // Can be added later
        deliveryBoyInfo: {
          personalInfo: {
            fullName: formData.fullName,
            email: formData.email || '',
            mobileNumber: formData.phoneNumber,
            address: formData.address,
            emergencyContact: formData.emergencyContact,
          },
          identification: {
            panNumber: formData.panNumber || '',
            aadharNumber: formData.aadharNumber || '',
          },
          experience: {
            years: parseInt(formData.experienceYears) || 0,
            description: formData.experienceDescription || '',
          },
          vehicleInfo: {
            type: this.mapVehicleType(formData.selectedVehicle),
            vehicleNumber: formData.vehicleNumber,
            registrationDocument: formData.vehicleDocumentUploaded || false,
          },
          bankDetails: {
            accountNumber: formData.accountNumber || '',
            ifsc: formData.ifsc || '',
            upiId: formData.upiId || '',
            accountHolderName: formData.accountHolderName || formData.fullName,
          },
          documents: {
            idProof: formData.idProofUploaded || false,
            addressProof: formData.addressProofUploaded || false,
            vehicleDocument: formData.vehicleDocumentUploaded || false,
          }
        }
      };

      // Set auth method based on verification method
      registrationData.authMethod = verificationMethod;

      // Add Firebase token only for OTP verification
      if (verificationMethod === 'otp' && firebaseToken) {
        registrationData.firebaseToken = firebaseToken;
      }

      // Add password for password verification
      if (verificationMethod === 'password' && formData.verificationPassword) {
        registrationData.password = formData.verificationPassword;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/delivery-boy-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store auth token if provided
      if (data.token) {
        await AsyncStorage.setItem('authToken', data.token);
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Registration successful'
      };
    } catch (error) {
      console.error('Registration API Error:', error);
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  // Firebase phone verification (to be implemented with Firebase Auth)
  static async verifyPhoneWithFirebase(phoneNumber) {
    try {
      // This will be implemented with Firebase Auth SDK
      // For now, returning a mock response
      return {
        success: true,
        message: 'Phone verification initiated with Firebase'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Firebase verification error'
      };
    }
  }

  // Upload document
  static async uploadDocument(documentData, documentType) {
    try {
      const formData = new FormData();
      formData.append('document', {
        uri: documentData.uri,
        type: documentData.type || 'image/jpeg',
        name: documentData.fileName || `${documentType}.jpg`,
      });
      formData.append('documentType', documentType);

      const response = await fetch(`${API_CONFIG.BASE_URL}/delivery/upload-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Document upload failed');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Document uploaded successfully'
      };
    } catch (error) {
      console.error('Document Upload API Error:', error);
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  // Check registration status
  static async checkRegistrationStatus(phoneNumber) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/registration-status?phoneNumber=${phoneNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to check registration status');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Registration Status API Error:', error);
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }

  // Helper method to map vehicle types
  static mapVehicleType(frontendType) {
    const typeMap = {
      'Bike': 'motorcycle',
      'Car': 'car',
      'Auto': 'scooter',
      'Bicycle': 'bicycle'
    };
    return typeMap[frontendType] || 'motorcycle';
  }
}

export default RegisterAPI;
