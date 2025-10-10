import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
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

const EditAddress = ({ navigation, route }) => {
  const { userProfile } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [mapSelectionType, setMapSelectionType] = useState('address'); // 'address' or 'service'
  
  // Debug: Log the userProfile to see what data we're getting
  useEffect(() => {
    console.log('🔍 EditAddress - UserProfile received:', JSON.stringify(userProfile, null, 2));
    console.log('🔍 EditAddress - PersonalInfo:', userProfile?.deliveryBoyInfo?.personalInfo);
    console.log('🔍 EditAddress - ServiceAreas:', userProfile?.deliveryBoyInfo?.serviceAreas);
  }, [userProfile]);
  
  // Initialize form data
  const [formData, setFormData] = useState({
    address: userProfile?.deliveryBoyInfo?.personalInfo?.address || '',
    city: userProfile?.deliveryBoyInfo?.personalInfo?.city || '',
    state: userProfile?.deliveryBoyInfo?.personalInfo?.state || '',
    pincode: userProfile?.deliveryBoyInfo?.personalInfo?.pincode || '',
    latitude: userProfile?.deliveryBoyInfo?.personalInfo?.latitude || null,
    longitude: userProfile?.deliveryBoyInfo?.personalInfo?.longitude || null,
    serviceRadius: userProfile?.deliveryBoyInfo?.serviceRadius || 5, // km
    serviceAreas: (userProfile?.deliveryBoyInfo?.serviceAreas || []).map((area, index) => ({
      // Convert MongoDB service area to frontend format
      id: area._id?.toString() || area.id || `area-${index}`, // Use MongoDB _id or fallback
      name: `Service Area ${index + 1}`, // Generate a display name
      coordinates: area.coordinates || { latitude: area.latitude, longitude: area.longitude },
      radius: area.radius || 2,
    })),
  });

  const [editingServiceArea, setEditingServiceArea] = useState(null);

  // Debug: Log form data when initialized
  useEffect(() => {
    console.log('📝 EditAddress - Initial form data:', formData);
  }, []);

  // Debug: Log service areas when they change
  useEffect(() => {
    console.log('🗺️ Service areas updated:', formData.serviceAreas);
  }, [formData.serviceAreas]);

  const handleSave = async () => {
    try {
      setLoading(true);
      console.log('💾 Starting save process...');
      console.log('💾 Current form data:', JSON.stringify(formData, null, 2));

      // Validate required fields
      if (!formData.address.trim()) {
        Alert.alert('Error', 'Address is required');
        return;
      }

      // Clean service areas - remove frontend ID and keep only MongoDB-compatible fields
      const cleanedServiceAreas = formData.serviceAreas.map(area => ({
        coordinates: {
          latitude: area.coordinates?.latitude || area.latitude,
          longitude: area.coordinates?.longitude || area.longitude,
        },
        radius: area.radius || 2,
        // Remove the frontend 'id' field and 'name' field as they're not in the schema
      }));

      const updateData = {
        'deliveryBoyInfo.personalInfo.address': formData.address,
        'deliveryBoyInfo.personalInfo.city': formData.city,
        'deliveryBoyInfo.personalInfo.state': formData.state,
        'deliveryBoyInfo.personalInfo.pincode': formData.pincode,
        'deliveryBoyInfo.personalInfo.latitude': formData.latitude,
        'deliveryBoyInfo.personalInfo.longitude': formData.longitude,
        'deliveryBoyInfo.serviceRadius': formData.serviceRadius,
        'deliveryBoyInfo.serviceAreas': cleanedServiceAreas,
      };

      console.log('📤 Sending update data:', JSON.stringify(updateData, null, 2));
      console.log('🗺️ Cleaned service areas being saved:', cleanedServiceAreas);

      const response = await dashboardAPI.updateProfile(updateData);

      console.log('📥 API Response:', response);

      if (response.success) {
        Alert.alert('Success', 'Address and service location updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to update address');
      }
    } catch (error) {
      console.error('❌ Address update error:', error);
      Alert.alert('Error', 'Failed to update address');
    } finally {
      setLoading(false);
    }
  };

  const handleMapSelection = (type, serviceAreaToEdit = null) => {
    setMapSelectionType(type);
    setEditingServiceArea(serviceAreaToEdit);
    
    navigation.navigate('LocationPicker', {
      selectionType: type,
      title: type === 'address' ? 'Select Your Address' : 
             serviceAreaToEdit ? 'Edit Service Location' : 'Add Service Location',
      onLocationSelected: handleLocationSelected,
      editingServiceArea: serviceAreaToEdit ? {
        id: serviceAreaToEdit.id,
        name: serviceAreaToEdit.name || 'Service Area',
        coordinates: serviceAreaToEdit.coordinates,
        radius: serviceAreaToEdit.radius,
        latitude: serviceAreaToEdit.coordinates?.latitude || serviceAreaToEdit.latitude,
        longitude: serviceAreaToEdit.coordinates?.longitude || serviceAreaToEdit.longitude,
      } : null,
      currentServiceAreas: formData.serviceAreas,
      initialLocation: type === 'address' && formData.latitude && formData.longitude ? {
        latitude: formData.latitude,
        longitude: formData.longitude,
        name: 'Current Address',
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      } : null
    });
  };

  const handleLocationSelected = (location) => {
    console.log('🎯 Location selected:', location);
    console.log('🎯 Selection type:', mapSelectionType);
    console.log('🎯 Editing service area:', editingServiceArea);
    
    if (mapSelectionType === 'address') {
      console.log('🏠 Updating address fields');
      setFormData(prev => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || prev.address,
        city: location.city || prev.city,
        state: location.state || prev.state,
        pincode: location.pincode || prev.pincode,
      }));
    } else if (mapSelectionType === 'service') {
      console.log('🗺️ Updating service areas');
      
      if (editingServiceArea) {
        console.log('✏️ Editing existing service area:', editingServiceArea.id);
        // Update existing service area
        setFormData(prev => {
          const updatedAreas = prev.serviceAreas.map(area => 
            area.id === editingServiceArea.id 
              ? {
                  ...area,
                  name: location.name || 'Service Area',
                  coordinates: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                  },
                  radius: location.radius || area.radius || 2,
                }
              : area
          );
          console.log('✅ Updated service areas (edit):', updatedAreas);
          return {
            ...prev,
            serviceAreas: updatedAreas,
          };
        });
        setEditingServiceArea(null);
      } else {
        console.log('➕ Adding new service area');
        // Add new service area
        const newServiceArea = {
          id: Date.now().toString(),
          name: location.name || 'Service Area',
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          radius: location.radius || 2,
        };
        
        console.log('🆕 New service area object:', newServiceArea);
        
        setFormData(prev => {
          const updated = {
            ...prev,
            serviceAreas: [...prev.serviceAreas, newServiceArea],
          };
          console.log('✅ Updated service areas (add):', updated.serviceAreas);
          return updated;
        });
      }
    }
  };

  const removeServiceArea = (identifier) => {
    console.log('🗑️ Removing service area:', identifier);
    setFormData(prev => {
      const filteredAreas = prev.serviceAreas.filter((area, index) => {
        // Support both id-based and index-based removal
        if (typeof identifier === 'string') {
          return area.id !== identifier;
        } else {
          return index !== identifier;
        }
      });
      console.log('✅ Remaining service areas:', filteredAreas);
      return {
        ...prev,
        serviceAreas: filteredAreas,
      };
    });
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
        <Text style={styles.title}>Edit Address</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address *</Text>
            <View style={styles.inputWithButton}>
              <TextInput
                style={[styles.input, styles.inputWithMap]}
                value={formData.address}
                onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                placeholder="Enter your full address"
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity 
                style={styles.mapButton}
                onPress={() => handleMapSelection('address')}
              >
                <Ionicons name="location" size={20} color={colors.primary.yellow2} />
              </TouchableOpacity>
            </View>
            {formData.latitude && formData.longitude && (
              <Text style={styles.locationInfo}>
                📍 Location: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={formData.city}
              onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
              placeholder="Enter city"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              value={formData.state}
              onChangeText={(text) => setFormData(prev => ({ ...prev, state: text }))}
              placeholder="Enter state"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PIN Code</Text>
            <TextInput
              style={styles.input}
              value={formData.pincode}
              onChangeText={(text) => setFormData(prev => ({ ...prev, pincode: text }))}
              placeholder="Enter PIN code"
              keyboardType="numeric"
              maxLength={6}
            />
          </View>
        </View>

        {/* Service Areas Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Service Areas</Text>
            <TouchableOpacity 
              style={styles.addServiceButton}
              onPress={() => handleMapSelection('service')}
            >
              <Ionicons name="add-circle" size={20} color={colors.primary.yellow2} />
              <Text style={styles.addServiceText}>Add Area</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.serviceRadiusGroup}>
            <Text style={styles.label}>Default Service Radius (km)</Text>
            <TextInput
              style={styles.input}
              value={formData.serviceRadius.toString()}
              onChangeText={(text) => setFormData(prev => ({ ...prev, serviceRadius: parseInt(text) || 5 }))}
              placeholder="5"
              keyboardType="numeric"
            />
          </View>

          {formData.serviceAreas.length > 0 ? (
            <View style={styles.serviceAreasList}>
              <Text style={styles.subLabel}>Selected Service Areas ({formData.serviceAreas.length}):</Text>
              {formData.serviceAreas.map((area, index) => {
                console.log('🎨 Rendering service area:', area);
                
                // Safety checks for coordinates - try both structures
                const latitude = area.coordinates?.latitude || area.latitude;
                const longitude = area.coordinates?.longitude || area.longitude;
                
                console.log('📍 Area coordinates:', { latitude, longitude });
                
                if (!latitude || !longitude) {
                  console.warn('⚠️ Invalid coordinates for service area:', area);
                  return (
                    <View key={area.id || index} style={[styles.serviceAreaItem, { backgroundColor: '#ffebee' }]}>
                      <View style={styles.serviceAreaInfo}>
                        <Text style={styles.serviceAreaName}>{area.name || 'Invalid Area'}</Text>
                        <Text style={[styles.serviceAreaLocation, { color: '#f44336' }]}>
                          ❌ Invalid coordinates
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.removeServiceButton}
                        onPress={() => removeServiceArea(area.id || index)}
                      >
                        <Ionicons name="trash" size={16} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  );
                }
                
                return (
                  <View key={area.id || index} style={styles.serviceAreaItem}>
                    <TouchableOpacity 
                      style={styles.serviceAreaInfo}
                      onPress={() => handleMapSelection('service', area)}
                    >
                      <Text style={styles.serviceAreaName}>
                        {area.name || `Service Area ${index + 1}`}
                      </Text>
                      <Text style={styles.serviceAreaLocation}>
                        📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}
                      </Text>
                      <Text style={styles.serviceAreaRadius}>
                        🔄 {area.radius || 2}km radius
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.removeServiceButton}
                      onPress={() => removeServiceArea(area.id || index)}
                    >
                      <Ionicons name="trash" size={16} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyServiceAreas}>
              <Ionicons name="location-outline" size={32} color={colors.neutrals.gray} />
              <Text style={styles.emptyServiceText}>No service areas added</Text>
              <Text style={styles.emptyServiceSubtext}>
                Add specific areas where you want to provide delivery services
              </Text>
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Address & Service Areas'}
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
    marginRight: 40, // Compensate for back button
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
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
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  inputWithMap: {
    flex: 1,
    marginRight: 12,
  },
  mapButton: {
    backgroundColor: colors.primary.yellow1,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  locationInfo: {
    fontSize: 12,
    color: colors.primary.yellow2,
    marginTop: 4,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.yellow1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addServiceText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.neutrals.dark,
    marginLeft: 4,
  },
  serviceRadiusGroup: {
    marginBottom: 20,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.neutrals.gray,
    marginBottom: 8,
  },
  serviceAreasList: {
    marginTop: 16,
  },
  serviceAreaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.neutrals.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  serviceAreaInfo: {
    flex: 1,
  },
  serviceAreaName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutrals.dark,
    marginBottom: 2,
  },
  serviceAreaLocation: {
    fontSize: 12,
    color: colors.neutrals.gray,
  },
  serviceAreaRadius: {
    fontSize: 12,
    color: colors.primary.yellow2,
    fontWeight: '500',
  },
  removeServiceButton: {
    padding: 8,
  },
  emptyServiceAreas: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.neutrals.lightGray,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyServiceText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutrals.gray,
    marginTop: 8,
  },
  emptyServiceSubtext: {
    fontSize: 12,
    color: colors.neutrals.gray,
    textAlign: 'center',
    marginTop: 4,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 56 : 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
    backgroundColor: 'white',
  },
  mapBackButton: {
    padding: 8,
  },
  mapTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: colors.neutrals.dark,
    textAlign: 'center',
    marginRight: 40,
  },
  saveButton: {
    backgroundColor: colors.primary.yellow2,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
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

export default EditAddress;
