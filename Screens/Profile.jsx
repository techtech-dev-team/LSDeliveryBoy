import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    RefreshControl,
    Image
} from 'react-native';
import { colors } from '../components/colors';
import { dashboardAPI } from '../utils/dashboard';
import { authAPI } from '../utils/auth';

const Profile = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);

  // Load user profile data
  const loadProfile = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      const response = await dashboardAPI.getProfile();
      
      if (response.success) {
        setUserProfile(response.data);
      } else {
        setError('Failed to load profile');
        Alert.alert('Error', 'Failed to load profile data');
      }
    } catch (error) {
      console.error('Profile load error:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initialize profile data
  useEffect(() => {
    loadProfile();
  }, []);

  // Refresh profile when screen gains focus (after returning from edit screens)
  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  // Refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    loadProfile(false);
  };

  // Logout handler
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await authAPI.logout();
              navigation.getParent()?.navigate('Login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout properly');
            }
          }
        }
      ]
    );
  };

  // Get verification status
  const getVerificationStatus = () => {
    if (!userProfile) return { text: 'Unknown', color: colors.neutrals.gray };
    
    if (userProfile.isPhoneVerified && userProfile.deliveryBoyInfo?.documents?.length > 0) {
      return { text: 'Verified', color: colors.primary.yellow2 };
    } else if (userProfile.isPhoneVerified) {
      return { text: 'Phone Verified', color: '#FFA500' };
    } else {
      return { text: 'Unverified', color: '#FF6B6B' };
    }
  };

  // Get user's name
  const getUserName = () => {
    if (!userProfile) return 'Loading...';
    return userProfile.name || userProfile.deliveryBoyInfo?.personalInfo?.fullName || 'Delivery Partner';
  };

  // Get user ID
  const getUserId = () => {
    if (!userProfile) return 'Loading...';
    return `ID: ${userProfile._id || 'N/A'}`;
  };

  // Get phone number
  const getPhoneNumber = () => {
    if (!userProfile) return '';
    return userProfile.phoneNumber || userProfile.deliveryBoyInfo?.personalInfo?.mobileNumber || '';
  };

  // Get address
  const getAddress = () => {
    if (!userProfile) return 'Not provided';
    return userProfile.deliveryBoyInfo?.personalInfo?.address || 'Not provided';
  };

  // Get vehicle info
  const getVehicleInfo = () => {
    if (!userProfile?.deliveryBoyInfo?.vehicleInfo) return 'Not provided';
    const vehicle = userProfile.deliveryBoyInfo.vehicleInfo;
    return `${vehicle.type || 'Unknown'} - ${vehicle.vehicleNumber || 'N/A'}`;
  };

  // Get bank details status
  const getBankDetailsStatus = () => {
    const bankDetails = userProfile?.deliveryBoyInfo?.bankDetails;
    if (!bankDetails) return 'Not provided';
    
    if (bankDetails.accountNumber && bankDetails.ifsc) {
      return 'Configured';
    } else if (bankDetails.upiId) {
      return 'UPI only';
    } else {
      return 'Incomplete';
    }
  };

  // Get experience
  const getExperience = () => {
    const years = userProfile?.deliveryBoyInfo?.experience?.years;
    if (!years) return 'Not specified';
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  };

  const MenuItem = ({ icon, title, subtitle, onPress, showArrow = true }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={colors.neutrals.dark} />
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={16} color={colors.neutrals.gray} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.yellow2} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary.yellow2]}
              tintColor={colors.primary.yellow2}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              {userProfile?.avatar ? (
                <Image source={{ uri: userProfile.avatar }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={32} color={colors.neutrals.dark} />
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{getUserName()}</Text>
              <Text style={styles.profileId}>{getUserId()}</Text>
            </View>
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <MenuItem 
              icon="person-outline"
              title="Personal Information"
              subtitle={`${getUserName()} • ${getPhoneNumber()}`}
              onPress={() => navigation.navigate('EditProfile', { userProfile })}
            />
            <MenuItem 
              icon="location-outline"
              title="Address"
              subtitle={getAddress()}
              onPress={() => navigation.navigate('EditAddress', { userProfile })}
            />
            <MenuItem 
              icon="document-text-outline"
              title="Documents"
              subtitle={`${Object.keys(userProfile?.deliveryBoyInfo?.documentsByType || {}).length} documents uploaded`}
              onPress={() => navigation.navigate('Documents', { userProfile })}
            />
            <MenuItem 
              icon="card-outline"
              title="Bank Details"
              subtitle={getBankDetailsStatus()}
              onPress={() => navigation.navigate('BankDetails', { userProfile })}
            />
          </View>

          {/* Delivery Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery</Text>
            <MenuItem 
              icon="bicycle-outline"
              title="Vehicle Information"
              subtitle={getVehicleInfo()}
              onPress={() => navigation.navigate('EditProfile', { userProfile, section: 'vehicle' })}
            />
            <MenuItem 
              icon="time-outline"
              title="Working Hours"
              subtitle={`${userProfile?.deliveryBoyInfo?.workingHours?.start || '09:00'} - ${userProfile?.deliveryBoyInfo?.workingHours?.end || '18:00'}`}
              onPress={() => navigation.navigate('EditProfile', { userProfile, section: 'workingHours' })}
            />
            <MenuItem 
              icon="briefcase-outline"
              title="Experience"
              subtitle={getExperience()}
              onPress={() => navigation.navigate('EditProfile', { userProfile, section: 'experience' })}
            />
            <MenuItem 
              icon="star-outline"
              title="Ratings & Reviews"
              subtitle="View your performance"
              onPress={() => navigation.navigate('OrderHistory', { userProfile })}
            />
          </View>

          {/* Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <MenuItem 
              icon="notifications-outline"
              title="Notifications"
              subtitle="Push notifications, SMS"
              onPress={() => navigation.navigate('EditProfile', { userProfile, section: 'notifications' })}
            />
            <MenuItem 
              icon="language-outline"
              title="Language"
              subtitle="English"
              onPress={() => Alert.alert('Language', 'Language selection will be available in future updates')}
            />
            <MenuItem 
              icon="lock-closed-outline"
              title="Change Password"
              subtitle="Update your password"
              onPress={() => navigation.navigate('EditProfile', { userProfile, section: 'password' })}
            />
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <MenuItem 
              icon="help-circle-outline"
              title="Help & Support"
              subtitle="FAQ, Contact support"
              onPress={() => {
                Alert.alert(
                  'Help & Support',
                  'Need help? Contact us:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Call Support', 
                      onPress: () => Alert.alert('Support', 'Call: +91-1234567890')
                    },
                    { 
                      text: 'Email Support', 
                      onPress: () => Alert.alert('Support', 'Email: support@lalaji.com')
                    }
                  ]
                );
              }}
            />
            <MenuItem 
              icon="document-outline"
              title="Terms & Privacy"
              subtitle="Legal information"
              onPress={() => {
                Alert.alert(
                  'Terms & Privacy',
                  'Legal documents and privacy policy information will be available in the app settings.',
                  [{ text: 'OK' }]
                );
              }}
            />
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.neutrals.gray} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Version 1.0.0</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 45, // Fixed value instead of Platform check
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.neutrals.gray,
    fontWeight: '400',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.neutrals.dark,
    letterSpacing: -0.3,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.neutrals.lightGray,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.neutrals.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.neutrals.dark,
    marginBottom: 2,
  },
  profileId: {
    fontSize: 12,
    color: colors.neutrals.gray,
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary.yellow2,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: colors.primary.yellow2,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.neutrals.dark,
    marginBottom: 12,
    paddingHorizontal: 20,
    letterSpacing: -0.3,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutrals.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.neutrals.dark,
  },
  menuSubtitle: {
    fontSize: 13,
    color: colors.neutrals.gray,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.neutrals.lightGray,
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.neutrals.gray,
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: colors.neutrals.gray,
    fontWeight: '400',
  },
});

export default Profile;