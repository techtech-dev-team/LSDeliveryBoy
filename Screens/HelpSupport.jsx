import React from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../components/colors';

const HelpSupport = ({ navigation }) => {
  const handleCall = (phoneNumber) => {
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(phoneUrl).then((supported) => {
      if (supported) {
        Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Error', 'Phone calls are not supported on this device');
      }
    });
  };

  const handleEmail = (email) => {
    const emailUrl = `mailto:${email}`;
    Linking.canOpenURL(emailUrl).then((supported) => {
      if (supported) {
        Linking.openURL(emailUrl);
      } else {
        Alert.alert('Error', 'Email is not supported on this device');
      }
    });
  };

  const handleWhatsApp = (phoneNumber) => {
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
    Linking.canOpenURL(whatsappUrl).then((supported) => {
      if (supported) {
        Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed on this device');
      }
    });
  };

  const ContactItem = ({ icon, title, subtitle, onPress, color = colors.primary.yellow2 }) => (
    <TouchableOpacity style={styles.contactItem} onPress={onPress}>
      <View style={[styles.contactIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactTitle}>{title}</Text>
        <Text style={styles.contactSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.neutrals.gray} />
    </TouchableOpacity>
  );

  const FAQItem = ({ question, answer }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    
    return (
      <View style={styles.faqItem}>
        <TouchableOpacity 
          style={styles.faqQuestion}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Text style={styles.faqQuestionText}>{question}</Text>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={colors.neutrals.gray} 
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.faqAnswer}>
            <Text style={styles.faqAnswerText}>{answer}</Text>
          </View>
        )}
      </View>
    );
  };

  const faqData = [
    {
      question: "How do I start delivering orders?",
      answer: "Once your account is verified and all documents are uploaded, you can go online in the app. You'll receive order notifications when customers place orders in your area."
    },
    {
      question: "How do I update my availability status?",
      answer: "Go to your Dashboard and toggle the availability switch. When you're online, you'll receive delivery requests. When offline, you won't receive any orders."
    },
    {
      question: "How are delivery charges calculated?",
      answer: "Delivery charges are calculated based on distance, order value, and current demand. You'll see the exact amount before accepting each delivery."
    },
    {
      question: "When will I receive my earnings?",
      answer: "Earnings are processed weekly and transferred to your registered bank account. You can track your earnings in the Earnings section."
    },
    {
      question: "What documents do I need to upload?",
      answer: "Required documents include: Aadhar Card, PAN Card, Driving License, and Vehicle RC. Optional documents include Bank Passbook and Vehicle Photo."
    },
    {
      question: "How do I report an issue with an order?",
      answer: "You can report issues directly from the order screen or contact support through this help section."
    },
    {
      question: "Can I change my vehicle information?",
      answer: "Yes, you can update your vehicle information from your Profile > Vehicle Information. Make sure to upload updated RC if you change vehicles."
    },
    {
      question: "What if a customer is not available for delivery?",
      answer: "Try calling the customer. If they don't respond, wait for 10 minutes and then contact support for further assistance."
    }
  ];

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
        <Text style={styles.title}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <ContactItem
            icon="call"
            title="Call Support"
            subtitle="+91-1234567890"
            onPress={() => handleCall('+911234567890')}
            color="#4CAF50"
          />
          <ContactItem
            icon="mail"
            title="Email Support"
            subtitle="support@lalaji.com"
            onPress={() => handleEmail('support@lalaji.com')}
            color="#2196F3"
          />
          <ContactItem
            icon="logo-whatsapp"
            title="WhatsApp Support"
            subtitle="+91-1234567890"
            onPress={() => handleWhatsApp('911234567890')}
            color="#25D366"
          />
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <View style={styles.emergencyCard}>
            <View style={styles.emergencyIcon}>
              <Ionicons name="warning" size={24} color="#FF6B6B" />
            </View>
            <View style={styles.emergencyInfo}>
              <Text style={styles.emergencyTitle}>24/7 Emergency Helpline</Text>
              <Text style={styles.emergencySubtitle}>For urgent delivery issues</Text>
              <TouchableOpacity 
                style={styles.emergencyButton}
                onPress={() => handleCall('+911800123456')}
              >
                <Text style={styles.emergencyButtonText}>Call Now: 1800-123-456</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqData.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
            />
          ))}
        </View>

        {/* Additional Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Resources</Text>
          <TouchableOpacity style={styles.resourceItem}>
            <Ionicons name="document-text" size={20} color={colors.primary.yellow2} />
            <Text style={styles.resourceText}>Delivery Guidelines</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.neutrals.gray} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.resourceItem}>
            <Ionicons name="school" size={20} color={colors.primary.yellow2} />
            <Text style={styles.resourceText}>Training Materials</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.neutrals.gray} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.resourceItem}>
            <Ionicons name="chatbubbles" size={20} color={colors.primary.yellow2} />
            <Text style={styles.resourceText}>Community Forum</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.neutrals.gray} />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoTitle}>Lalaji Delivery Partner</Text>
          <Text style={styles.appInfoSubtitle}>Version 1.0.0</Text>
          <Text style={styles.appInfoSubtitle}>© 2025 Lalaji. All rights reserved.</Text>
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
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
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.neutrals.dark,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.neutrals.dark,
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 13,
    color: colors.neutrals.gray,
  },
  emergencyCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  emergencyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutrals.dark,
    marginBottom: 2,
  },
  emergencySubtitle: {
    fontSize: 12,
    color: colors.neutrals.gray,
    marginBottom: 8,
  },
  emergencyButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutrals.dark,
    marginRight: 12,
  },
  faqAnswer: {
    paddingBottom: 16,
    paddingRight: 28,
  },
  faqAnswerText: {
    fontSize: 13,
    color: colors.neutrals.gray,
    lineHeight: 18,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  resourceText: {
    flex: 1,
    fontSize: 15,
    color: colors.neutrals.dark,
    marginLeft: 12,
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  appInfoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.neutrals.dark,
    marginBottom: 4,
  },
  appInfoSubtitle: {
    fontSize: 12,
    color: colors.neutrals.gray,
    marginBottom: 2,
  },
});

export default HelpSupport;
