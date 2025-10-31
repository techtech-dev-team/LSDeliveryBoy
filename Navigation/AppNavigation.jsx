import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import BankDetails from '../Screens/BankDetails';
import Camera from '../Screens/Camera';
import Documents from '../Screens/Documents';
import EditAddress from '../Screens/EditAddress';
import EditProfile from '../Screens/EditProfile';
import HelpSupport from '../Screens/HelpSupport';
import LocationPicker from '../Screens/LocationPicker';
import Login from '../Screens/Login';
import Maps from '../Screens/Maps';
import OrderDetails from '../Screens/OrderDetails';
import PendingApproval from '../Screens/PendingApproval';
import RejectedAccount from '../Screens/RejectedAccount';
import Register from '../Screens/Register';
import TermsPrivacy from '../Screens/TermsPrivacy';
import { authAPI } from '../utils/auth';
import { approvalAPI } from '../utils/approval';
import BottomNavigation from './BottomNavigation';

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
  const [userStatus, setUserStatus] = useState(null); // 'approved', 'pending', 'rejected'

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Monitor auth and status changes
  useEffect(() => {
    if (isAuthenticated && !userStatus) {
      // If authenticated but no status, re-check
      checkAuthStatus();
    }
  }, [isAuthenticated, userStatus]);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 AppNavigation: Checking auth status...');
      const authenticated = await authAPI.isAuthenticated();
      console.log('🔍 AppNavigation: Auth status:', authenticated);
      setIsAuthenticated(authenticated);
      
      // If authenticated, check user status
      if (authenticated) {
        try {
          console.log('🔍 AppNavigation: Fetching user profile...');
          const profileResponse = await approvalAPI.getProfile();
          
          if (profileResponse.success) {
            const status = profileResponse.data.deliveryBoyInfo?.verificationStatus || 'pending';
            console.log('🔍 AppNavigation: User verification status:', status);
            setUserStatus(status);
          } else {
            console.log('🔍 AppNavigation: Profile response failed, defaulting to pending');
            setUserStatus('pending');
          }
        } catch (error) {
          console.error('Status check error:', error);
          setUserStatus('pending');
        }
      } else {
        setUserStatus(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUserStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a custom Login component that can update auth state
  const LoginWithAuth = (props) => (
    <Login {...props} onLoginSuccess={async () => {
      setIsAuthenticated(true);
      // Re-check status after login with a small delay to ensure token is set
      setTimeout(() => {
        checkAuthStatus();
      }, 500);
    }} />
  );

  // Function to handle logout - this will be passed down to components
  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error in AppNavigation:', error);
    }
    setIsAuthenticated(false);
    setUserStatus(null);
  };

  if (isLoading) {
    // You can return a loading screen here
    return null;
  }

  // Determine initial route based on auth and status
  let initialRoute = "Login";
  if (isAuthenticated) {
    if (userStatus === 'rejected') {
      console.log('🔴 AppNavigation: User status is rejected, setting initial route to RejectedAccount');
      initialRoute = "RejectedAccount";
    } else if (userStatus === 'pending') {
      console.log('🟡 AppNavigation: User status is pending, setting initial route to PendingApproval');
      initialRoute = "PendingApproval";
    } else if (userStatus === 'approved') {
      console.log('✅ AppNavigation: User status is approved, setting initial route to MainApp');
      initialRoute = "MainApp";
    } else {
      console.log('⚪ AppNavigation: User status is unknown:', userStatus, 'defaulting to MainApp');
      initialRoute = "MainApp";
    }
  } else {
    console.log('🔓 AppNavigation: User not authenticated, setting initial route to Login');
  }

  console.log('🎯 AppNavigation: Final initial route:', initialRoute);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName={initialRoute}
    >
      {!isAuthenticated ? (
        // Auth Stack (not authenticated)
        <>
          <Stack.Screen name="Login" component={LoginWithAuth} />
          <Stack.Screen name="Register" component={Register} />
        </>
      ) : userStatus === 'rejected' ? (
        // Rejected Stack (authenticated but rejected)
        <>
          <Stack.Screen 
            name="RejectedAccount" 
            children={(props) => <RejectedAccount {...props} onLogout={handleLogout} />}
          />
          <Stack.Screen 
            name="EditProfile" 
            component={EditProfile}
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
              title: 'Reapply for Verification'
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
            name="Camera" 
            component={Camera}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom'
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
            name="PendingApproval" 
            component={PendingApproval}
          />
          <Stack.Screen name="Login" component={LoginWithAuth} />
        </>
      ) : userStatus === 'pending' ? (
        // Pending Stack (authenticated but pending)
        <>
          <Stack.Screen name="PendingApproval" component={PendingApproval} />
          <Stack.Screen 
            name="RejectedAccount" 
            children={(props) => <RejectedAccount {...props} onLogout={handleLogout} />}
          />
          <Stack.Screen name="Login" component={LoginWithAuth} />
        </>
      ) : (
        // Main App Stack (authenticated and approved)
        <>
          <Stack.Screen 
            name="MainApp" 
            children={() => <BottomNavigation onLogout={handleLogout} />}
          />
          <Stack.Screen 
            name="RejectedAccount" 
            children={(props) => <RejectedAccount {...props} onLogout={handleLogout} />}
          />
          <Stack.Screen name="PendingApproval" component={PendingApproval} />
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
          <Stack.Screen 
            name="OrderDetails" 
            component={OrderDetails}
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
              title: 'Order Details'
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigation;

