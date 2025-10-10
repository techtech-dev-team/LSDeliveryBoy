import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform
} from 'react-native';
import { colors } from '../components/colors';
import { dashboardAPI } from '../utils/dashboard';

const BankDetails = ({ navigation, route }) => {
  const { userProfile } = route.params || {};
  const [loading, setLoading] = useState(false);
  
  // Initialize form data
  const [formData, setFormData] = useState({
    accountHolderName: userProfile?.deliveryBoyInfo?.bankDetails?.accountHolderName || '',
    accountNumber: userProfile?.deliveryBoyInfo?.bankDetails?.accountNumber || '',
    ifsc: userProfile?.deliveryBoyInfo?.bankDetails?.ifsc || '',
    bankName: userProfile?.deliveryBoyInfo?.bankDetails?.bankName || '',
    upiId: userProfile?.deliveryBoyInfo?.bankDetails?.upiId || '',
  });

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.accountHolderName.trim()) {
        Alert.alert('Error', 'Account holder name is required');
        return;
      }

      if (!formData.upiId.trim() && (!formData.accountNumber.trim() || !formData.ifsc.trim())) {
        Alert.alert('Error', 'Either provide UPI ID or complete bank account details');
        return;
      }

      const updateData = {
        'deliveryBoyInfo.bankDetails.accountHolderName': formData.accountHolderName,
        'deliveryBoyInfo.bankDetails.accountNumber': formData.accountNumber,
        'deliveryBoyInfo.bankDetails.ifsc': formData.ifsc,
        'deliveryBoyInfo.bankDetails.bankName': formData.bankName,
        'deliveryBoyInfo.bankDetails.upiId': formData.upiId,
      };

      const response = await dashboardAPI.updateProfile(updateData);

      if (response.success) {
        Alert.alert('Success', 'Bank details updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to update bank details');
      }
    } catch (error) {
      console.error('Bank details update error:', error);
      Alert.alert('Error', 'Failed to update bank details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.neutrals.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Bank Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary.yellow2} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Secure Payment</Text>
              <Text style={styles.infoDescription}>
                Your bank details are encrypted and secure. We use this information to process your earnings.
              </Text>
            </View>
          </View>
        </View>

        {/* Account Holder Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Holder Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.accountHolderName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, accountHolderName: text }))}
              placeholder="Enter account holder name"
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Bank Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Account Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Number</Text>
            <TextInput
              style={styles.input}
              value={formData.accountNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, accountNumber: text }))}
              placeholder="Enter account number"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>IFSC Code</Text>
            <TextInput
              style={styles.input}
              value={formData.ifsc}
              onChangeText={(text) => setFormData(prev => ({ ...prev, ifsc: text.toUpperCase() }))}
              placeholder="Enter IFSC code"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bank Name</Text>
            <TextInput
              style={styles.input}
              value={formData.bankName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, bankName: text }))}
              placeholder="Enter bank name"
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* UPI Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UPI Details (Alternative)</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>UPI ID</Text>
            <TextInput
              style={styles.input}
              value={formData.upiId}
              onChangeText={(text) => setFormData(prev => ({ ...prev, upiId: text }))}
              placeholder="Enter UPI ID (e.g., 9876543210@paytm)"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.note}>
            <Text style={styles.noteText}>
              You can provide either bank account details or UPI ID for receiving payments.
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Bank Details'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 45,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: colors.neutrals.dark,
    textAlign: 'center',
    marginRight: 40,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  infoSection: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary.yellow1,
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutrals.dark,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 12,
    color: colors.neutrals.gray,
    lineHeight: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.neutrals.dark,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutrals.dark,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutrals.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.neutrals.dark,
    backgroundColor: 'white',
  },
  note: {
    backgroundColor: colors.neutrals.lightGray,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  noteText: {
    fontSize: 12,
    color: colors.neutrals.gray,
    lineHeight: 16,
  },
  saveButton: {
    backgroundColor: colors.primary.yellow2,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    backgroundColor: colors.neutrals.gray,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
});

export default BankDetails;
