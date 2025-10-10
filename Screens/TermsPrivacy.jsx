import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../components/colors';

const TermsPrivacy = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('terms'); // 'terms' or 'privacy'

  const TabButton = ({ id, title, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const SectionContent = ({ children }) => (
    <Text style={styles.sectionContent}>{children}</Text>
  );

  const renderTermsContent = () => (
    <View style={styles.contentContainer}>
      <SectionHeader>1. Acceptance of Terms</SectionHeader>
      <SectionContent>
        By downloading, installing, or using the Lalaji Delivery Partner app, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
      </SectionContent>

      <SectionHeader>2. Delivery Partner Responsibilities</SectionHeader>
      <SectionContent>
        As a delivery partner, you agree to:
        {'\n'}• Maintain a valid driving license and vehicle registration
        {'\n'}• Provide accurate and complete information during registration
        {'\n'}• Deliver orders in a timely and professional manner
        {'\n'}• Handle customer orders with care and maintain food safety standards
        {'\n'}• Be courteous and professional with customers
        {'\n'}• Follow traffic rules and safety regulations
      </SectionContent>

      <SectionHeader>3. Account Registration</SectionHeader>
      <SectionContent>
        To use our services, you must:
        {'\n'}• Provide accurate personal information
        {'\n'}• Upload valid documents (Aadhar, PAN, Driving License, Vehicle RC)
        {'\n'}• Maintain the confidentiality of your account credentials
        {'\n'}• Notify us immediately of any unauthorized use of your account
      </SectionContent>

      <SectionHeader>4. Payment and Earnings</SectionHeader>
      <SectionContent>
        • Delivery charges will be calculated based on distance, order value, and demand
        {'\n'}• Payments will be processed weekly to your registered bank account
        {'\n'}• You are responsible for any applicable taxes on your earnings
        {'\n'}• We reserve the right to adjust payment terms with notice
      </SectionContent>

      <SectionHeader>5. Vehicle and Insurance</SectionHeader>
      <SectionContent>
        • You must maintain valid vehicle insurance
        {'\n'}• Your vehicle must be in good working condition
        {'\n'}• You are responsible for vehicle maintenance and fuel costs
        {'\n'}• Lalaji is not responsible for vehicle-related damages or accidents
      </SectionContent>

      <SectionHeader>6. Termination</SectionHeader>
      <SectionContent>
        We may terminate your account if you:
        {'\n'}• Violate these terms of service
        {'\n'}• Engage in fraudulent activities
        {'\n'}• Receive consistent poor ratings from customers
        {'\n'}• Fail to maintain required documents or licenses
      </SectionContent>

      <SectionHeader>7. Limitation of Liability</SectionHeader>
      <SectionContent>
        Lalaji shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform or delivery services.
      </SectionContent>

      <SectionHeader>8. Changes to Terms</SectionHeader>
      <SectionContent>
        We reserve the right to modify these terms at any time. Changes will be effective upon posting in the app. Continued use of the service constitutes acceptance of modified terms.
      </SectionContent>

      <SectionHeader>9. Contact Information</SectionHeader>
      <SectionContent>
        For questions about these terms, contact us at:
        {'\n'}Email: legal@lalaji.com
        {'\n'}Phone: +91-1234567890
      </SectionContent>
    </View>
  );

  const renderPrivacyContent = () => (
    <View style={styles.contentContainer}>
      <SectionHeader>Information We Collect</SectionHeader>
      <SectionContent>
        We collect the following information:
        {'\n'}• Personal Information: Name, phone number, email address
        {'\n'}• Identity Documents: Aadhar card, PAN card, driving license
        {'\n'}• Vehicle Information: Registration details, insurance information
        {'\n'}• Location Data: GPS location for delivery tracking
        {'\n'}• Financial Information: Bank account details for payments
        {'\n'}• Usage Data: App interaction and performance data
      </SectionContent>

      <SectionHeader>How We Use Your Information</SectionHeader>
      <SectionContent>
        Your information is used to:
        {'\n'}• Verify your identity and eligibility
        {'\n'}• Process delivery assignments and payments
        {'\n'}• Track deliveries and provide customer support
        {'\n'}• Improve our services and app functionality
        {'\n'}• Comply with legal and regulatory requirements
        {'\n'}• Send important notifications and updates
      </SectionContent>

      <SectionHeader>Information Sharing</SectionHeader>
      <SectionContent>
        We may share your information with:
        {'\n'}• Customers (limited to name and location during delivery)
        {'\n'}• Restaurant partners (for order coordination)
        {'\n'}• Payment processors (for earnings disbursement)
        {'\n'}• Legal authorities (when required by law)
        {'\n'}• Service providers (for app maintenance and support)
      </SectionContent>

      <SectionHeader>Location Data</SectionHeader>
      <SectionContent>
        We collect location data to:
        {'\n'}• Match you with nearby delivery requests
        {'\n'}• Provide real-time tracking to customers
        {'\n'}• Calculate delivery distances and charges
        {'\n'}• Ensure efficient delivery routes
        {'\n'}Location tracking can be disabled, but this will affect your ability to receive delivery requests.
      </SectionContent>

      <SectionHeader>Data Security</SectionHeader>
      <SectionContent>
        We implement security measures to protect your data:
        {'\n'}• Encryption of sensitive information
        {'\n'}• Secure servers and databases
        {'\n'}• Regular security audits and updates
        {'\n'}• Limited access to personal information
        {'\n'}• However, no system is 100% secure, and we cannot guarantee absolute security.
      </SectionContent>

      <SectionHeader>Your Rights</SectionHeader>
      <SectionContent>
        You have the right to:
        {'\n'}• Access your personal information
        {'\n'}• Correct inaccurate information
        {'\n'}• Delete your account and data
        {'\n'}• Opt-out of marketing communications
        {'\n'}• Withdraw consent for data processing
      </SectionContent>

      <SectionHeader>Data Retention</SectionHeader>
      <SectionContent>
        We retain your data for:
        {'\n'}• Active accounts: As long as your account is active
        {'\n'}• Inactive accounts: Up to 2 years after last activity
        {'\n'}• Financial records: As required by law (typically 7 years)
        {'\n'}• Legal requirements: As mandated by applicable laws
      </SectionContent>

      <SectionHeader>Contact Us</SectionHeader>
      <SectionContent>
        For privacy-related questions or requests:
        {'\n'}Email: privacy@lalaji.com
        {'\n'}Phone: +91-1234567890
        {'\n'}Address: Lalaji Technologies Pvt. Ltd.
        {'\n'}123 Tech Park, Bangalore, Karnataka 560001
      </SectionContent>
    </View>
  );

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
        <Text style={styles.title}>Terms & Privacy</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TabButton
          id="terms"
          title="Terms of Service"
          isActive={activeTab === 'terms'}
          onPress={() => setActiveTab('terms')}
        />
        <TabButton
          id="privacy"
          title="Privacy Policy"
          isActive={activeTab === 'privacy'}
          onPress={() => setActiveTab('privacy')}
        />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.lastUpdated}>
          <Text style={styles.lastUpdatedText}>
            Last updated: October 10, 2025
          </Text>
        </View>

        {activeTab === 'terms' ? renderTermsContent() : renderPrivacyContent()}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 Lalaji Technologies Pvt. Ltd. All rights reserved.
          </Text>
        </View>
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  title: {
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
    textAlign: 'center',
    marginRight: 40,
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutrals.lightGray,
    margin: 20,
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: 'white',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutrals.gray,
  },
  tabButtonTextActive: {
    color: colors.neutrals.dark,
  },
  content: {
    flex: 1,
  },
  lastUpdated: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.primary.yellow1,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: colors.neutrals.gray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  contentContainer: {
    padding: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutrals.dark,
    marginTop: 24,
    marginBottom: 12,
    lineHeight: 22,
  },
  sectionContent: {
    fontSize: 14,
    color: colors.neutrals.gray,
    lineHeight: 20,
    marginBottom: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.neutrals.lightGray,
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 12,
    color: colors.neutrals.gray,
    textAlign: 'center',
  },
});

export default TermsPrivacy;
