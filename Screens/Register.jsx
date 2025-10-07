import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { RegisterAPI } from '../Utils/Register';

const Register = ({ navigation }) => {
  // Registration flow: 1: Phone, 2: Basic Info, 3: Documents, 4: Bank Details
  const [currentStep, setCurrentStep] = useState(1);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState('otp'); // 'otp' or 'password'
  const [formData, setFormData] = useState({
    phoneNumber: '',
    otp: '',
    verificationPassword: '', // For phone verification
    fullName: '',
    email: '',
    address: '',
    emergencyContact: '',
    selectedVehicle: 'Bike',
    vehicleNumber: '',
    password: '',
    confirmPassword: '',
    // New fields for API compliance
    panNumber: '',
    aadharNumber: '',
    experienceYears: '0',
    experienceDescription: '',
    accountNumber: '',
    ifsc: '',
    upiId: '',
    accountHolderName: '',
    // Document uploads
    idProofUploaded: false,
    addressProofUploaded: false,
    vehicleDocumentUploaded: false,
    idProofImage: null
  });

  const vehicleTypes = [
    { id: 'Bike', name: 'Bike', icon: 'bicycle-outline' },
    { id: 'Car', name: 'Car', icon: 'car-outline' },
    { id: 'Auto', name: 'Auto', icon: 'bus-outline' },
    { id: 'Bicycle', name: 'Bicycle', icon: 'bicycle' }
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
    
    if (verificationMethod === 'password') {
      if (!formData.verificationPassword.trim() || formData.verificationPassword.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters long');
        return false;
      }
    }
    
    return true;
  };

  const validateOtp = () => {
    if (!formData.otp.trim() || formData.otp.length < 4) {
      Alert.alert('Error', 'Please enter a valid OTP');
      return false;
    }
    return true;
  };

  const validateBasicInfoStep = () => {
    if (!formData.fullName.trim() || formData.fullName.length < 2) {
      Alert.alert('Error', 'Please enter your full name (minimum 2 characters)');
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!formData.address.trim()) {
      Alert.alert('Error', 'Please enter your address');
      return false;
    }
    if (!formData.emergencyContact.trim() || formData.emergencyContact.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit emergency contact number');
      return false;
    }
    if (!formData.vehicleNumber.trim() || formData.vehicleNumber.length < 6) {
      Alert.alert('Error', 'Please enter a valid vehicle number (minimum 6 characters)');
      return false;
    }

    return true;
  };

  const validateDocumentStep = () => {
    if (!formData.idProofUploaded || !formData.idProofImage) {
      Alert.alert('Error', 'Please upload your ID proof image to continue');
      return false;
    }
    
    // Validate PAN number if provided
    if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
      Alert.alert('Error', 'Please enter a valid PAN number (e.g., ABCDE1234F)');
      return false;
    }
    
    // Validate Aadhar number if provided
    if (formData.aadharNumber && (formData.aadharNumber.length !== 12 || !/^\d{12}$/.test(formData.aadharNumber))) {
      Alert.alert('Error', 'Please enter a valid 12-digit Aadhar number');
      return false;
    }
    
    return true;
  };

  const validateBankDetailsStep = () => {
    if (formData.accountNumber && (formData.accountNumber.length < 9 || formData.accountNumber.length > 18)) {
      Alert.alert('Error', 'Account number must be between 9 and 18 digits');
      return false;
    }
    if (formData.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc)) {
      Alert.alert('Error', 'Please enter a valid IFSC code');
      return false;
    }
    if (formData.upiId && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(formData.upiId)) {
      Alert.alert('Error', 'Please enter a valid UPI ID');
      return false;
    }
    if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
      Alert.alert('Error', 'Please enter a valid PAN number');
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (validatePhoneStep()) {
        if (verificationMethod === 'otp') {
          setLoading(true);
          // Initiate Firebase phone verification
          const result = await RegisterAPI.verifyPhoneWithFirebase(`+91${formData.phoneNumber}`);
          setLoading(false);
          
          if (result.success) {
            setShowOtpModal(true);
          } else {
            Alert.alert('Error', result.error);
          }
        } else {
          // Password verification - skip OTP and go directly to next step
          Alert.alert('Success', 'Phone number and password saved successfully!', [
            {
              text: 'Continue',
              onPress: () => setCurrentStep(2)
            }
          ]);
        }
      }
    } else if (currentStep === 2) {
      if (validateBasicInfoStep()) {
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      if (validateDocumentStep()) {
        setCurrentStep(4);
      }
    } else if (currentStep === 4) {
      if (validateBankDetailsStep()) {
        await handleRegistration();
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

  const handleRegistration = async () => {
    setLoading(true);
    
    let firebaseToken = null;
    
    // Only use Firebase token for OTP verification
    if (verificationMethod === 'otp') {
      // For demo purposes, using a mock Firebase token
      // In production, this would come from Firebase Auth after OTP verification
      firebaseToken = 'mock_firebase_token_' + Date.now();
    }
    
    const result = await RegisterAPI.registerDeliveryBoy(formData, firebaseToken, verificationMethod);
    setLoading(false);
    
    if (result.success) {
      Alert.alert('Success', 'Registration completed successfully!', [
        {
          text: 'Login',
          onPress: () => navigation.navigate('Login')
        }
      ]);
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted' || cameraStatus.status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera and gallery permissions to upload your ID proof!');
      return false;
    }
    return true;
  };

  const pickImageFromCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setFormData(prev => ({ 
          ...prev, 
          idProofUploaded: true,
          idProofImage: imageUri
        }));
        Alert.alert('Success', 'ID Proof uploaded successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      console.error('Camera error:', error);
    }
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        const fileSize = result.assets[0].fileSize;
        
        // Check file size (5MB limit)
        if (fileSize && fileSize > 5 * 1024 * 1024) {
          Alert.alert('Error', 'Image size should be less than 5MB. Please choose a smaller image.');
          return;
        }

        setFormData(prev => ({ 
          ...prev, 
          idProofUploaded: true,
          idProofImage: imageUri
        }));
        Alert.alert('Success', 'ID Proof uploaded successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      console.error('Gallery error:', error);
    }
  };

  const handleUploadIdProof = () => {
    Alert.alert(
      'Upload ID Proof',
      'Choose an option',
      [
        { text: 'Camera', onPress: pickImageFromCamera },
        { text: 'Gallery', onPress: pickImageFromGallery },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const removeIdProof = () => {
    Alert.alert(
      'Remove ID Proof',
      'Are you sure you want to remove the uploaded ID proof?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setFormData(prev => ({ 
              ...prev, 
              idProofUploaded: false,
              idProofImage: null
            }));
          }
        }
      ]
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderPhoneStep();
      case 2:
        return renderBasicInfoStep();
      case 3:
        return renderDocumentStep();
      case 4:
        return renderBankDetailsStep();
      default:
        return renderPhoneStep();
    }
  };

  const renderPhoneStep = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Phone Verification</Text>
        <Text style={styles.stepSubtitle}>
          {verificationMethod === 'otp' 
            ? "We'll send you a verification code" 
            : "Enter your phone number and set a password"}
        </Text>
      </View>

      {/* Verification Method Selection */}
      <View style={styles.verificationMethodContainer}>
        <TouchableOpacity 
          style={[
            styles.methodButton, 
            verificationMethod === 'otp' && styles.selectedMethodButton
          ]}
          onPress={() => setVerificationMethod('otp')}
        >
          <Ionicons 
            name="mail-outline" 
            size={20} 
            color={verificationMethod === 'otp' ? '#fff' : '#666'} 
          />
          <Text style={[
            styles.methodButtonText,
            verificationMethod === 'otp' && styles.selectedMethodButtonText
          ]}>
            OTP Verification
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.methodButton, 
            verificationMethod === 'password' && styles.selectedMethodButton
          ]}
          onPress={() => setVerificationMethod('password')}
        >
          <Ionicons 
            name="lock-closed-outline" 
            size={20} 
            color={verificationMethod === 'password' ? '#fff' : '#666'} 
          />
          <Text style={[
            styles.methodButtonText,
            verificationMethod === 'password' && styles.selectedMethodButtonText
          ]}>
            Password Setup
          </Text>
        </TouchableOpacity>
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

      {/* Password field for password verification method */}
      {verificationMethod === 'password' && (
        <View style={styles.inputSection}>
          <TextInput
            style={styles.textInput}
            value={formData.verificationPassword}
            onChangeText={(text) => handleInputChange('verificationPassword', text)}
            placeholder="Create password for your account"
            placeholderTextColor="#A0A0A0"
            secureTextEntry
          />
        </View>
      )}
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
            style={styles.textInput}
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
            placeholder="Email (optional)"
            placeholderTextColor="#A0A0A0"
            keyboardType="email-address"
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





      </View>
    </ScrollView>
  );

  const renderDocumentStep = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Document Upload</Text>
        <Text style={styles.stepSubtitle}>Upload required documents for verification</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>PAN Number</Text>
        <TextInput
          style={styles.input}
          value={formData.panNumber}
          onChangeText={(text) => setFormData(prev => ({ ...prev, panNumber: text.toUpperCase() }))}
          placeholder="Enter your PAN number"
          placeholderTextColor="#999"
          maxLength={10}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Aadhar Number</Text>
        <TextInput
          style={styles.input}
          value={formData.aadharNumber}
          onChangeText={(text) => setFormData(prev => ({ ...prev, aadharNumber: text }))}
          placeholder="Enter your Aadhar number"
          placeholderTextColor="#999"
          keyboardType="numeric"
          maxLength={12}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>License Number</Text>
        <TextInput
          style={styles.input}
          value={formData.licenseNumber}
          onChangeText={(text) => setFormData(prev => ({ ...prev, licenseNumber: text }))}
          placeholder="Enter your driving license number"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Years of Experience</Text>
        <TextInput
          style={styles.input}
          value={formData.experienceYears}
          onChangeText={(text) => setFormData(prev => ({ ...prev, experienceYears: text }))}
          placeholder="Enter years of driving experience"
          placeholderTextColor="#999"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.documentUploadSection}>
        <Text style={styles.label}>Upload ID Proof *</Text>
        <Text style={styles.uploadHelper}>Upload Aadhar Card, PAN Card, or Driving License</Text>
        
        {!formData.idProofUploaded ? (
          <TouchableOpacity style={styles.uploadBox} onPress={handleUploadIdProof}>
            <Ionicons name="cloud-upload-outline" size={40} color="#999" />
            <Text style={styles.uploadText}>Tap to upload ID proof</Text>
            <Text style={styles.uploadSubtext}>JPG, PNG (Max 5MB)</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.uploadedContainer}>
            <View style={styles.imagePreview}>
              <Image source={{ uri: formData.idProofImage }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeButton} onPress={removeIdProof}>
                <Ionicons name="close-circle" size={24} color="#ff4444" />
              </TouchableOpacity>
            </View>
            <View style={styles.uploadSuccess}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.successText}>ID Proof uploaded successfully!</Text>
            </View>
            <TouchableOpacity style={styles.changeButton} onPress={handleUploadIdProof}>
              <Text style={styles.changeButtonText}>Change Image</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderBankDetailsStep = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Bank Details</Text>
        <Text style={styles.stepSubtitle}>Add your bank account for payments</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Bank Name</Text>
        <TextInput
          style={styles.input}
          value={formData.bankName}
          onChangeText={(text) => setFormData(prev => ({ ...prev, bankName: text }))}
          placeholder="Enter your bank name"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Account Holder Name</Text>
        <TextInput
          style={styles.input}
          value={formData.bankAccountHolderName}
          onChangeText={(text) => setFormData(prev => ({ ...prev, bankAccountHolderName: text }))}
          placeholder="Enter account holder name"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Account Number</Text>
        <TextInput
          style={styles.input}
          value={formData.bankAccountNumber}
          onChangeText={(text) => setFormData(prev => ({ ...prev, bankAccountNumber: text }))}
          placeholder="Enter your account number"
          placeholderTextColor="#999"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>IFSC Code</Text>
        <TextInput
          style={styles.input}
          value={formData.bankIFSC}
          onChangeText={(text) => setFormData(prev => ({ ...prev, bankIFSC: text.toUpperCase() }))}
          placeholder="Enter IFSC code"
          placeholderTextColor="#999"
          maxLength={11}
        />
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
    return renderStep();
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
      {currentStep <= 4 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressDots}>
            {[1, 2, 3, 4].map((step) => (
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
      {currentStep <= 4 && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentStep === 1 
                ? (verificationMethod === 'otp' ? 'Send OTP' : 'Continue with Password')
                : currentStep === 2 ? 'Continue' 
                : currentStep === 3 ? 'Continue'
                : 'Complete Registration'}
            </Text>
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
  uploadButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  verificationMethodContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    marginHorizontal: 16,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#f8f9fa',
  },
  selectedMethodButton: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  methodButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  selectedMethodButtonText: {
    color: '#fff',
  },
  documentUploadSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  uploadHelper: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
    marginTop: 4,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  uploadText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginTop: 12,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  uploadedContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 16,
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  uploadSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 8,
    fontWeight: '500',
  },
  changeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderRadius: 20,
  },
  changeButtonText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
});

export default Register;