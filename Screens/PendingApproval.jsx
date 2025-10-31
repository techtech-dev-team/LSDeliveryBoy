import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, typography } from '../components/colors';
import { approvalAPI } from '../utils/approval';
import { authAPI } from '../utils/auth';

const PendingApproval = ({ navigation, route, onStatusRefresh }) => {
  const user = route?.params?.user || null;
  const [refreshing, setRefreshing] = useState(false);

  const handleContactSupport = () => {
    const supportPhone = '+911234567890'; // TODO: replace with real support number
    const supportEmail = 'support@example.com'; // TODO: replace with real support email

    Alert.alert(
      'Contact Support',
      'Choose how you want to contact support',
      [
        {
          text: 'Call Support',
          onPress: async () => {
            const url = `tel:${supportPhone}`;
            try {
              const supported = await Linking.canOpenURL(url);
              if (supported) await Linking.openURL(url);
              else Alert.alert('Error', 'Calling is not supported on this device');
            } catch (err) {
              console.error('Call support error:', err);
              Alert.alert('Error', 'Unable to start call');
            }
          }
        },
        {
          text: 'Email Support',
          onPress: async () => {
            const subject = encodeURIComponent('Account Approval Support');
            const body = encodeURIComponent(`Hello,\n\nMy phone number is: ${user?.phoneNumber || ''}\n\nPlease help with account approval.`);
            const url = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
            try {
              const supported = await Linking.canOpenURL(url);
              if (supported) await Linking.openURL(url);
              else Alert.alert('Error', 'Email is not configured on this device');
            } catch (err) {
              console.error('Email support error:', err);
              Alert.alert('Error', 'Unable to open email client');
            }
          }
        },
        {
          text: 'Help Center',
          onPress: () => navigation.navigate('HelpSupport')
        },
        { text: 'Cancel', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  const handleRefreshStatus = async () => {
    try {
      setRefreshing(true);
      
      console.log('🔄 PendingApproval: Checking status...');
      const resp = await approvalAPI.getProfile();
      
      if (!resp || !resp.success) {
        const msg = resp?.error || 'Unable to fetch status. Please try again.';

        if (resp?.needsLogin) {
          Alert.alert(
            'Session required',
            'We need you to sign in to check your account status. Would you like to go to the login screen?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Go to Login', onPress: () => navigation.navigate('Login', { prefillPhone: user?.phoneNumber }) }
            ]
          );
          return;
        }

        Alert.alert('Error', msg);
        return;
      }

      const profile = resp.data || {};
      console.log('🔍 PendingApproval: Profile data:', profile.deliveryBoyInfo?.verificationStatus);

      // Check the verification status
      const status = profile.deliveryBoyInfo?.verificationStatus;
      
      if (status === 'approved') {
        // Call refresh function to update AppNavigation state
        if (onStatusRefresh) {
          console.log('✅ PendingApproval: Calling status refresh for approved user');
          onStatusRefresh();
        }
        Alert.alert(
          'Account Approved! 🎉',
          'Your account has been approved by our admin team. You can now start accepting deliveries.',
          [
            { 
              text: 'Continue', 
              onPress: () => navigation.replace('MainApp')
            }
          ]
        );
      } else if (status === 'rejected') {
        // Call refresh function to update AppNavigation state
        if (onStatusRefresh) {
          console.log('🔴 PendingApproval: Calling status refresh for rejected user');
          onStatusRefresh();
        }
        const rejectionReason = profile.deliveryBoyInfo?.verificationNotes || 'Account verification failed';
        Alert.alert(
          'Application Rejected',
          `Your application has been rejected.\n\nReason: ${rejectionReason}`,
          [
            {
              text: 'View Details',
              onPress: () => navigation.replace('RejectedAccount', { 
                user: profile,
                rejectionReason 
              })
            }
          ]
        );
      } else if (status === 'pending') {
        Alert.alert(
          'Still Pending',
          'Your account is still pending admin approval. Our team typically reviews applications within 24-48 hours.\n\nPlease check back later or contact support if you need assistance.',
          [
            {
              text: 'Contact Support',
              onPress: handleContactSupport
            },
            { text: 'OK' }
          ]
        );
      } else {
        console.log('⚠️ PendingApproval: Unknown status:', status);
        Alert.alert(
          'Status Unknown',
          'Unable to determine your account status. Please contact support for assistance.',
          [
            {
              text: 'Contact Support',
              onPress: handleContactSupport
            },
            { text: 'OK' }
          ]
        );
      }
    } catch (err) {
      console.error('Refresh status error:', err);
      Alert.alert('Error', 'Failed to refresh status. Please check your internet connection and try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
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
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (err) {
              console.error('Logout error:', err);
              // Force logout even if API fails
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View style={styles.card}>
        <Ionicons name="time-outline" size={56} color={colors.primary.yellow2} />
        <Text style={styles.title}>Account Pending Approval</Text>
        <Text style={styles.subtitle}>
          Your account is currently pending verification by our team.
          {user?.phoneNumber ? `\nPhone: ${user.phoneNumber}` : ''}
          {user?.name ? `\nName: ${user.name}` : ''}
        </Text>

        <Text style={styles.info}>
          Our admin team will review your details and documents. This usually takes 24-48 hours. You will be notified once your account is approved.
        </Text>

        <View style={styles.statusCard}>
          <Ionicons name="document-text-outline" size={24} color={colors.primary.yellow2} />
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusText}>Application Status: Pending Review</Text>
            {user?.deliveryBoyInfo?.reappliedAt && (
              <Text style={styles.reapplicationText}>
                Reapplication submitted: {new Date(user.deliveryBoyInfo.reappliedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, styles.refreshButton]} 
          onPress={handleRefreshStatus} 
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Check Status</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleContactSupport}>
          <Ionicons name="headset-outline" size={20} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Contact Support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.ghostButton]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={16} color="#333" style={styles.buttonIcon} />
          <Text style={[styles.buttonText, styles.ghostButtonText]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: 'white',
    alignItems: 'center',
    padding: 28,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    width: '100%',
    maxWidth: 520,
  },
  title: {
    fontSize: 22,
    marginTop: 12,
    color: colors.neutrals.dark,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: colors.neutrals.gray,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.primary.yellow2,
  },
  statusTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    fontFamily: typography.fontFamily.medium,
  },
  reapplicationText: {
    fontSize: 12,
    color: '#999',
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 8,
    minWidth: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontFamily: typography.fontFamily.medium,
    fontSize: 16,
  },
  ghostButton: {
    backgroundColor: '#f5f5f5',
    marginTop: 12,
  },
  ghostButtonText: {
    color: '#333'
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    marginTop: 20,
  }
});

export default PendingApproval;