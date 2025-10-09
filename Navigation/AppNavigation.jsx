import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import Camera from '../Screens/Camera';
import Login from '../Screens/Login';
import Maps from '../Screens/Maps';
import Register from '../Screens/Register';
import BottomNavigation from './BottomNavigation';

const Stack = createNativeStackNavigator();

const AppNavigation = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
          <Stack.Screen name="Login" component={Login} />
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

