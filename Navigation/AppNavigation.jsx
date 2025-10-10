import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Camera from '../Screens/Camera';
import Login from '../Screens/Login';
import Maps from '../Screens/Maps';
import Register from '../Screens/Register';
import EditProfile from '../Screens/EditProfile';
import EditAddress from '../Screens/EditAddress';
import Documents from '../Screens/Documents';
import BankDetails from '../Screens/BankDetails';
import LocationPicker from '../Screens/LocationPicker';
import HelpSupport from '../Screens/HelpSupport';
import TermsPrivacy from '../Screens/TermsPrivacy';
import BottomNavigation from './BottomNavigation';
import { authAPI } from '../utils/auth';

// Placeholder screens for missing navigations
const PlaceholderScreen = ({ navigation, route }) => {
  const screenName = route.name;
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
      <Text style={{ fontSize: 18, marginBottom: 16 }}>Coming Soon</Text>
      <Text style={{ fontSize: 14, color: 'gray', marginBottom: 24 }}>{screenName} Screen</Text>
      <TouchableOpacity 
        onPress={() => navigation.goBack()}
        style={{ 
          backgroundColor: '#f0f0f0', 
          padding: 12, 
          borderRadius: 8 
        }}
      >
        <Text>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const Stack = createNativeStackNavigator();

const AppNavigation = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await authAPI.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a custom Login component that can update auth state
  const LoginWithAuth = (props) => (
    <Login {...props} onLoginSuccess={() => setIsAuthenticated(true)} />
  );

  if (isLoading) {
    // You can return a loading screen here
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName={isAuthenticated ? "MainApp" : "Login"}
    >
      {!isAuthenticated ? (
        // Auth Stack
        <>
          <Stack.Screen name="Login" component={LoginWithAuth} />
          <Stack.Screen name="Register" component={Register} />
        </>
      ) : (
        // Main App Stack
        <>
          <Stack.Screen name="MainApp" component={BottomNavigation} />
          <Stack.Screen 
            name="EditProfile" 
            component={EditProfile}
            options={{
              presentation: 'card',
              animation: 'slide_from_right'
            }}
          />
          <Stack.Screen 
            name="Camera" 
            component={Camera}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom'
            }}
          />
          <Stack.Screen 
            name="Maps" 
            component={Maps}
            options={{
              presentation: 'card',
              animation: 'slide_from_right'
            }}
          />
          {/* Profile related screens */}
          <Stack.Screen 
            name="EditAddress" 
            component={EditAddress}
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
              title: 'Edit Address'
            }}
          />
          <Stack.Screen 
            name="Documents" 
            component={Documents}
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
              title: 'Documents'
            }}
          />
          <Stack.Screen 
            name="BankDetails" 
            component={BankDetails}
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
              title: 'Bank Details'
            }}
          />
          <Stack.Screen 
            name="VehicleInfo" 
            component={PlaceholderScreen}
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
              title: 'Vehicle Information'
            }}
          />
          <Stack.Screen 
            name="WorkingHours" 
            component={PlaceholderScreen}
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
              title: 'Working Hours'
            }}
          />
          <Stack.Screen 
            name="Experience" 
            component={PlaceholderScreen}
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
              title: 'Experience'
            }}
          />
          <Stack.Screen 
            name="LocationPicker" 
            component={LocationPicker}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              title: 'Select Location'
            }}
          />
          <Stack.Screen 
            name="HelpSupport" 
            component={HelpSupport}
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
              title: 'Help & Support'
            }}
          />
          <Stack.Screen 
            name="TermsPrivacy" 
            component={TermsPrivacy}
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
              title: 'Terms & Privacy'
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigation;

