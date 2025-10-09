import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { authAPI, formatLoginData } from '../utils/auth';

const Login = ({ navigation, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogin = async () => {
    if (!formData.phoneNumber.trim() || formData.phoneNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    if (!formData.password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }
    
    setLoading(true);
    
    try {
      // Call the login API
      const result = await authAPI.loginDeliveryBoy(
        formData.phoneNumber, 
        formData.password
      );
      
      if (result.success) {
        Alert.alert(
          'Success', 
          result.message || 'Login successful!', 
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Call the callback to update authentication state
                if (onLoginSuccess) {
                  onLoginSuccess();
                }
              }
            }
          ]
        );
      } else {
        // Handle API error response
        let errorMessage = result.error || 'Login failed';
        
        // If there are validation details, show them
        if (result.details && result.details.length > 0) {
          const fieldErrors = result.details.map(detail => 
            `${detail.field}: ${detail.message}`
          ).join('\n');
          errorMessage = `${errorMessage}\n\n${fieldErrors}`;
        }
        
        Alert.alert('Login Failed', errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Error', 
        'An unexpected error occurred during login. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset link will be sent to your registered phone number');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.welcomeTitle}>Welcome</Text>
          <Text style={styles.welcomeSubtitle}>Sign in to continue</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          {/* Phone Number Input */}
          <View style={styles.inputSection}>
            <TextInput
              style={styles.textInput}
              value={formData.phoneNumber}
              onChangeText={(text) => handleInputChange('phoneNumber', text.replace(/[^0-9]/g, ''))}
              placeholder="Phone Number"
              placeholderTextColor="#A0A0A0"
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputSection}>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                placeholder="Password"
                placeholderTextColor="#A0A0A0"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={22} 
                  color="#A0A0A0" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordButton}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Section */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleRegister} style={styles.registerButton}>
            <Text style={styles.registerText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 80,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
  },
  formContainer: {
    marginBottom: 40,
  },
  inputSection: {
    marginBottom: 24,
  },
  textInput: {
    fontSize: 16,
    color: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 16,
    paddingHorizontal: 4,
    fontWeight: '400',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 16,
    paddingHorizontal: 4,
    fontWeight: '400',
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 16,
    marginBottom: 40,
  },
  forgotText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  loginButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#999',
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  registerButton: {
    paddingVertical: 12,
  },
  registerText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#666',
    textDecorationLine: 'underline',
  },
});

export default Login;
