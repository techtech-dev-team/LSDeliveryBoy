import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
  Dimensions
} from 'react-native';
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
import { colors } from '../components/colors';

const { width, height } = Dimensions.get('window');

const Documents = ({ navigation, route }) => {
  const { userProfile } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [imageViewVisible, setImageViewVisible] = useState(false);

  console.log('📄 Documents - UserProfile:', JSON.stringify(userProfile, null, 2));
  console.log('📄 Documents - Documents array:', userProfile?.deliveryBoyInfo?.documents);

  const documents = userProfile?.deliveryBoyInfo?.documents || [];

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
            documentType: docType.id 
          })
        },
        { 
          text: 'Gallery', 
          onPress: () => {
            Alert.alert('Coming Soon', 'Gallery selection will be available soon');
          }
        }
      ]
    );
  };

  const handleViewDocument = (docType) => {
    // For now, show the first document if available
    if (documents.length > 0) {
      setViewingDocument({
        type: docType,
        url: documents[0] // In a real app, you'd map this properly to document types
      });
      setImageViewVisible(true);
    } else {
      Alert.alert('No Document', 'No document has been uploaded yet.');
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
          }
        ]
      );
    } else {
      // Direct upload for non-uploaded documents
      handleUploadDocument(docType);
    }
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
    console.log('🔍 Available documents:', documents);
    
    // Check if there are any documents uploaded
    // Since we don't have document type mapping yet, we'll show "uploaded" 
    // if there are any documents for required docs, and "pending" for optional ones
    const hasDocuments = documents && documents.length > 0;
    
    if (docType.required && hasDocuments) {
      return 'uploaded';
    } else if (!docType.required && hasDocuments && documents.length >= 4) {
      // If all required docs are uploaded, show optional ones as available to upload
      return 'uploaded';
    }
    
    return 'pending';
  };

  // Calculate upload progress for required documents
  const requiredDocs = documentTypes.filter(doc => doc.required);
  const uploadedRequiredDocs = documents.length; // This is a simple approximation
  const progressPercentage = Math.min((uploadedRequiredDocs / requiredDocs.length) * 100, 100);

  const renderDocumentItem = (docType) => {
    const status = getDocumentStatus(docType);
    const isUploaded = status === 'uploaded';
    const IconComponent = docType.icon;
    const linkedValue = getLinkedFieldValue(docType.linkedField);

    return (
      <TouchableOpacity 
        key={docType.id}
        style={styles.documentItem}
        onPress={() => handleDocumentAction(docType)}
      >
        <View style={styles.documentLeft}>
          <View style={[styles.iconContainer, isUploaded && styles.iconContainerUploaded]}>
            <IconComponent 
              size={20} 
              color={isUploaded ? colors.primary.yellow2 : colors.neutrals.dark} 
            />
          </View>
          <View style={styles.documentInfo}>
            <View style={styles.documentHeader}>
              <Text style={styles.documentTitle}>{docType.title}</Text>
              {docType.required && (
                <Text style={styles.requiredBadge}>Required</Text>
              )}
            </View>
            <Text style={styles.documentDescription}>{docType.description}</Text>
            
            {/* Show linked field value if available */}
            {linkedValue && (
              <Text style={styles.linkedFieldValue}>
                {docType.id === 'pan' ? `PAN: ${linkedValue}` :
                 docType.id === 'driving_license' ? `License: ${linkedValue}` :
                 docType.id === 'vehicle_rc' ? `Vehicle: ${linkedValue}` :
                 docType.id === 'bank_passbook' ? `Account: ${linkedValue}` :
                 linkedValue}
              </Text>
            )}
            
            <View style={styles.statusContainer}>
              {isUploaded ? (
                <CheckCircleIcon size={12} color={colors.primary.yellow2} />
              ) : (
                <ClockIcon size={12} color={colors.neutrals.gray} />
              )}
              <Text style={[
                styles.statusText,
                { color: isUploaded ? colors.primary.yellow2 : colors.neutrals.gray }
              ]}>
                {isUploaded ? 'Uploaded' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.documentActions}>
          {isUploaded && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleViewDocument(docType)}
            >
              <EyeIcon size={16} color={colors.primary.yellow2} />
            </TouchableOpacity>
          )}
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
          <Ionicons name="chevron-forward" size={16} color={colors.neutrals.gray} />
        </View>
      </TouchableOpacity>
    );
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
          {documents.length > 0 && (
            <Text style={styles.progressSubText}>
              Total documents: {documents.length}
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
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
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
  documentInfo: {
    flex: 1,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  documentTitle: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.neutrals.dark,
    marginRight: 8,
  },
  requiredBadge: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FF6B6B',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  documentDescription: {
    fontSize: 12,
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
