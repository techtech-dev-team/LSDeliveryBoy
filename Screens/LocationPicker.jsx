import { Ionicons } from '@expo/vector-icons';
import React, { useState, useRef } from 'react';
import {
  Alert,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { colors, typography } from '../components/colors';

const { width, height } = Dimensions.get('window');

const LocationPicker = ({ navigation, route }) => {
  const { 
    onLocationSelected,
    initialLocation,
    selectionType = 'address', // 'address' or 'service'
    title = 'Select Location',
    editingServiceArea = null, // For editing existing service area
    currentServiceAreas = [] // Current service areas to avoid duplicates
  } = route.params || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || editingServiceArea || null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(
    editingServiceArea?.radius || (selectionType === 'service' ? 2 : 5)
  );
  const [mapRegion, setMapRegion] = useState({
    latitude: initialLocation?.latitude || editingServiceArea?.coordinates?.latitude || 18.5204,
    longitude: initialLocation?.longitude || editingServiceArea?.coordinates?.longitude || 73.8567,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Check location permissions on component mount
  React.useEffect(() => {
    checkLocationPermissions();
  }, []);

  // Cleanup search timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const getLocationDetails = async (latitude, longitude, locationName = 'Selected Location') => {
    try {
      // Try to get detailed address from coordinates (reverse geocoding)
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        return {
          name: locationName,
          address: [place.name, place.street].filter(Boolean).join(', ') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          city: place.city || place.subregion || '',
          state: place.region || '',
          pincode: place.postalCode || '',
          latitude,
          longitude,
        };
      }
    } catch (geocodeError) {
      console.log('Reverse geocoding failed:', geocodeError);
    }
    
    // Fallback if geocoding fails
    return {
      name: locationName,
      address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      city: '',
      state: '',
      pincode: '',
      latitude,
      longitude,
    };
  };

  const checkLocationPermissions = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Just log for now, don't show alert on mount
        console.log('Location permission not granted');
      }
    } catch (error) {
      console.log('Error checking location permissions:', error);
    }
  };

  // Mock search results for demonstration
  const mockSearchResults = [
    {
      id: '1',
      name: 'Wakad, Pimpri Chinchwad',
      address: 'Wakad, Pimpri Chinchwad, Maharashtra 411057',
      city: 'Pimpri Chinchwad',
      state: 'Maharashtra',
      pincode: '411057',
      latitude: 18.5974,
      longitude: 73.7898,
      type: 'locality'
    },
    {
      id: '2',
      name: 'Hinjewadi IT Park',
      address: 'Hinjewadi IT Park, Pune, Maharashtra 411057',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411057',
      latitude: 18.5913,
      longitude: 73.7398,
      type: 'business'
    },
    {
      id: '3',
      name: 'Balewadi High Street',
      address: 'Balewadi High Street, Pune, Maharashtra 411045',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411045',
      latitude: 18.5642,
      longitude: 73.7769,
      type: 'shopping'
    },
    {
      id: '4',
      name: 'Pune Airport',
      address: 'Pune Airport, Lohegaon, Pune, Maharashtra 411032',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411032',
      latitude: 18.5822,
      longitude: 73.9197,
      type: 'airport'
    },
    {
      id: '5',
      name: 'Phoenix Marketcity',
      address: 'Phoenix Marketcity, Viman Nagar, Pune, Maharashtra 411014',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411014',
      latitude: 18.5679,
      longitude: 73.9143,
      type: 'shopping'
    }
  ];

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (query.length > 2) {
      setIsSearching(true);
      
      // Debounce search to avoid too many API calls
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          // Use Expo Location geocoding for real search results
          const searchResults = await Location.geocodeAsync(query);
          
          if (searchResults.length > 0) {
            // Create formatted results from geocoding
            const formattedResults = await Promise.all(
              searchResults.slice(0, 5).map(async (result, index) => {
                try {
                  // Get reverse geocoding for more details
                  const reverseGeocode = await Location.reverseGeocodeAsync({
                    latitude: result.latitude,
                    longitude: result.longitude,
                  });
                  
                  const place = reverseGeocode[0] || {};
                  
                  return {
                    id: `search-${index}`,
                    name: place.name || place.street || `Location ${index + 1}`,
                    address: [place.name, place.street, place.city, place.region, place.postalCode].filter(Boolean).join(', '),
                    city: place.city || place.subregion || '',
                    state: place.region || '',
                    pincode: place.postalCode || '',
                    latitude: result.latitude,
                    longitude: result.longitude,
                    type: 'search-result'
                  };
                } catch (error) {
                  // Fallback if reverse geocoding fails
                  return {
                    id: `search-${index}`,
                    name: `Search Result ${index + 1}`,
                    address: `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`,
                    city: '',
                    state: '',
                    pincode: '',
                    latitude: result.latitude,
                    longitude: result.longitude,
                    type: 'search-result'
                  };
                }
              })
            );
            
            setSearchResults(formattedResults);
            
            // Update map region to first search result
            if (formattedResults.length > 0) {
              const firstResult = formattedResults[0];
              setMapRegion({
                latitude: firstResult.latitude,
                longitude: firstResult.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              });
              
              // Animate map to search area
              if (mapRef.current) {
                mapRef.current.animateToRegion({
                  latitude: firstResult.latitude,
                  longitude: firstResult.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }, 1000);
              }
            }
          } else {
            // Fallback to mock results if no geocoding results
            const filtered = mockSearchResults.filter(result =>
              result.name.toLowerCase().includes(query.toLowerCase()) ||
              result.address.toLowerCase().includes(query.toLowerCase())
            );
            setSearchResults(filtered);
          }
        } catch (error) {
          console.log('Geocoding failed, using mock results:', error);
          // Fallback to mock search results
          const filtered = mockSearchResults.filter(result =>
            result.name.toLowerCase().includes(query.toLowerCase()) ||
            result.address.toLowerCase().includes(query.toLowerCase())
          );
          setSearchResults(filtered);
        }
        
        setIsSearching(false);
      }, 500); // 500ms debounce
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setMapRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    
    // Animate map to selected location
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const confirmSelection = (location = selectedLocation) => {
    if (!location) {
      Alert.alert('Error', 'Please select a location');
      return;
    }

    let finalLocation = { ...location };
    
    // Add radius for service areas
    if (selectionType === 'service') {
      finalLocation.radius = selectedRadius;
      finalLocation.coordinates = {
        latitude: location.latitude,
        longitude: location.longitude
      };
      console.log('🎯 Confirming SERVICE location with radius:', finalLocation);
    } else {
      console.log('🏠 Confirming ADDRESS location:', finalLocation);
    }

    console.log('✅ Final location being sent:', JSON.stringify(finalLocation, null, 2));
    console.log('📍 Selection type:', selectionType);

    if (onLocationSelected) {
      onLocationSelected(finalLocation);
    }
    navigation.goBack();
  };

  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      
      // Request permission to access location
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to get your current location. Please enable location access in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
        maximumAge: 10000,
      });

      const { latitude, longitude } = location.coords;

      // Get detailed location information
      const locationDetails = await getLocationDetails(latitude, longitude, 'Current Location');
      
      const currentLocation = {
        id: 'current',
        ...locationDetails,
        type: 'current'
      };

      handleLocationSelect(currentLocation);
      
      // Also update the map region to center on current location
      setMapRegion({
        latitude: latitude,
        longitude: longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Failed to get your current location. Please check if location services are enabled and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    // Get detailed location information
    const locationDetails = await getLocationDetails(latitude, longitude, 'Map Selected Location');
    
    const mapSelectedLocation = {
      id: 'map-selected',
      ...locationDetails,
      type: 'map-selected'
    };
    setSelectedLocation(mapSelectedLocation);
  };

  const getLocationIcon = (type) => {
    switch (type) {
      case 'current': return 'location';
      case 'business': return 'business';
      case 'shopping': return 'storefront';
      case 'airport': return 'airplane';
      case 'locality': return 'home';
      default: return 'location-outline';
    }
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.searchResultItem,
        selectedLocation?.id === item.id && styles.selectedResult
      ]}
      onPress={() => handleLocationSelect(item)}
    >
      <View style={styles.resultIcon}>
        <Ionicons 
          name={getLocationIcon(item.type)} 
          size={20} 
          color={selectedLocation?.id === item.id ? colors.primary.yellow2 : colors.neutrals.gray} 
        />
      </View>
      <View style={styles.resultInfo}>
        <Text style={[
          styles.resultName,
          selectedLocation?.id === item.id && styles.selectedResultText
        ]}>
          {item.name}
        </Text>
        <Text style={styles.resultAddress}>{item.address}</Text>
        <Text style={styles.resultCoords}>
          {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
        </Text>
      </View>
      {selectedLocation?.id === item.id && (
        <Ionicons name="checkmark-circle" size={20} color={colors.primary.yellow2} />
      )}
    </TouchableOpacity>
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
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity 
          style={[
            styles.currentLocationButton,
            isGettingLocation && styles.currentLocationButtonLoading
          ]}
          onPress={getCurrentLocation}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? (
            <ActivityIndicator size="small" color={colors.primary.yellow2} />
          ) : (
            <Ionicons name="locate" size={20} color={colors.primary.yellow2} />
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.neutrals.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for places..."
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setSearchResults([]);
            }}>
              <Ionicons name="close" size={20} color={colors.neutrals.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          mapType="standard"
        >
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              title={selectedLocation.name}
              description={selectedLocation.address}
              pinColor={colors.primary.yellow2}
            />
          )}
        </MapView>
        
        {selectedLocation && (
          <View style={styles.selectedLocationOverlay}>
            <Text style={styles.selectedLocationText} numberOfLines={1}>
              📍 {selectedLocation.name}
            </Text>
            {selectedLocation.city && (
              <Text style={styles.selectedLocationSubText} numberOfLines={1}>
                {selectedLocation.city}, {selectedLocation.state} {selectedLocation.pincode}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Service Area Radius Selector */}
      {selectionType === 'service' && selectedLocation && (
        <View style={styles.radiusContainer}>
          <Text style={styles.radiusLabel}>Service Radius (km)</Text>
          <View style={styles.radiusSelector}>
            {[1, 2, 3, 5, 10].map((radius) => (
              <TouchableOpacity
                key={radius}
                style={[
                  styles.radiusOption,
                  selectedRadius === radius && styles.radiusOptionSelected
                ]}
                onPress={() => setSelectedRadius(radius)}
              >
                <Text style={[
                  styles.radiusOptionText,
                  selectedRadius === radius && styles.radiusOptionTextSelected
                ]}>
                  {radius}km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Search Results or Quick Options */}
      <View style={styles.resultsContainer}>
        {isSearching ? (
          <View style={styles.searchingContainer}>
            <ActivityIndicator size="large" color={colors.primary.yellow2} />
            <Text style={styles.searchingText}>Searching locations...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
            <Text style={styles.resultsTitle}>Search Results for "{searchQuery}"</Text>
            {searchResults.map((item) => (
              <View key={item.id}>
                {renderSearchResult({ item })}
              </View>
            ))}
          </ScrollView>
        ) : (
          <ScrollView style={styles.quickOptions} showsVerticalScrollIndicator={false}>
            <Text style={styles.resultsTitle}>Quick Options</Text>
            
            <TouchableOpacity 
              style={[
                styles.quickOption,
                isGettingLocation && styles.quickOptionLoading
              ]} 
              onPress={getCurrentLocation}
              disabled={isGettingLocation}
            >
              <View style={styles.quickOptionIcon}>
                {isGettingLocation ? (
                  <ActivityIndicator size="small" color={colors.primary.yellow2} />
                ) : (
                  <Ionicons name="locate" size={20} color={colors.primary.yellow2} />
                )}
              </View>
              <View style={styles.quickOptionInfo}>
                <Text style={styles.quickOptionTitle}>
                  {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
                </Text>
                <Text style={styles.quickOptionSubtitle}>
                  {isGettingLocation ? 'Please wait...' : 'Get your current GPS location'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.neutrals.gray} />
            </TouchableOpacity>

            <Text style={styles.resultsTitle}>Popular Locations</Text>
            {mockSearchResults.slice(0, 3).map((item) => (
              <View key={item.id}>
                {renderSearchResult({ item })}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Confirm Button */}
      {selectedLocation && (
        <View style={styles.confirmContainer}>
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={() => confirmSelection()}
          >
            <Ionicons name="checkmark" size={20} color="white" />
            <Text style={styles.confirmButtonText}>
              {selectionType === 'address' ? 'Confirm Address' : 'Add Service Area'}
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 10,
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
  currentLocationButton: {
    padding: 8,
    backgroundColor: colors.primary.yellow1,
    borderRadius: 20,
  },
  currentLocationButtonLoading: {
    backgroundColor: colors.neutrals.lightGray,
  },
  searchContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutrals.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.neutrals.dark,
    marginLeft: 12,
  },
  mapContainer: {
    height: height * 0.3,
    backgroundColor: '#f8f9fa',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  selectedLocationOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    
  },
  selectedLocationText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.neutrals.dark,
  },
  selectedLocationSubText: {
    fontSize: 10,
    color: colors.neutrals.gray,
    marginTop: 2,
  },
  radiusContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
    backgroundColor: 'white',
  },
  radiusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutrals.dark,
    marginBottom: 12,
  },
  radiusSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radiusOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.neutrals.lightGray,
    borderRadius: 8,
    alignItems: 'center',
  },
  radiusOptionSelected: {
    backgroundColor: colors.primary.yellow1,
    borderColor: colors.primary.yellow2,
  },
  radiusOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.neutrals.gray,
  },
  radiusOptionTextSelected: {
    color: colors.neutrals.dark,
  },
  resultsContainer: {
    flex: 1,
  },
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  searchingText: {
    fontSize: 16,
    color: colors.neutrals.gray,
    marginTop: 16,
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 20,
  },
  quickOptions: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutrals.dark,
    marginTop: 16,
    marginBottom: 12,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  selectedResult: {
    backgroundColor: colors.primary.yellow1,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutrals.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutrals.dark,
    marginBottom: 2,
  },
  selectedResultText: {
    color: colors.neutrals.dark,
  },
  resultAddress: {
    fontSize: 12,
    color: colors.neutrals.gray,
    marginBottom: 2,
  },
  resultCoords: {
    fontSize: 10,
    color: colors.neutrals.gray,
    fontFamily: 'monospace',
  },
  quickOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  quickOptionLoading: {
    opacity: 0.6,
  },
  quickOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.yellow1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickOptionInfo: {
    flex: 1,
  },
  quickOptionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutrals.dark,
    marginBottom: 2,
  },
  quickOptionSubtitle: {
    fontSize: 12,
    color: colors.neutrals.gray,
  },
  confirmContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.neutrals.lightGray,
    backgroundColor: 'white',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.yellow2,
    borderRadius: 12,
    paddingVertical: 16,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginLeft: 8,
  },
});

export default LocationPicker;
