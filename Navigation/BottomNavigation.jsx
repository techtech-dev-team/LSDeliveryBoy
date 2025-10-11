import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet } from 'react-native';
import { HomeIcon, ListBulletIcon, ChartBarIcon, UserIcon } from 'react-native-heroicons/outline';
import { HomeIcon as HomeIconSolid, ListBulletIcon as ListBulletIconSolid, ChartBarIcon as ChartBarIconSolid, UserIcon as UserIconSolid } from 'react-native-heroicons/solid';

import Dashboard from '../Screens/Dashboard';
import Earnings from '../Screens/Earnings';
import OrdersHistory from '../Screens/OrdersHistory';
import Profile from '../Screens/Profile';
import { colors } from '../components/colors';

const Tab = createBottomTabNavigator();

const BottomNavigation = ({ onLogout }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconSize = size || 24;

          if (route.name === 'Dashboard') {
            return focused ? 
              <HomeIconSolid width={iconSize} height={iconSize} color={color} /> : 
              <HomeIcon width={iconSize} height={iconSize} color={color} />;
          } else if (route.name === 'Orders') {
            return focused ? 
              <ListBulletIconSolid width={iconSize} height={iconSize} color={color} /> : 
              <ListBulletIcon width={iconSize} height={iconSize} color={color} />;
          } else if (route.name === 'Earnings') {
            return focused ? 
              <ChartBarIconSolid width={iconSize} height={iconSize} color={color} /> : 
              <ChartBarIcon width={iconSize} height={iconSize} color={color} />;
          } else if (route.name === 'Profile') {
            return focused ? 
              <UserIconSolid width={iconSize} height={iconSize} color={color} /> : 
              <UserIcon width={iconSize} height={iconSize} color={color} />;
          }
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
        children={(props) => <Profile {...props} onLogout={onLogout} />}
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
    paddingBottom: 28,
    height: 90,
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
