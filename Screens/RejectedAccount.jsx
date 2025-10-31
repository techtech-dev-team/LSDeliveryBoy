import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { colors, typography } from '../components/colors';
import { authAPI } from '../utils/auth';
import { approvalAPI } from '../utils/approval';

const RejectedAccount = ({ navigation, route, onLogout, onStatusRefresh }) => {
  const user = route?.params?.user || null;
  const rejectionReason = route?.params?.rejectionReason || 'Account verification failed';
  const [refreshing, setRefreshing] = useState(false);

  const handleContactSupport = () => {
    const supportPhone = '+911234567890'; // TODO: replace with real support number
    const supportEmail = 'support@lalajistore.com'; // TODO: replace with real support email

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
            const subject = encodeURIComponent('Account Rejection Appeal');
            const body = encodeURIComponent(`Hello,\n\nMy account has been rejected.\n\nPhone: ${user?.phoneNumber || ''}\nReason: ${rejectionReason}\n\nI would like to appeal this decision and provide additional documentation if needed.\n\nThank you.`);
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
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleReapply = () => {
    Alert.alert(
      'Reapply for Verification',
      'You will need to upload new documents and your application will be reviewed again. Do you want to proceed?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Proceed',
          onPress: () => {
            navigation.navigate('EditProfile', { 
              userProfile: user, 
              isReapplication: true,
              rejectionReason 
            });
          }
        }
      ]
    );
  };

  const checkStatus = async () => {
    try {
      setRefreshing(true);
      const response = await approvalAPI.getProfile();
      
      if (response.success) {
        const status = response.data.deliveryBoyInfo?.verificationStatus;
        
        if (status === 'approved') {
          // Call refresh function to update AppNavigation state
          if (onStatusRefresh) {
            onStatusRefresh();
          }
          Alert.alert(
            'Great News!',
            'Your account has been approved! You can now start accepting deliveries.',
            [
              {
                text: 'Continue',
                onPress: () => navigation.replace('MainApp')
              }
            ]
          );
        } else if (status === 'pending') {
          // Call refresh function to update AppNavigation state
          if (onStatusRefresh) {
            onStatusRefresh();
          }
          Alert.alert(
            'Status Updated',
            'Your account is now under review. Please wait for the approval.',
            [
              {
                text: 'OK',
                onPress: () => navigation.replace('PendingApproval', { user: response.data })
              }
            ]
          );
        } else if (status === 'rejected') {
          const newReason = response.data.deliveryBoyInfo?.verificationNotes || rejectionReason;
          if (newReason !== rejectionReason) {
            Alert.alert('Status Update', `Updated rejection reason: ${newReason}`);
          } else {
            Alert.alert('No Change', 'Your account status is still rejected.');
          }
        }
      } else {
        Alert.alert('Error', 'Failed to check status. Please try again.');
      }
    } catch (error) {
      console.error('Status check error:', error);
      Alert.alert('Error', 'Failed to check status. Please try again.');
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
              // Use onLogout callback if available, otherwise fallback to navigation
              if (onLogout) {
                onLogout();
              } else {
                // Force app restart by navigating to the root
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            } catch (error) {
              console.error('Logout error:', error);
              // Force logout even if API fails
              if (onLogout) {
                onLogout();
              } else {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="close-circle" size={80} color="#FF6B6B" />
          </View>
          <Text style={styles.title}>Account Rejected</Text>
          <Text style={styles.subtitle}>
            Your delivery partner application has been rejected
          </Text>
        </View>

        {/* Rejection Details */}
        <View style={styles.detailsCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color={colors.neutrals.dark} />
            <Text style={styles.sectionTitle}>Rejection Details</Text>
          </View>
          
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>Reason:</Text>
            <Text style={styles.reasonText}>{rejectionReason}</Text>
          </View>

          {user && (
            <View style={styles.userInfo}>
              <Text style={styles.userInfoLabel}>Account Details:</Text>
              <Text style={styles.userInfoText}>Name: {user.name || user.deliveryBoyInfo?.personalInfo?.fullName}</Text>
              <Text style={styles.userInfoText}>Phone: {user.phoneNumber}</Text>
              <Text style={styles.userInfoText}>Registration: {new Date(user.createdAt).toLocaleDateString()}</Text>
            </View>
          )}
        </View>

        {/* Next Steps */}
        <View style={styles.stepsCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list-outline" size={20} color={colors.neutrals.dark} />
            <Text style={styles.sectionTitle}>What You Can Do</Text>
          </View>
          
          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Review Requirements</Text>
                <Text style={styles.stepDescription}>
                  Make sure you have all required documents: ID proof, address proof, vehicle documents, and bank details.
                </Text>
              </View>
            </View>
            
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Contact Support</Text>
                <Text style={styles.stepDescription}>
                  Get clarification on rejection reasons and understand what needs to be corrected.
                </Text>
              </View>
            </View>
            
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Reapply</Text>
                <Text style={styles.stepDescription}>
                  Submit a new application with corrected documents and information.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleContactSupport}>
            <Ionicons name="call-outline" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Contact Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleReapply}>
            <Ionicons name="document-text-outline" size={20} color={colors.primary.yellow2} />
            <Text style={styles.secondaryButtonText}>Reapply for Verification</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.refreshButton, refreshing && styles.refreshingButton]} 
            onPress={checkStatus}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.neutrals.gray} />
            ) : (
              <Ionicons name="refresh-outline" size={20} color={colors.neutrals.gray} />
            )}
            <Text style={styles.refreshButtonText}>
              {refreshing ? 'Checking...' : 'Check Status'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={16} color={colors.neutrals.gray} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 45,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: typography.fontSize['2xl'] + 2,
    fontFamily: typography.fontFamily.bold,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutrals.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.neutrals.lightGray,
  },
  stepsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.neutrals.lightGray,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
    marginLeft: 8,
  },
  reasonContainer: {
    backgroundColor: '#FFF5F5',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
    marginBottom: 16,
  },
  reasonLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: '#D53F8C',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: '#E53E3E',
    lineHeight: 20,
  },
  userInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutrals.lightGray,
  },
  userInfoLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.gray,
    marginBottom: 8,
  },
  userInfoText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutrals.dark,
    marginBottom: 4,
  },
  stepsList: {
    gap: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary.yellow2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: 'white',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutrals.gray,
    lineHeight: 18,
  },
  actions: {
    gap: 12,
    marginTop: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.yellow2,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
    color: 'white',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary.yellow2,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary.yellow2,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutrals.lightGray,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  refreshingButton: {
    opacity: 0.7,
  },
  refreshButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutrals.gray,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutrals.lightGray,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutrals.gray,
  },
});

export default RejectedAccount;
