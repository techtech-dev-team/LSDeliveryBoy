import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const Register = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Phone, 2: Basic Info, 3: ID Upload, 4: Approval
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    otp: '',
    fullName: '',
    address: '',
    emergencyContact: '',
    selectedVehicle: 'Bike',
    vehicleNumber: '',
    password: '',
    confirmPassword: '',
    idProofUploaded: false
  });

  const vehicleTypes = [
    { id: 'Bike', name: 'Bike', icon: 'bicycle-outline' },
    { id: 'Car', name: 'Car', icon: 'car-outline' },
    { id: 'Auto', name: 'Auto', icon: 'bus-outline' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePhoneStep = () => {
    if (!formData.phoneNumber.trim() || formData.phoneNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return false;
    }
    return true;
  };

  const validateOtp = () => {
    if (!formData.otp.trim() || formData.otp.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit OTP');
      return false;
    }
    // Simulate OTP validation (in real app, verify with backend)
    if (formData.otp !== '1234') {
      Alert.alert('Error', 'Invalid OTP. Please try again.');
      return false;
    }
    return true;
  };

  const validateBasicInfoStep = () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    if (!formData.address.trim()) {
      Alert.alert('Error', 'Please enter your address');
      return false;
    }
    if (!formData.emergencyContact.trim()) {
      Alert.alert('Error', 'Please enter emergency contact');
      return false;
    }
    if (!formData.vehicleNumber.trim()) {
      Alert.alert('Error', 'Please enter your vehicle number');
      return false;
    }
    if (!formData.password.trim() || formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validatePhoneStep()) {
        setShowOtpModal(true);
      }
    } else if (currentStep === 2) {
      if (validateBasicInfoStep()) {
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      if (formData.idProofUploaded) {
        setCurrentStep(4);
      } else {
        Alert.alert('Error', 'Please upload your ID proof');
      }
    }
  };

  const handleOtpVerification = () => {
    if (validateOtp()) {
      setShowOtpModal(false);
      setCurrentStep(2);
      Alert.alert('Success', 'Phone number verified successfully!');
    }
  };

  const handleUploadIdProof = () => {
    Alert.alert(
      'Upload ID Proof',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => simulateUpload() },
        { text: 'Gallery', onPress: () => simulateUpload() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const simulateUpload = () => {
    setFormData(prev => ({ ...prev, idProofUploaded: true }));
    Alert.alert('Success', 'ID Proof uploaded successfully!');
  };

  const renderPhoneStep = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Phone Verification</Text>
        <Text style={styles.stepSubtitle}>We'll send you a verification code</Text>
      </View>

      <View style={styles.inputSection}>
        <View style={styles.phoneContainer}>
          <Text style={styles.countryCode}>+91</Text>
          <TextInput
            style={styles.phoneInput}
            value={formData.phoneNumber}
            onChangeText={(text) => handleInputChange('phoneNumber', text.replace(/[^0-9]/g, ''))}
            placeholder="Phone number"
            placeholderTextColor="#A0A0A0"
            keyboardType="numeric"
            maxLength={10}
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderBasicInfoStep = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Personal Details</Text>
        <Text style={styles.stepSubtitle}>Help us know you better</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputSection}>
          <TextInput
            style={styles.textInput}
            value={formData.fullName}
            onChangeText={(text) => handleInputChange('fullName', text)}
            placeholder="Full name"
            placeholderTextColor="#A0A0A0"
          />
        </View>

        <View style={styles.inputSection}>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={formData.address}
            onChangeText={(text) => handleInputChange('address', text)}
            placeholder="Address"
            placeholderTextColor="#A0A0A0"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputSection}>
          <TextInput
            style={styles.textInput}
            value={formData.emergencyContact}
            onChangeText={(text) => handleInputChange('emergencyContact', text.replace(/[^0-9]/g, ''))}
            placeholder="Emergency contact"
            placeholderTextColor="#A0A0A0"
            keyboardType="numeric"
            maxLength={10}
          />
        </View>

        <View style={styles.inputSection}>
          <TextInput
            style={styles.textInput}
            value={formData.vehicleNumber}
            onChangeText={(text) => handleInputChange('vehicleNumber', text.toUpperCase())}
            placeholder="Vehicle number"
            placeholderTextColor="#A0A0A0"
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputSection}>
          <TextInput
            style={styles.textInput}
            value={formData.password}
            onChangeText={(text) => handleInputChange('password', text)}
            placeholder="Set password"
            placeholderTextColor="#A0A0A0"
            secureTextEntry
          />
        </View>

        <View style={styles.inputSection}>
          <TextInput
            style={styles.textInput}
            value={formData.confirmPassword}
            onChangeText={(text) => handleInputChange('confirmPassword', text)}
            placeholder="Confirm password"
            placeholderTextColor="#A0A0A0"
            secureTextEntry
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderIdUploadStep = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Identity Verification</Text>
        <Text style={styles.stepSubtitle}>Upload your ID document</Text>
      </View>

      <View style={styles.uploadSection}>
        <TouchableOpacity style={styles.uploadButton} onPress={handleUploadIdProof}>
          {!formData.idProofUploaded ? (
            <>
              <Ionicons name="cloud-upload-outline" size={32} color="#A0A0A0" />
              <Text style={styles.uploadButtonText}>Upload Document</Text>
              <Text style={styles.uploadSubtext}>
                Aadhar Card or Driving License
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
              <Text style={[styles.uploadButtonText, { color: '#4CAF50' }]}>
                Document Uploaded
              </Text>
              <Text style={styles.uploadSubtext}>
                Ready for verification
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderApprovalStep = () => (
    <View style={styles.content}>
      <View style={[styles.stepHeader, styles.centerContent]}>
        <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
        <Text style={styles.stepTitle}>All Set!</Text>
        <Text style={styles.stepSubtitle}>
          We'll review your application and get back to you within 24 hours
        </Text>
      </View>

      <View style={styles.statusList}>
        <View style={styles.statusItem}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Phone verified</Text>
        </View>
        <View style={styles.statusItem}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Details collected</Text>
        </View>
        <View style={styles.statusItem}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Document uploaded</Text>
        </View>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderPhoneStep();
      case 2:
        return renderBasicInfoStep();
      case 3:
        return renderIdUploadStep();
      case 4:
        return renderApprovalStep();
      default:
        return renderPhoneStep();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* OTP Modal */}
      <Modal
        visible={showOtpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOtpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter OTP</Text>
              <Text style={styles.modalSubtitle}>
                We've sent a 4-digit code to +91{formData.phoneNumber}
              </Text>
            </View>
            
            <View style={styles.otpContainer}>
              <TextInput
                style={styles.otpInput}
                value={formData.otp}
                onChangeText={(text) => handleInputChange('otp', text.replace(/[^0-9]/g, ''))}
                placeholder="Enter OTP"
                placeholderTextColor="#A0A0A0"
                keyboardType="numeric"
                maxLength={4}
                autoFocus
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.verifyButton}
                onPress={handleOtpVerification}
              >
                <Text style={styles.verifyButtonText}>Verify</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelOtpButton}
                onPress={() => setShowOtpModal(false)}
              >
                <Text style={styles.cancelOtpButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.resendButton}>
              <Text style={styles.resendButtonText}>Resend OTP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (currentStep > 1) {
              setCurrentStep(currentStep - 1);
            } else {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      {currentStep < 4 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressDots}>
            {[1, 2, 3].map((step) => (
              <View
                key={step}
                style={[
                  styles.progressDot,
                  currentStep >= step && styles.progressDotActive
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {renderStepContent()}

      {/* Next/Action Button */}
      {currentStep < 4 && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentStep === 1 ? 'Verify Phone' : 
               currentStep === 2 ? 'Continue' : 
               'Submit'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {currentStep === 4 && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.nextButton} 
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.nextButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 6,
  },
  progressDotActive: {
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  stepHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    marginBottom: 20,
  },
  centerContent: {
    justifyContent: 'center',
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#1a1a1a',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '400',
  },
  formContainer: {
    flex: 1,
  },
  inputSection: {
    marginBottom: 24,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  countryCode: {
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 16,
    paddingRight: 12,
    fontWeight: '400',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 16,
    fontWeight: '400',
  },
  textInput: {
    fontSize: 16,
    color: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 16,
    paddingHorizontal: 4,
    fontWeight: '400',
  },
  multilineInput: {
    height: 80,
  },
  vehicleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  vehicleOption: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  selectedVehicle: {
    borderBottomColor: '#1a1a1a',
  },
  vehicleText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontWeight: '400',
  },
  selectedVehicleText: {
    color: '#1a1a1a',
  },
  uploadSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  uploadButton: {
    paddingVertical: 40,
    paddingHorizontal: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 25,
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '400',
    marginTop: 12,
    textAlign: 'center',
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  uploadedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  uploadedText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 8,
    fontWeight: '400',
  },
  infoBox: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  statusList: {
    paddingVertical: 20,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
    fontWeight: '400',
  },
  approvalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  approvalText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
    fontWeight: '400',
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingBottom: 30,
    paddingTop: 32,
  },
  nextButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  homeButton: {
    backgroundColor: '#666',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '400',
    color: 'white',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
    padding: 32,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#1a1a1a',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '400',
  },
  otpContainer: {
    marginBottom: 32,
  },
  otpInput: {
    fontSize: 20,
    color: '#1a1a1a',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 16,
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 4,
  },
  modalButtons: {
    marginBottom: 20,
  },
  verifyButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '400',
    color: 'white',
  },
  cancelOtpButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelOtpButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
});

export default Register;