import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useState, useEffect } from 'react';
import Camera from '../Screens/Camera';
import Login from '../Screens/Login';
import Maps from '../Screens/Maps';
import Register from '../Screens/Register';
import BottomNavigation from './BottomNavigation';
import { authAPI } from '../utils/auth';

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
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigation;

