import React, { useState } from 'react';
import BottomNavigation from './BottomNavigation';
import Camera from '../Screens/Camera';
import Login from '../Screens/Login';
import Maps from '../Screens/Maps';
import Register from '../Screens/Register';

const AppNavigation = () => {
  const [currentScreen, setCurrentScreen] = useState('Login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Navigation function to switch between screens
  const navigateTo = (screenName, params = {}) => {
    setCurrentScreen(screenName);
  };

  // Authentication function
  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentScreen('MainApp');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentScreen('Login');
  };

  // Function to go back to main app from other screens
  const goBackToMain = () => {
    if (isAuthenticated) {
      setCurrentScreen('MainApp');
    } else {
      setCurrentScreen('Login');
    }
  };

  // Render the current screen based on state
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'Login':
        return (
          <Login 
            onLogin={handleLogin}
            onNavigateToRegister={() => navigateTo('Register')}
          />
        );
      
      case 'Register':
        return (
          <Register 
            onRegisterSuccess={handleLogin}
            onNavigateToLogin={() => navigateTo('Login')}
          />
        );
      
      case 'MainApp':
        return (
          <BottomNavigation 
            onNavigateToCamera={() => navigateTo('Camera')}
            onNavigateToMaps={() => navigateTo('Maps')}
            onLogout={handleLogout}
          />
        );
      
      case 'Camera':
        return (
          <Camera 
            onGoBack={goBackToMain}
          />
        );
      
      case 'Maps':
        return (
          <Maps 
            onGoBack={goBackToMain}
          />
        );
      
      default:
        return (
          <Login 
            onLogin={handleLogin}
            onNavigateToRegister={() => navigateTo('Register')}
          />
        );
    }
  };

  return renderCurrentScreen();
};

export default AppNavigation;
