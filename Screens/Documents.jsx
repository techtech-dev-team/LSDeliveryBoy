import React, { useState, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { authAPI } from '../utils/auth';
import { 
  DocumentTextIcon,
  CreditCardIcon,
  TruckIcon,
  IdentificationIcon,
  WalletIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  PhotoIcon
} from 'react-native-heroicons/outline';
import { colors, typography } from '../components/colors';

const { width, height } = Dimensions.get('window');

const Documents = ({ navigation, route }) => {
  const { userProfile } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [imageViewVisible, setImageViewVisible] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(null);
  const [refreshProfile, setRefreshProfile] = useState(false);
  const [documents, setDocuments] = useState({});

  console.log('📄 Documents - UserProfile:', JSON.stringify(userProfile, null, 2));
  console.log('📄 Documents - Documents array:', userProfile?.deliveryBoyInfo?.documents);
  console.log('📄 Documents - Documents by type:', userProfile?.deliveryBoyInfo?.documentsByType);

  // Load documents from profile or fetch fresh data
  useEffect(() => {
    const profileDocuments = userProfile?.deliveryBoyInfo?.documentsByType || {};
    setDocuments(profileDocuments);
    
    // If no documents by type but has general documents array, fetch fresh data
    if (Object.keys(profileDocuments).length === 0 && userProfile?.deliveryBoyInfo?.documents?.length > 0) {
      fetchDocuments();
    }
  }, [userProfile]);

  // Fetch documents from API
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const result = await authAPI.getDocuments();
      
      if (result.success && result.data) {
        setDocuments(result.data.documentsByType || {});
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Listen for route params changes (when returning from Camera)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if we have a captured photo from Camera
      const capturedPhoto = route.params?.capturedPhoto;
      const documentType = route.params?.documentType;
      
      if (capturedPhoto && documentType) {
        handlePhotoUpload(capturedPhoto, documentType);
        // Clear the params to prevent re-upload
        navigation.setParams({ capturedPhoto: null, documentType: null });
      }
    });

    return unsubscribe;
  }, [navigation, route.params]);

  // Enhanced document types with more metadata
  const documentTypes = [
    {
      id: 'aadhar',
      title: 'Aadhar Card',
      icon: IdentificationIcon,
      required: true,
      description: 'Upload front and back of Aadhar card',
      linkedField: null, // No direct field in schema for aadhar
      maxFiles: 2
    },
    {
      id: 'pan',
      title: 'PAN Card',
      icon: CreditCardIcon,
      required: true,
      description: 'Upload PAN card',
      linkedField: 'deliveryBoyInfo.identification.panNumber',
      maxFiles: 1
    },
    {
      id: 'driving_license',
      title: 'Driving License',
      icon: TruckIcon,
      required: true,
      description: 'Upload driving license',
      linkedField: 'deliveryBoyInfo.licenseNumber',
      maxFiles: 1
    },
    {
      id: 'vehicle_rc',
      title: 'Vehicle RC',
      icon: DocumentTextIcon,
      required: true,
      description: 'Upload vehicle registration certificate',
      linkedField: 'deliveryBoyInfo.vehicleInfo.vehicleNumber',
      maxFiles: 1
    },
    {
      id: 'bank_passbook',
      title: 'Bank Passbook',
      icon: WalletIcon,
      required: false,
      description: 'Upload bank passbook or statement',
      linkedField: 'deliveryBoyInfo.bankDetails.accountNumber',
      maxFiles: 1
    },
    {
      id: 'vehicle_photo',
      title: 'Vehicle Photo',
      icon: PhotoIcon,
      required: false,
      description: 'Upload clear photo of your vehicle',
      linkedField: 'deliveryBoyInfo.vehicleInfo.vehiclePhoto',
      maxFiles: 1
    },
    {
      id: 'profile_photo',
      title: 'Profile Photo',
      icon: PhotoIcon,
      required: false,
      description: 'Upload your profile photo',
      linkedField: 'deliveryBoyInfo.personalInfo.photo',
      maxFiles: 1
    }
  ];

  // Handle photo upload after capture
  const handlePhotoUpload = async (photoUri, documentType) => {
    try {
      setUploadingDocument(documentType);
      
      console.log('📤 Uploading document:', { documentType, photoUri });
      
      // Try JSON upload method first (better React Native compatibility)
      const result = await authAPI.uploadDocumentJSON(photoUri, documentType);
      
      if (result.success) {
        Alert.alert(
          'Success',
          'Document uploaded successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                setRefreshProfile(!refreshProfile);
                // Refresh documents
                fetchDocuments();
              }
            }
          ]
        );
      } else {
        Alert.alert('Upload Failed', result.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Error', 'An error occurred while uploading the document');
    } finally {
      setUploadingDocument(null);
    }
  };

  const handleUploadDocument = (docType) => {
    Alert.alert(
      'Upload Document',
      `Do you want to upload ${docType.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Camera', 
          onPress: () => navigation.navigate('Camera', { 
            type: 'document-upload',
            documentType: docType.id,
            returnScreen: 'Documents'
          })
        },
        { 
          text: 'Gallery', 
          onPress: () => handleGalleryUpload(docType)
        }
      ]
    );
  };

  const handleGalleryUpload = async (docType) => {
    try {
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handlePhotoUpload(result.assets[0].uri, docType.id);
      }
    } catch (error) {
      console.error('Gallery selection error:', error);
      Alert.alert('Error', 'Failed to select photo from gallery');
    }
  };

  const handleViewDocument = (docType) => {
    // Check if document exists for this type
    const documentUrl = documents[docType.id];
    
    if (documentUrl) {
      setViewingDocument({
        type: docType,
        url: documentUrl
      });
      setImageViewVisible(true);
    } else {
      Alert.alert('No Document', `No ${docType.title} has been uploaded yet.`);
    }
  };

  const handleDocumentAction = (docType) => {
    const status = getDocumentStatus(docType);
    const isUploaded = status === 'uploaded';

    if (isUploaded) {
      // Show view/edit options for uploaded documents
      Alert.alert(
        docType.title,
        'What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'View Document', 
            onPress: () => handleViewDocument(docType)
          },
          { 
            text: 'Replace Document', 
            onPress: () => handleUploadDocument(docType)
          },
          { 
            text: 'Delete Document', 
            onPress: () => handleDeleteDocument(docType),
            style: 'destructive'
          }
        ]
      );
    } else {
      // Direct upload for non-uploaded documents
      handleUploadDocument(docType);
    }
  };

  const handleDeleteDocument = async (docType) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete ${docType.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await authAPI.deleteDocument(docType.id);
              
              if (result.success) {
                Alert.alert('Success', 'Document deleted successfully');
                fetchDocuments(); // Refresh documents
              } else {
                Alert.alert('Delete Failed', result.error || 'Failed to delete document');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'An error occurred while deleting the document');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getLinkedFieldValue = (linkedField) => {
    if (!linkedField || !userProfile) return null;
    
    const path = linkedField.split('.');
    let value = userProfile;
    
    for (const key of path) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return null;
      }
    }
    
    return value;
  };

  const getDocumentStatus = (docType) => {
    console.log('🔍 Checking document status for:', docType.id);
    console.log('🔍 Available documents by type:', documents);
    
    // Check if document exists for this specific type
    const hasDocument = documents[docType.id];
    
    if (hasDocument) {
      return 'uploaded';
    }
    
    return 'pending';
  };

  // Calculate upload progress for required documents
  const requiredDocs = documentTypes.filter(doc => doc.required);
  const uploadedRequiredDocs = requiredDocs.filter(doc => documents[doc.id]).length;
  const progressPercentage = Math.min((uploadedRequiredDocs / requiredDocs.length) * 100, 100);

  const renderDocumentItem = (docType) => {
    const status = getDocumentStatus(docType);
    const isUploaded = status === 'uploaded';
    const isUploading = uploadingDocument === docType.id;
    const IconComponent = docType.icon;
    const linkedValue = getLinkedFieldValue(docType.linkedField);

    return (
      <TouchableOpacity 
        key={docType.id}
        style={[styles.documentItem, isUploading && styles.documentItemUploading]}
        onPress={() => !isUploading && handleDocumentAction(docType)}
        disabled={isUploading}
      >
        <View style={styles.documentLeft}>
          <View style={[
            styles.iconContainer, 
            isUploaded && styles.iconContainerUploaded,
            isUploading && styles.iconContainerUploading
          ]}>
            {isUploading ? (
              <ActivityIndicator size="small" color={colors.primary.yellow2} />
            ) : (
              <IconComponent 
                size={20} 
                color={isUploaded ? colors.primary.yellow2 : colors.neutrals.dark} 
              />
            )}
          </View>
          <View style={styles.documentInfo}>
            <View style={styles.documentHeader}>
              <Text style={styles.documentTitle}>{docType.title}</Text>
              {docType.required && (
                <Text style={styles.requiredBadge}>Required</Text>
              )}
            </View>
            <Text style={styles.documentDescription}>
              {isUploading ? 'Uploading...' : docType.description}
            </Text>
            
            {/* Show linked field value if available */}
            {linkedValue && !isUploading && (
              <Text style={styles.linkedFieldValue}>
                {docType.id === 'pan' ? `PAN: ${linkedValue}` :
                 docType.id === 'driving_license' ? `License: ${linkedValue}` :
                 docType.id === 'vehicle_rc' ? `Vehicle: ${linkedValue}` :
                 docType.id === 'bank_passbook' ? `Account: ${linkedValue}` :
                 linkedValue}
              </Text>
            )}
            
            <View style={styles.statusContainer}>
              {isUploading ? (
                <ClockIcon size={12} color={colors.primary.yellow2} />
              ) : isUploaded ? (
                <CheckCircleIcon size={12} color={colors.primary.yellow2} />
              ) : (
                <ClockIcon size={12} color={colors.neutrals.gray} />
              )}
              <Text style={[
                styles.statusText,
                { color: isUploading ? colors.primary.yellow2 : 
                         isUploaded ? colors.primary.yellow2 : colors.neutrals.gray }
              ]}>
                {isUploading ? 'Uploading...' : isUploaded ? 'Uploaded' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.documentActions}>
          {isUploaded && !isUploading && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleViewDocument(docType)}
            >
              <EyeIcon size={16} color={colors.primary.yellow2} />
            </TouchableOpacity>
          )}
          {!isUploading && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleUploadDocument(docType)}
            >
              {isUploaded ? (
                <PencilIcon size={16} color={colors.neutrals.gray} />
              ) : (
                <Ionicons name="add" size={16} color={colors.primary.yellow2} />
              )}
            </TouchableOpacity>
          )}
          {!isUploading && (
            <Ionicons name="chevron-forward" size={16} color={colors.neutrals.gray} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="white" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.neutrals.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Documents</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <InformationCircleIcon size={24} color={colors.primary.yellow2} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Document Upload</Text>
              <Text style={styles.infoDescription}>
                Upload clear photos of your documents for verification. All required documents must be uploaded for account approval.
              </Text>
            </View>
          </View>
        </View>

        {/* Documents Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          {documentTypes.filter(doc => doc.required).map(renderDocumentItem)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Optional Documents</Text>
          {documentTypes.filter(doc => !doc.required).map(renderDocumentItem)}
        </View>

        {/* Upload Progress */}
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>Upload Progress</Text>
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill, 
              { width: `${progressPercentage}%` }
            ]} />
          </View>
          <Text style={styles.progressText}>
            {uploadedRequiredDocs} of {requiredDocs.length} required documents uploaded
          </Text>
          {Object.keys(documents).length > 0 && (
            <Text style={styles.progressSubText}>
              Total documents: {Object.keys(documents).length}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageViewVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {viewingDocument?.type?.title}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setImageViewVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.neutrals.dark} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.imageContainer}>
              {viewingDocument?.url ? (
                <Image
                  source={{ uri: viewingDocument.url }}
                  style={styles.documentImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.noImageContainer}>
                  <DocumentTextIcon size={48} color={colors.neutrals.gray} />
                  <Text style={styles.noImageText}>Document not available</Text>
                </View>
              )}
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setImageViewVisible(false);
                  if (viewingDocument?.type) {
                    handleUploadDocument(viewingDocument.type);
                  }
                }}
              >
                <PencilIcon size={20} color="white" />
                <Text style={styles.modalButtonText}>Replace</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutrals.gray,
    lineHeight: typography.lineHeight.lg,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
    marginBottom: 16,
  },
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  documentItemUploading: {
    opacity: 0.7,
    backgroundColor: colors.neutrals.lightGray,
  },
  documentLeft: {
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
    marginRight: 12,
  },
  iconContainerUploaded: {
    backgroundColor: colors.primary.yellow1,
  },
  iconContainerUploading: {
    backgroundColor: colors.primary.yellow1,
  },
  documentInfo: {
    flex: 1,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  documentTitle: {
    fontSize: typography.fontSize.base + 1,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutrals.dark,
    marginRight: 8,
  },
  requiredBadge: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: '#FF6B6B',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  documentDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutrals.gray,
    marginBottom: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  linkedFieldValue: {
    fontSize: 11,
    color: colors.primary.yellow2,
    fontWeight: '500',
    marginBottom: 4,
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginRight: 4,
  },
  progressSection: {
    padding: 20,
    backgroundColor: colors.neutrals.lightGray,
    marginTop: 16,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutrals.dark,
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'white',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.yellow2,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.neutrals.gray,
    textAlign: 'center',
  },
  progressSubText: {
    fontSize: 11,
    color: colors.neutrals.gray,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: width * 0.9,
    maxHeight: height * 0.8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.neutrals.dark,
  },
  closeButton: {
    padding: 4,
  },
  imageContainer: {
    height: height * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutrals.lightGray,
  },
  documentImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noImageText: {
    fontSize: 16,
    color: colors.neutrals.gray,
    marginTop: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
  },
  modalButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary.yellow2,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default Documents;
