import React, { useState, useEffect } from 'react';
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
  View,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker, Circle } from 'react-native-maps';
import { authAPI, formatRegistrationData } from '../utils/auth';
import { colors, typography } from '../components/colors';

const Register = ({ navigation }) => {
  // Registration flow: 1: Phone, 2: Basic Info, 3: Location & Service Area
  const [currentStep, setCurrentStep] = useState(1);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showServiceAreaModal, setShowServiceAreaModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState('otp'); // 'otp' or 'password'
  const [deliveryPartner, setDeliveryPartner] = useState('lalaji_network'); // 'lalaji_network' or 'vendor_self'
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [serviceArea, setServiceArea] = useState({
    center: null,
    radius: 5 // default 5km radius
  });
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const [formData, setFormData] = useState({
    phoneNumber: '',
    otp: '',
    verificationPassword: '',
    fullName: '',
    email: '',
    emergencyContact: '',
    selectedVehicle: 'motorcycle',
    vehicleNumber: '',
    password: '',
    confirmPassword: '',
    
    // Location data
    coordinates: null,
    address: '',
    serviceAreas: [],
    
    // Vendor connection
    deliveryPartner: 'lalaji_network',
    vendorDeliveryId: '', // For joining vendor team
    
    // Basic professional info
    experienceYears: '0'
  });

  const vehicleTypes = [
    { id: 'motorcycle', name: 'Motorcycle', icon: 'bicycle-outline' },
    { id: 'scooter', name: 'Scooter', icon: 'bicycle' },
    { id: 'bicycle', name: 'Bicycle', icon: 'bicycle' },
    { id: 'car', name: 'Car', icon: 'car-outline' }
  ];

  const deliveryPartnerOptions = [
    { 
      id: 'lalaji_network', 
      name: 'Lalaji Network', 
      description: 'Join our delivery network and get orders from multiple vendors',
      icon: 'globe-outline'
    },
    { 
      id: 'vendor_self', 
      name: 'Vendor Team', 
      description: 'Join a specific vendor\'s delivery team using their code',
      icon: 'business-outline'
    }
  ];

  // Location functions
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Location permission error:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setCurrentLocation(newLocation);
      
      // Get address from coordinates
      const addressResult = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (addressResult.length > 0) {
        const addr = addressResult[0];
        const fullAddress = `${addr.street || ''} ${addr.name || ''}, ${addr.city || ''}, ${addr.region || ''} ${addr.postalCode || ''}`.trim();
        setAddress(fullAddress);
      }
    } catch (error) {
      console.error('Get location error:', error);
      Alert.alert('Location Error', 'Unable to get your current location. Please set it manually.');
    }
  };

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
    if (formData.email && formData.email.trim() !== '') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        Alert.alert('Error', 'Please enter a valid email address');
        return false;
      }
    }
    if (!formData.emergencyContact.trim() || formData.emergencyContact.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit emergency contact number');
      return false;
    }
    if (!formData.vehicleNumber.trim() || formData.vehicleNumber.length < 6) {
      Alert.alert('Error', 'Please enter a valid vehicle number (minimum 6 characters)');
      return false;
    }
    if (formData.deliveryPartner === 'vendor_self' && !formData.vendorDeliveryId.trim()) {
      Alert.alert('Error', 'Please enter the vendor delivery code to join their team');
      return false;
    }
    return true;
  };

  const validateLocationStep = () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select your location on the map');
      return false;
    }
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter your address');
      return false;
    }
    if (serviceArea.center === null) {
      Alert.alert('Error', 'Please set your service area');
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
    
    return true;
  };

  const validateBankDetailsStep = () => {
    // Check if any bank details are provided
    const hasAnyBankDetails = formData.accountNumber || formData.ifsc || formData.upiId || formData.accountHolderName;
    
    // If no bank details are provided, ask for confirmation
    if (!hasAnyBankDetails) {
      Alert.alert(
        'Skip Bank Details?',
        'You can add bank details later in your profile. Continue without bank details?',
        [
          {
            text: 'Add Now',
            style: 'cancel'
          },
          {
            text: 'Skip',
            onPress: () => {
              // Allow skipping
              handleRegistration();
            }
          }
        ]
      );
      return false; // Don't proceed with normal flow
    }
    
    // Validate bank details if provided
    if (formData.accountNumber && formData.accountNumber.trim() !== '') {
      const accountNum = formData.accountNumber.replace(/[^0-9]/g, ''); // Remove non-numeric characters
      if (accountNum.length < 9 || accountNum.length > 18) {
        Alert.alert('Error', 'Account number must be between 9 and 18 digits');
        return false;
      }
      // Update the form data with cleaned account number
      handleInputChange('accountNumber', accountNum);
    }
    
    if (formData.ifsc && formData.ifsc.trim() !== '' && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc)) {
      Alert.alert('Error', 'Please enter a valid IFSC code');
      return false;
    }
    if (formData.upiId && formData.upiId.trim() !== '' && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(formData.upiId)) {
      Alert.alert('Error', 'Please enter a valid UPI ID');
      return false;
    }
    if (formData.panNumber && formData.panNumber.trim() !== '' && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
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
        setTimeout(() => {
          setLoading(false);
          setShowOtpModal(true);
        }, 1000);
      } else {
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
    if (validateLocationStep()) {
      setCurrentStep(4); // Move to document upload instead of registration
    }
  } else if (currentStep === 4) {
    if (validateDocumentStep()) {
      setCurrentStep(5); // Move to bank details
    }
  } else if (currentStep === 5) {
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
    
    try {
      // Prepare registration data with location and service area
      const registrationData = {
        ...formatRegistrationData(formData),
        coordinates: selectedLocation,
        address: address,
        serviceAreas: [{
          coordinates: serviceArea.center,
          radius: serviceArea.radius
        }],
        deliveryPartner: formData.deliveryPartner,
        vendorDeliveryId: formData.deliveryPartner === 'vendor_self' ? formData.vendorDeliveryId : undefined
      };
      
      console.log('Submitting registration data:', registrationData);
      
      // Call the registration API
      const result = await authAPI.registerDeliveryBoy(registrationData);
      
      if (result.success) {
        Alert.alert(
          'Success', 
          result.message || 'Registration completed successfully!', 
          [
            {
              text: 'Login',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        // Handle API error response with more detailed information
        let errorMessage = result.error || 'Registration failed';
        
        // Add status code information if available
        if (result.status) {
          errorMessage = `Error ${result.status}: ${errorMessage}`;
        }
        
        // If there are validation details, show them
        if (result.details && result.details.length > 0) {
          const fieldErrors = result.details.map(detail => 
            `• ${detail.field}: ${detail.message}`
          ).join('\n');
          errorMessage = `${errorMessage}\n\nValidation Issues:\n${fieldErrors}`;
        }
        
        Alert.alert('Registration Failed', errorMessage, [
          {
            text: 'OK',
            onPress: () => {
              // If there are field validation errors, go back to step 1 to fix them
              if (result.details && result.details.some(d => ['name', 'phoneNumber', 'authMethod', 'password', 'firebaseToken'].includes(d.field))) {
                setCurrentStep(1);
              }
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Error', 
        'An unexpected error occurred during registration. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Location selection functions
  const handleMapPress = async (event) => {
    const coordinate = event.nativeEvent.coordinate;
    setSelectedLocation(coordinate);
    
    try {
      const addressResult = await Location.reverseGeocodeAsync(coordinate);
      if (addressResult.length > 0) {
        const addr = addressResult[0];
        const fullAddress = `${addr.street || ''} ${addr.name || ''}, ${addr.city || ''}, ${addr.region || ''} ${addr.postalCode || ''}`.trim();
        setAddress(fullAddress);
        handleInputChange('address', fullAddress);
        handleInputChange('coordinates', coordinate);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const handleServiceAreaSelect = (coordinate) => {
    setServiceArea({
      center: coordinate,
      radius: serviceArea.radius
    });
  };

  const updateServiceRadius = (radius) => {
    setServiceArea(prev => ({
      ...prev,
      radius: radius
    }));
  };

  // Location search function
  const searchLocation = async (query) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await Location.geocodeAsync(query);
      const formattedResults = await Promise.all(
        results.slice(0, 5).map(async (result) => {
          try {
            const address = await Location.reverseGeocodeAsync({
              latitude: result.latitude,
              longitude: result.longitude,
            });
            const addr = address[0];
            const fullAddress = `${addr.street || ''} ${addr.name || ''}, ${addr.city || ''}, ${addr.region || ''}`.trim();
            return {
              ...result,
              formattedAddress: fullAddress || query,
            };
          } catch {
            return {
              ...result,
              formattedAddress: query,
            };
          }
        })
      );
      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const selectSearchResult = (result) => {
    const newLocation = {
      latitude: result.latitude,
      longitude: result.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setSelectedLocation(newLocation);
    setAddress(result.formattedAddress);
    handleInputChange('address', result.formattedAddress);
    handleInputChange('coordinates', newLocation);
    setSearchQuery('');
    setSearchResults([]);
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
      return renderLocationStep();
    case 4:
      return renderDocumentStep();
    case 5:
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
        {/* Personal Information */}
        <View style={styles.compactFormSection}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.compactInput}
              value={formData.fullName}
              onChangeText={(text) => handleInputChange('fullName', text)}
              placeholder="Full name"
              placeholderTextColor="#A0A0A0"
            />
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.compactInput}
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text.trim())}
              placeholder="Email (optional)"
              placeholderTextColor="#A0A0A0"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.compactInput}
              value={formData.emergencyContact}
              onChangeText={(text) => handleInputChange('emergencyContact', text.replace(/[^0-9]/g, ''))}
              placeholder="Emergency contact"
              placeholderTextColor="#A0A0A0"
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.compactInput}
              value={formData.vehicleNumber}
              onChangeText={(text) => handleInputChange('vehicleNumber', text.toUpperCase())}
              placeholder="Vehicle number"
              placeholderTextColor="#A0A0A0"
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Delivery Partner Selection */}
        <View style={styles.compactSection}>
          <Text style={styles.compactSectionTitle}>Delivery Partner</Text>
          <View style={styles.compactOptionsContainer}>
            {deliveryPartnerOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.compactOption,
                  formData.deliveryPartner === option.id && styles.selectedCompactOption
                ]}
                onPress={() => {
                  setDeliveryPartner(option.id);
                  handleInputChange('deliveryPartner', option.id);
                }}
              >
                <Ionicons 
                  name={option.icon} 
                  size={18} 
                  color={formData.deliveryPartner === option.id ? '#fff' : '#1a1a1a'} 
                />
                <View style={styles.compactOptionTextContainer}>
                  <Text style={[
                    styles.compactOptionTitle,
                    formData.deliveryPartner === option.id && styles.selectedCompactOptionText
                  ]}>
                    {option.name}
                  </Text>
                  <Text style={[
                    styles.compactOptionDescription,
                    formData.deliveryPartner === option.id && styles.selectedCompactOptionText
                  ]}>
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Vendor Code Input */}
          {formData.deliveryPartner === 'vendor_self' && (
            <View style={styles.vendorCodeInput}>
              <TextInput
                style={styles.compactInput}
                value={formData.vendorDeliveryId}
                onChangeText={(text) => handleInputChange('vendorDeliveryId', text.toUpperCase())}
                placeholder="Vendor Code (e.g., VD1234)"
                placeholderTextColor="#A0A0A0"
                autoCapitalize="characters"
              />
              <Text style={styles.simpleHelperText}>
                Get this code from your vendor
              </Text>
            </View>
          )}
        </View>

        {/* Vehicle Type Selection */}
        <View style={styles.compactSection}>
          <Text style={styles.compactSectionTitle}>Vehicle Type</Text>
          <View style={styles.vehicleOptionsGrid}>
            {vehicleTypes.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.compactVehicleOption,
                  formData.selectedVehicle === vehicle.id && styles.selectedCompactVehicle
                ]}
                onPress={() => handleInputChange('selectedVehicle', vehicle.id)}
              >
                <Ionicons 
                  name={vehicle.icon} 
                  size={20} 
                  color={formData.selectedVehicle === vehicle.id ? '#fff' : '#1a1a1a'} 
                />
                <Text style={[
                  styles.compactVehicleText,
                  formData.selectedVehicle === vehicle.id && styles.selectedCompactVehicleText
                ]}>
                  {vehicle.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderLocationStep = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Location & Service Area</Text>
        <Text style={styles.stepSubtitle}>Set your location and service area for deliveries</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Address Input */}
        <View style={styles.inputSection}>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your address"
            placeholderTextColor="#A0A0A0"
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>

        {/* Location Actions */}
        <View style={styles.locationActionsContainer}>
          <TouchableOpacity
            style={styles.locationActionButton}
            onPress={() => setShowLocationModal(true)}
          >
            <Ionicons name="location-outline" size={18} color="#1a1a1a" />
            <Text style={styles.locationActionText}>
              {selectedLocation ? 'Update Location' : 'Select on Map'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.locationActionButton}
            onPress={getCurrentLocation}
          >
            <Ionicons name="locate" size={18} color="#1a1a1a" />
            <Text style={styles.locationActionText}>Current Location</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Location Status */}
        {selectedLocation && (
          <View style={styles.statusContainer}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.statusText}>Location selected</Text>
          </View>
        )}

        {/* Service Area */}
        <View style={styles.serviceAreaContainer}>
          <View style={styles.serviceAreaHeader}>
            <Text style={styles.sectionTitle}>Service Area</Text>
            <TouchableOpacity
              style={styles.setServiceAreaButton}
              onPress={() => setShowServiceAreaModal(true)}
            >
              <Ionicons name="map-outline" size={16} color="#1a1a1a" />
              <Text style={styles.setServiceAreaText}>
                {serviceArea.center ? 'Update' : 'Set Area'}
              </Text>
            </TouchableOpacity>
          </View>

          {serviceArea.center && (
            <View style={styles.serviceAreaDetails}>
              <View style={styles.serviceAreaStatus}>
                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                <Text style={styles.serviceAreaStatusText}>
                  {serviceArea.radius}km radius set
                </Text>
              </View>
              
              <View style={styles.radiusControls}>
                <TouchableOpacity
                  style={styles.radiusButton}
                  onPress={() => updateServiceRadius(Math.max(1, serviceArea.radius - 1))}
                >
                  <Text style={styles.radiusButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.radiusValue}>{serviceArea.radius}km</Text>
                <TouchableOpacity
                  style={styles.radiusButton}
                  onPress={() => updateServiceRadius(Math.min(20, serviceArea.radius + 1))}
                >
                  <Text style={styles.radiusButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );

  // Location Modal
  const renderLocationModal = () => (
    <Modal
      visible={showLocationModal}
      animationType="slide"
      onRequestClose={() => setShowLocationModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowLocationModal(false)}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select Your Location</Text>
          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={() => {
              if (selectedLocation) {
                setShowLocationModal(false);
              } else {
                Alert.alert('Error', 'Please tap on the map to select your location');
              }
            }}
          >
            <Text style={styles.modalSaveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
        
        {currentLocation && (
          <MapView
            style={styles.fullMap}
            initialRegion={selectedLocation || currentLocation}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                title="Your Location"
                description="This will be your registered address"
              />
            )}
          </MapView>
        )}
        
        {!currentLocation && (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>Loading map...</Text>
          </View>
        )}

        {/* Bottom Search Drawer */}
        <View style={styles.bottomDrawer}>
          <View style={styles.drawerHandle}>
            <View style={styles.drawerBar} />
          </View>
          
          <Text style={styles.drawerTitle}>Find Location</Text>
          
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                searchLocation(text);
              }}
              placeholder="Search for a location..."
              placeholderTextColor="#999"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map((result, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.searchResultItem}
                  onPress={() => selectSearchResult(result)}
                >
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.searchResultText} numberOfLines={2}>
                    {result.formattedAddress}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.mapInstructions}>
            Search above or tap anywhere on the map to select your location
          </Text>
        </View>
      </View>
    </Modal>
  );

  // Service Area Modal
  const renderServiceAreaModal = () => (
    <Modal
      visible={showServiceAreaModal}
      animationType="slide"
      onRequestClose={() => setShowServiceAreaModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowServiceAreaModal(false)}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Set Service Area</Text>
          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={() => {
              if (serviceArea.center) {
                setShowServiceAreaModal(false);
              } else {
                Alert.alert('Error', 'Please tap on the map to set your service area center');
              }
            }}
          >
            <Text style={styles.modalSaveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {(currentLocation || selectedLocation) && (
          <MapView
            style={styles.fullMap}
            initialRegion={selectedLocation || currentLocation}
            onPress={(event) => handleServiceAreaSelect(event.nativeEvent.coordinate)}
            showsUserLocation={true}
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                title="Your Location"
                pinColor="blue"
              />
            )}
            {serviceArea.center && (
              <>
                <Marker
                  coordinate={serviceArea.center}
                  title="Service Area Center"
                  pinColor="green"
                />
                <Circle
                  center={serviceArea.center}
                  radius={serviceArea.radius * 1000} // Convert km to meters
                  strokeColor="rgba(0, 122, 255, 0.5)"
                  fillColor="rgba(0, 122, 255, 0.1)"
                />
              </>
            )}
          </MapView>
        )}
        
        {!(currentLocation || selectedLocation) && (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>Loading map...</Text>
          </View>
        )}

        {/* Bottom Search Drawer */}
        <View style={styles.bottomDrawer}>
          <View style={styles.drawerHandle}>
            <View style={styles.drawerBar} />
          </View>
          
          <Text style={styles.drawerTitle}>Set Service Area</Text>
          
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                searchLocation(text);
              }}
              placeholder="Search for service area center..."
              placeholderTextColor="#999"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map((result, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.searchResultItem}
                  onPress={() => {
                    const coordinate = {
                      latitude: result.latitude,
                      longitude: result.longitude,
                    };
                    handleServiceAreaSelect(coordinate);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.searchResultText} numberOfLines={2}>
                    {result.formattedAddress}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Service Area Controls */}
          <View style={styles.serviceAreaControls}>
            <View style={styles.radiusControl}>
              <Text style={styles.radiusControlLabel}>Service Radius: {serviceArea.radius}km</Text>
              <View style={styles.radiusButtons}>
                <TouchableOpacity
                  style={styles.radiusButton}
                  onPress={() => updateServiceRadius(Math.max(1, serviceArea.radius - 1))}
                >
                  <Text style={styles.radiusButtonText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radiusButton}
                  onPress={() => updateServiceRadius(Math.min(20, serviceArea.radius + 1))}
                >
                  <Text style={styles.radiusButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={styles.mapInstructions}>
            Search above or tap on the map to set your service area center
          </Text>
        </View>
      </View>
    </Modal>
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
          onChangeText={(text) => handleInputChange('panNumber', text.toUpperCase())}
          placeholder="Enter your PAN number"
          placeholderTextColor="#999"
          autoCapitalize="characters"
          maxLength={10}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Aadhar Number</Text>
        <TextInput
          style={styles.input}
          value={formData.aadharNumber}
          onChangeText={(text) => handleInputChange('aadharNumber', text.replace(/[^0-9]/g, ''))}
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
          onChangeText={(text) => handleInputChange('licenseNumber', text)}
          placeholder="Enter your driving license number"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Years of Experience</Text>
        <TextInput
          style={styles.input}
          value={formData.experienceYears}
          onChangeText={(text) => handleInputChange('experienceYears', text.replace(/[^0-9]/g, ''))}
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
        <Text style={styles.stepSubtitle}>Add your bank account for payments (Optional)</Text>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color="#666" />
        <Text style={styles.infoText}>
          You can skip this step and add your bank details later in your profile settings.
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Account Holder Name</Text>
        <TextInput
          style={styles.input}
          value={formData.accountHolderName}
          onChangeText={(text) => handleInputChange('accountHolderName', text.trim())}
          placeholder="Enter account holder name"
          placeholderTextColor="#999"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Account Number</Text>
        <TextInput
          style={styles.input}
          value={formData.accountNumber}
          onChangeText={(text) => handleInputChange('accountNumber', text.replace(/[^0-9]/g, ''))}
          placeholder="Enter your account number"
          placeholderTextColor="#999"
          keyboardType="numeric"
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>IFSC Code</Text>
        <TextInput
          style={styles.input}
          value={formData.ifsc}
          onChangeText={(text) => handleInputChange('ifsc', text.trim().toUpperCase())}
          placeholder="Enter IFSC code"
          placeholderTextColor="#999"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={11}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>UPI ID (Optional)</Text>
        <TextInput
          style={styles.input}
          value={formData.upiId}
          onChangeText={(text) => handleInputChange('upiId', text.trim())}
          placeholder="Enter your UPI ID"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
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
      {currentStep <= 3 && (
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
      {currentStep <= 5 && (
        <View style={styles.buttonContainer}>
          {currentStep === 5 ? (
            <>
<TouchableOpacity 
  style={[styles.nextButton, loading && styles.nextButtonDisabled]} 
  onPress={handleNext}
  disabled={loading}
>
  <Text style={styles.nextButtonText}>
    {loading && currentStep === 5 
      ? 'Completing Registration...'
      : currentStep === 1 
        ? (verificationMethod === 'otp' ? 'Send OTP' : 'Continue with Password')
        : currentStep === 2 ? 'Continue'
        : currentStep === 3 ? 'Continue'
        : currentStep === 4 ? 'Continue'
        : 'Complete Registration'}
  </Text>
</TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.nextButton, styles.skipButton]} 
                onPress={handleRegistration}
                disabled={loading}
              >
                <Text style={[styles.nextButtonText, styles.skipButtonText]}>
                  Skip Bank Details
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={[styles.nextButton, loading && styles.nextButtonDisabled]} 
              onPress={handleNext}
              disabled={loading}
            >
              <Text style={styles.nextButtonText}>
                {loading && currentStep === 3 
                  ? 'Completing Registration...'
                  : currentStep === 1 
                    ? (verificationMethod === 'otp' ? 'Send OTP' : 'Continue with Password')
                    : currentStep === 2 ? 'Continue' 
                    : 'Complete Registration'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Location Modal */}
      {renderLocationModal()}

      {/* Service Area Modal */}
      {renderServiceAreaModal()}

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
    fontFamily: typography.fontFamily.regular,
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
    fontFamily: typography.fontFamily.regular,
    color: '#1a1a1a',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: typography.fontFamily.regular,
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
    fontFamily: typography.fontFamily.regular,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 16,
    fontFamily: typography.fontFamily.regular,
  },
  textInput: {
    fontSize: 16,
    color: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 16,
    paddingHorizontal: 4,
    fontFamily: typography.fontFamily.regular,
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
    fontFamily: typography.fontFamily.regular,
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
    fontFamily: typography.fontFamily.regular,
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
  nextButtonDisabled: {
    backgroundColor: '#999',
    opacity: 0.7,
  },
  homeButton: {
    backgroundColor: '#666',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '400',
    color: 'white',
  },
  skipButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  skipButtonText: {
    color: '#666',
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
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontWeight: '400',
  },
  locationActionsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  locationActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  locationActionText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginLeft: 6,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9f0',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 6,
    fontWeight: '500',
  },
  serviceAreaContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 20,
  },
  serviceAreaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  setServiceAreaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  setServiceAreaText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginLeft: 4,
    fontWeight: '500',
  },
  serviceAreaDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  serviceAreaStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceAreaStatusText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  radiusControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
    marginHorizontal: 20,
    minWidth: 50,
    textAlign: 'center',
  },
  compactFormSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  compactSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  compactSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  inputRow: {
    marginBottom: 12,
  },
  compactInput: {
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e9ecef',
    fontWeight: '400',
  },
  compactOptionsContainer: {
    marginBottom: 12,
  },
  compactOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCompactOption: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  compactOptionTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  compactOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  compactOptionDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  selectedCompactOptionText: {
    color: '#fff',
  },
  vendorCodeInput: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  simpleHelperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    fontStyle: 'italic',
  },
  vehicleOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  compactVehicleOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    width: '48%',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  },
  selectedCompactVehicle: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  compactVehicleText: {
    fontSize: 13,
    color: '#1a1a1a',
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedCompactVehicleText: {
    color: '#fff',
  },
  // Legacy styles for fallback
  deliveryPartnerContainer: {
    marginBottom: 16,
  },
  partnerOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedPartnerOption: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  partnerOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  partnerOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  partnerOptionDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  selectedPartnerOptionText: {
    color: '#fff',
  },
  vehicleTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  vehicleOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    width: '48%',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  },
  selectedVehicleOption: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  vehicleOptionText: {
    fontSize: 13,
    color: '#1a1a1a',
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedVehicleOptionText: {
    color: '#fff',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    fontStyle: 'italic',
  },
  locationSection: {
    marginBottom: 24,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mapButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  selectedLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  selectedLocationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
    fontWeight: '400',
  },
  serviceAreaSection: {
    marginTop: 24,
  },
  serviceAreaInfo: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  serviceAreaDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceAreaText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
    fontWeight: '400',
  },
  radiusSlider: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radiusLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  radiusButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radiusButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  radiusButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  currentLocationButtonText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 45,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  modalSaveButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalSaveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  mapInstructions: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mapPlaceholder: {
    height: 300,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  // Map styles
  map: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
  },
  fullMap: {
    flex: 1,
  },
  bottomDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 34, // Extra padding for home indicator
    maxHeight: '50%',
  },
  drawerHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  drawerBar: {
    width: 40,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 8,
    marginRight: 8,
  },
  searchResults: {
    maxHeight: 150,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 12,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  serviceAreaControls: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
  },
  radiusControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  radiusControlLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});

export default Register;