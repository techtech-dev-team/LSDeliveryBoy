import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet } from 'react-native';

import Dashboard from '../Screens/Dashboard';
import Earnings from '../Screens/Earnings';
import OrdersHistory from '../Screens/OrdersHistory';
import Profile from '../Screens/Profile';
import { colors } from '../components/colors';

const Tab = createBottomTabNavigator();

const BottomNavigation = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Earnings') {
            iconName = focused ? 'trending-up' : 'trending-up-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary.yellow2,
        tabBarInactiveTintColor: colors.neutrals.gray,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={Dashboard}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersHistory}
        options={{
          tabBarLabel: 'Orders',
        }}
      />
      <Tab.Screen 
        name="Earnings" 
        component={Earnings}
        options={{
          tabBarLabel: 'Earnings',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={Profile}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: colors.neutrals.lightGray,
    paddingTop: 8,
    paddingBottom: 8,
    height: 70,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabItem: {
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
});

export default BottomNavigation;
