import './global.css';
import { NavigationContainer } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import AppNavigation from './Navigation/AppNavigation';
import { loadFonts } from './utils/fonts';
import { colors } from './components/colors';

const App = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const prepareFonts = async () => {
      try {
        await loadFonts();
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        // Continue without custom fonts
        setFontsLoaded(true);
      }
    };

    prepareFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'white' 
      }}>
        <ActivityIndicator size="large" color={colors.primary.yellow2} />
        <Text style={{ 
          marginTop: 16, 
          fontSize: 16, 
          color: colors.neutrals.gray 
        }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AppNavigation />
    </NavigationContainer>
  );
};

export default App;