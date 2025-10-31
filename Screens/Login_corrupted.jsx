import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  StatusBar,
  StyleSheet,
              console.log('✅ Login - User is approved, proceeding with normal login');

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
            console.error('Failed to fetch complete profile after login:', profileResponse.error);
            // If profile fetch fails, treat as approved user for now
            Alert.alert(
              'Success', 
              result.message || 'Login successful!', 
              [
                { 
                  text: 'OK', 
                  onPress: () => {
                    if (onLoginSuccess) {
                      onLoginSuccess();
                    }
                  }
                }
              ]
            );
          }
        } catch (profileError) {
          console.error('Error fetching profile after login:', profileError);
          // If profile fetch fails, treat as approved user for now
          Alert.alert(
            'Success', 
            result.message || 'Login successful!', 
            [
              { 
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { colors, typography } from '../components/colors';
import { authAPI } from '../utils/auth';
import { approvalAPI } from '../utils/approval';

const Login = ({ navigation, route, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // helper to normalize prefill phone numbers
  const prefillingNormalizer = (val) => {
    if (!val) return '';
    const onlyDigits = val.replace(/[^0-9]/g, '');
    return onlyDigits.length > 10 ? onlyDigits.slice(-10) : onlyDigits;
  };

  useEffect(() => {
    const prefill = route?.params?.prefillPhone;
    if (prefill && prefill.length > 0) {
      // strip country code if provided
      const cleaned = prefill.startsWith('+91') ? prefillingNormalizer(prefill) : prefillingNormalizer(prefill);
      setFormData(prev => ({ ...prev, phoneNumber: cleaned }));
    }
  }, [route?.params?.prefillPhone]);

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
        // After successful login, fetch the complete profile to get verification status
        console.log('🔍 Login - Login successful, fetching complete profile...');
        
        try {
          const profileResponse = await approvalAPI.getProfile();
          
          if (profileResponse.success) {
            const account = profileResponse.data;
            console.log('🔍 Login - Complete profile data:', JSON.stringify(account, null, 2));
            console.log('🔍 Login - Verification status:', account.deliveryBoyInfo?.verificationStatus);

            const accountIsPending = (user) => {
          if (!user) return false;
          
          // Check for verification status first (most reliable)
          const verificationStatus = user.deliveryBoyInfo?.verificationStatus;
          if (verificationStatus) {
            return verificationStatus === 'pending';
          }
          
          // Fallback to other status fields
          const statusValues = [
            user.status,
            user.accountStatus,
            user.approvalStatus,
            user.deliveryBoyInfo?.approvalStatus,
          ];
          
          // common boolean flags
          const boolFlags = [
            user.isApproved === false,
            user.isActive === false,
            user.isApprovedByAdmin === false
          ];

          if (statusValues.some(s => typeof s === 'string' && s.toLowerCase() === 'pending')) return true;
          if (boolFlags.some(v => v === true)) return true;
          return false;
        };

        const accountIsRejected = (user) => {
          if (!user) return false;
          
          // Check for verification status first
          const verificationStatus = user.deliveryBoyInfo?.verificationStatus;
          if (verificationStatus) {
            return verificationStatus === 'rejected';
          }
          
          // Fallback to other rejection indicators
          const statusValues = [
            user.status,
            user.accountStatus,
            user.approvalStatus,
            user.deliveryBoyInfo?.approvalStatus,
          ];

          return statusValues.some(s => typeof s === 'string' && s.toLowerCase() === 'rejected');
        };

        // Check for rejected status first
        if (accountIsRejected(account)) {
          const rejectionReason = account.deliveryBoyInfo?.verificationNotes || 'Account verification failed';
          console.log('🔴 Login - User is rejected, navigating to RejectedAccount');
          navigation.navigate('RejectedAccount', { 
            user: account,
            rejectionReason 
          });
          setLoading(false);
          return;
        }

        // Then check for pending status
        if (accountIsPending(account)) {
          console.log('🟡 Login - User is pending, navigating to PendingApproval');
          navigation.navigate('PendingApproval', { user: account });
          setLoading(false);
          return;
        }

        console.log('✅ Login - User is approved, proceeding with normal login');

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
            console.error('Failed to fetch complete profile after login:', profileResponse.error);
            // If profile fetch fails, treat as approved user for now
            Alert.alert(
              'Success', 
              result.message || 'Login successful!', 
              [
                { 
                  text: 'OK', 
                  onPress: () => {
                    if (onLoginSuccess) {
                      onLoginSuccess();
                    }
                  }
                }
              ]
            );
          }
        } catch (profileError) {
          console.error('Error fetching profile after login:', profileError);
          // If profile fetch fails, treat as approved user for now
          Alert.alert(
            'Success', 
            result.message || 'Login successful!', 
            [
              { 
                text: 'OK', 
                onPress: () => {
                  if (onLoginSuccess) {
                    onLoginSuccess();
                  }
                }
              }
            ]
          );
        }
      } else {
        // Handle API error response
        let errorMessage = result.error || result.message || 'Login failed';

        // If the backend returns a pending/approval message as an error, navigate to appropriate screen
        const messageIndicatesPending = (msg) => {
          if (!msg || typeof msg !== 'string') return false;
          const lower = msg.toLowerCase();
          return (
            lower.includes('pending') ||
            lower.includes('approval') ||
            lower.includes('awaiting') ||
            lower.includes('not approved') ||
            lower.includes('verify')
          );
        };

        const messageIndicatesRejected = (msg) => {
          if (!msg || typeof msg !== 'string') return false;
          const lower = msg.toLowerCase();
          return (
            lower.includes('rejected') ||
            lower.includes('suspended') ||
            lower.includes('banned') ||
            lower.includes('declined')
          );
        };

        if (messageIndicatesRejected(errorMessage)) {
          navigation.navigate('RejectedAccount', { 
            user: { phoneNumber: formData.phoneNumber }, 
            rejectionReason: errorMessage 
          });
          setLoading(false);
          return;
        }

        if (messageIndicatesPending(errorMessage)) {
          navigation.navigate('PendingApproval', { user: { phoneNumber: formData.phoneNumber, message: errorMessage } });
          setLoading(false);
          return;
        }

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
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['4xl'],
    color: colors.neutrals.dark,
    marginBottom: 8,
    letterSpacing: typography.letterSpacing.tight,
  },
  welcomeSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.lg,
    color: colors.neutrals.gray,
  },
  formContainer: {
    marginBottom: 40,
  },
  inputSection: {
    marginBottom: 24,
  },
  textInput: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.neutrals.dark,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  passwordInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.neutrals.dark,
    paddingVertical: 16,
    paddingHorizontal: 4,
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
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.neutrals.gray,
  },
  loginButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    
  },
  loginButtonDisabled: {
    backgroundColor: '#999',
    opacity: 0.7,
  },
  loginButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: 'white',
    letterSpacing: typography.letterSpacing.normal,
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
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base,
    color: colors.neutrals.gray,
    textDecorationLine: 'underline',
  },
});

export default Login;
