import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { colors, typography } from '../components/colors';

const { width, height } = Dimensions.get('window');

const Camera = ({ navigation, route }) => {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [flashMode, setFlashMode] = useState('off');
  
  const cameraRef = useRef(null);
  
  // Get the capture type from route params (delivery-proof, id-verification, or document-upload)
  const captureType = route?.params?.type || 'delivery-proof';
  const orderId = route?.params?.orderId || null;
  const documentType = route?.params?.documentType || null;
  const returnScreen = route?.params?.returnScreen || null;

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color={colors.primary.yellow2} />
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={colors.neutrals.gray} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionMessage}>
          We need camera access to capture {captureType === 'delivery-proof' ? 'delivery proof photos' : 'ID verification photos'}
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;
    
    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });
      
      setCapturedPhoto(photo);
      setShowPreview(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      console.error('Camera capture error:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedPhoto(result.assets[0]);
        setShowPreview(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select photo from gallery.');
      console.error('Gallery selection error:', error);
    }
  };

  const savePhoto = async () => {
    if (!capturedPhoto) return;

    try {
      if (captureType === 'document-upload' && documentType && returnScreen) {
        // Navigate back to the return screen with the captured photo
        navigation.navigate(returnScreen, {
          capturedPhoto: capturedPhoto.uri,
          documentType: documentType,
          userProfile: route.params?.userProfile // Pass along user profile if available
        });
      } else {
        // Handle other capture types (delivery-proof, id-verification)
        Alert.alert(
          'Success', 
          `${captureType === 'delivery-proof' ? 'Delivery proof' : 'ID verification'} photo captured successfully!`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowPreview(false);
                setCapturedPhoto(null);
                navigation.goBack();
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save photo. Please try again.');
      console.error('Save photo error:', error);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setShowPreview(false);
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlashMode(current => {
      const modes = ['off', 'on', 'auto'];
      const currentIndex = modes.indexOf(current);
      return modes[(currentIndex + 1) % modes.length];
    });
  };

  const getFlashIcon = () => {
    switch (flashMode) {
      case 'on': return 'flash';
      case 'auto': return 'flash-outline';
      default: return 'flash-off';
    }
  };

  const getCaptureTypeTitle = () => {
    if (captureType === 'document-upload') {
      return documentType ? `Upload ${documentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}` : 'Upload Document';
    }
    return captureType === 'delivery-proof' ? 'Delivery Proof' : 'ID Verification';
  };

  const getCaptureTypeInstructions = () => {
    if (captureType === 'document-upload') {
      return 'Take a clear photo of your document. Make sure all text is readable and the document is well-lit.';
    }
    if (captureType === 'delivery-proof') {
      return 'Take a clear photo of the delivered items at the customer\'s location';
    }
    return 'Take a clear photo of your government-issued ID for verification';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{getCaptureTypeTitle()}</Text>
          {orderId && (
            <Text style={styles.headerSubtitle}>Order: {orderId}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={toggleFlash}>
          <Ionicons name={getFlashIcon()} size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          {getCaptureTypeInstructions()}
        </Text>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView 
          style={styles.camera}
          facing={facing}
          flash={flashMode}
          ref={cameraRef}
        >
          {/* Camera Overlay */}
          <View style={styles.cameraOverlay}>
            {(captureType === 'id-verification' || captureType === 'document-upload') && (
              <View style={styles.idFrame}>
                <View style={styles.idFrameCorner} />
                <View style={[styles.idFrameCorner, styles.topRight]} />
                <View style={[styles.idFrameCorner, styles.bottomLeft]} />
                <View style={[styles.idFrameCorner, styles.bottomRight]} />
              </View>
            )}
          </View>
        </CameraView>
      </View>

      {/* Camera Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
          <Ionicons name="images" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.captureButton, isCapturing && styles.capturingButton]} 
          onPress={takePicture}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <View style={styles.captureButtonInner} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
          <Ionicons name="camera-reverse" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Photo Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.previewContainer}>
          <StatusBar barStyle="light-content" backgroundColor="black" />
          
          {/* Preview Header */}
          <View style={styles.previewHeader}>
            <TouchableOpacity style={styles.headerButton} onPress={retakePhoto}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Photo Preview</Text>
            <TouchableOpacity style={styles.headerButton} onPress={savePhoto}>
              <Ionicons name="checkmark" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Preview Image */}
          {capturedPhoto && (
            <View style={styles.previewImageContainer}>
              <Image source={{ uri: capturedPhoto.uri }} style={styles.previewImage} />
            </View>
          )}

          {/* Preview Actions */}
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
              <Ionicons name="camera" size={20} color={colors.neutrals.dark} />
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={savePhoto}>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.saveText}>Save Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.neutrals.dark,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  permissionMessage: {
    fontSize: 16,
    color: colors.neutrals.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionText: {
    fontSize: 16,
    color: colors.neutrals.gray,
    marginTop: 16,
  },
  permissionButton: {
    backgroundColor: colors.primary.yellow2,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  instructionsContainer: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  instructionsText: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    lineHeight: 20,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idFrame: {
    width: width * 0.8,
    height: width * 0.5,
    position: 'relative',
  },
  idFrameCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: colors.primary.yellow2,
    borderWidth: 3,
    borderTopLeftRadius: 4,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    transform: [{ rotate: '90deg' }],
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    transform: [{ rotate: '-90deg' }],
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    transform: [{ rotate: '180deg' }],
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  capturingButton: {
    backgroundColor: colors.primary.yellow2,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  previewImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: width,
    height: height * 0.7,
    resizeMode: 'contain',
  },
  previewActions: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    paddingVertical: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    gap: 16,
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'white',
    borderRadius: 25,
  },
  retakeText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.neutrals.dark,
    marginLeft: 8,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: colors.primary.yellow2,
    borderRadius: 25,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginLeft: 8,
  },
});

export default Camera;