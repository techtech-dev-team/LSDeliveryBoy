import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { colors } from '../components/colors';

const Profile = ({ navigation }) => {
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => navigation.getParent()?.navigate('Login')
        }
      ]
    );
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
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={colors.neutrals.dark} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Delivery Partner</Text>
            <Text style={styles.profileId}>ID: DP001</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Verified</Text>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <MenuItem 
            icon="person-outline"
            title="Personal Information"
            subtitle="Update your details"
            onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon')}
          />
          <MenuItem 
            icon="document-text-outline"
            title="Documents"
            subtitle="ID proof, License, Insurance"
            onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon')}
          />
          <MenuItem 
            icon="camera-outline"
            title="ID Verification"
            subtitle="Take photo for verification"
            onPress={() => navigation.navigate('Camera', { type: 'id-verification' })}
          />
          <MenuItem 
            icon="card-outline"
            title="Bank Details"
            subtitle="Payment information"
            onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon')}
          />
        </View>

        {/* Delivery Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery</Text>
          <MenuItem 
            icon="bicycle-outline"
            title="Vehicle Information"
            subtitle="Bike details and maintenance"
            onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon')}
          />
          <MenuItem 
            icon="time-outline"
            title="Availability Schedule"
            subtitle="Set your working hours"
            onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon')}
          />
          <MenuItem 
            icon="star-outline"
            title="Ratings & Reviews"
            subtitle="4.8 stars (156 reviews)"
            onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon')}
          />
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <MenuItem 
            icon="notifications-outline"
            title="Notifications"
            subtitle="Push notifications, SMS"
            onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon')}
          />
          <MenuItem 
            icon="language-outline"
            title="Language"
            subtitle="English"
            onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon')}
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <MenuItem 
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="FAQ, Contact support"
            onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon')}
          />
          <MenuItem 
            icon="document-outline"
            title="Terms & Privacy"
            subtitle="Legal information"
            onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon')}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.neutrals.dark,
    letterSpacing: -0.5,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 32,
    marginBottom: 32,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.neutrals.lightGray,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.neutrals.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '400',
    color: colors.neutrals.dark,
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: colors.neutrals.gray,
    marginBottom: 8,
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
    fontWeight: '400',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.neutrals.dark,
    marginBottom: 16,
    paddingHorizontal: 32,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutrals.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.neutrals.dark,
  },
  menuSubtitle: {
    fontSize: 14,
    color: colors.neutrals.gray,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.neutrals.lightGray,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.neutrals.gray,
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: colors.neutrals.gray,
    fontWeight: '400',
  },
});

export default Profile;