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

const Login = ({ navigation }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogin = () => {
    if (!formData.username.trim()) {
      Alert.alert('Error', 'Please enter your username');
      return;
    }
    if (!formData.password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }
    
    // Simulate login process
    Alert.alert('Success', 'Login successful!', [
      { text: 'OK', onPress: () => navigation.navigate('MainApp') }
    ]);
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
          {/* Username Input */}
          <View style={styles.inputSection}>
            <TextInput
              style={styles.textInput}
              value={formData.username}
              onChangeText={(text) => handleInputChange('username', text)}
              placeholder="Username"
              placeholderTextColor="#A0A0A0"
              autoCapitalize="none"
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
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Sign In</Text>
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
