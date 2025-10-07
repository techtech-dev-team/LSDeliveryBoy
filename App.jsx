import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { StyleSheet } from 'react-native';
import BottomNavigation from './Navigation/BottomNavigation';
import Camera from './Screens/Camera';
import Login from './Screens/Login';
import Maps from './Screens/Maps';
import Register from './Screens/Register';
import { colors } from './components/colors';

const Stack = createStackNavigator();



const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false, // Hide default header since we're using custom headers
        }}
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="MainApp" component={BottomNavigation} />
        <Stack.Screen name="Camera" component={Camera} />
        <Stack.Screen name="Maps" component={Maps} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutrals.lightGray,
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.neutrals.dark,
    marginBottom: 30,
    textAlign: 'center',
  },
  registerButton: {
    backgroundColor: colors.primary.yellow2,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutrals.dark,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary.yellow2,
    marginTop: 15,
  },
  secondaryButtonText: {
    color: colors.primary.yellow2,
  },
});

export default App;