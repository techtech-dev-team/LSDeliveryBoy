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
  Image
} from 'react-native';
import { colors } from '../components/colors';

const Documents = ({ navigation, route }) => {
  const { userProfile } = route.params || {};
  const [loading, setLoading] = useState(false);

  const documents = userProfile?.deliveryBoyInfo?.documents || [];

  const documentTypes = [
    {
      id: 'aadhar',
      title: 'Aadhar Card',
      icon: 'card-outline',
      required: true,
      description: 'Upload front and back of Aadhar card'
    },
    {
      id: 'pan',
      title: 'PAN Card',
      icon: 'document-outline',
      required: true,
      description: 'Upload PAN card'
    },
    {
      id: 'driving_license',
      title: 'Driving License',
      icon: 'car-outline',
      required: true,
      description: 'Upload driving license'
    },
    {
      id: 'vehicle_rc',
      title: 'Vehicle RC',
      icon: 'document-text-outline',
      required: true,
      description: 'Upload vehicle registration certificate'
    },
    {
      id: 'bank_passbook',
      title: 'Bank Passbook',
      icon: 'wallet-outline',
      required: false,
      description: 'Upload bank passbook or statement'
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

  const getDocumentStatus = (docType) => {
    // Simple check - in real app, you'd match by document type
    const hasDoc = documents.length > 0;
    return hasDoc ? 'uploaded' : 'pending';
  };

  const renderDocumentItem = (docType) => {
    const status = getDocumentStatus(docType);
    const isUploaded = status === 'uploaded';

    return (
      <TouchableOpacity 
        key={docType.id}
        style={styles.documentItem}
        onPress={() => handleUploadDocument(docType)}
      >
        <View style={styles.documentLeft}>
          <View style={[styles.iconContainer, isUploaded && styles.iconContainerUploaded]}>
            <Ionicons 
              name={docType.icon} 
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
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: isUploaded ? colors.primary.yellow2 : colors.neutrals.gray }
              ]} />
              <Text style={[
                styles.statusText,
                { color: isUploaded ? colors.primary.yellow2 : colors.neutrals.gray }
              ]}>
                {isUploaded ? 'Uploaded' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.neutrals.gray} />
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
            <Ionicons name="information-circle" size={24} color={colors.primary.yellow2} />
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
              { width: `${(documents.length / documentTypes.filter(d => d.required).length) * 100}%` }
            ]} />
          </View>
          <Text style={styles.progressText}>
            {documents.length} of {documentTypes.filter(d => d.required).length} required documents uploaded
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
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
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
});

export default Documents;
