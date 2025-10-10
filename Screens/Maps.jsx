import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Linking,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform
} from 'react-native';
import { colors, typography } from '../components/colors';

const Maps = ({ navigation, route }) => {
  const { deliveries = [], delivery = null } = route?.params || {};
  const [selectedDelivery, setSelectedDelivery] = useState(delivery);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  const [mapType, setMapType] = useState('list'); // 'list' or 'directions'

  useEffect(() => {
    if (delivery) {
      setSelectedDelivery(delivery);
      setShowDeliveryDetails(true);
    }
  }, [delivery]);

  const openGoogleMaps = (address, customerName) => {
    const query = encodeURIComponent(`${address}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open Google Maps');
      }
    });
  };

  const getDirections = (address, locationType = 'destination') => {
    const query = encodeURIComponent(address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', `Unable to open directions to ${locationType}`);
      }
    });
  };

  const getPickupDirections = (pickupAddress) => {
    if (!pickupAddress) {
      Alert.alert('No Pickup Address', 'Pickup address not available');
      return;
    }
    const query = encodeURIComponent(pickupAddress);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open directions to pickup location');
      }
    });
  };

  const getFullRoute = (pickupAddress, deliveryAddress) => {
    if (!pickupAddress || !deliveryAddress) {
      Alert.alert('Missing Addresses', 'Both pickup and delivery addresses are required');
      return;
    }

    const origin = encodeURIComponent(pickupAddress);
    const destination = encodeURIComponent(deliveryAddress);
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open full route directions');
      }
    });
  };

  const getCurrentLocationRoute = (destinationAddress) => {
    // This will use the user's current location as the starting point
    const query = encodeURIComponent(destinationAddress);
    const url = `https://www.google.com/maps/dir/Current+Location/${query}?travelmode=driving`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open route from current location');
      }
    });
  };

  const getMultiStopDirections = (addresses) => {
    if (addresses.length === 0) {
      Alert.alert('No Addresses', 'No delivery addresses found');
      return;
    }

    if (addresses.length === 1) {
      // Single destination
      getDirections(addresses[0]);
      return;
    }

    // For multiple stops, we'll create a route with waypoints
    const destination = encodeURIComponent(addresses[addresses.length - 1]); // Last delivery
    const waypoints = addresses.slice(0, -1).map(addr => encodeURIComponent(addr)).join('|');
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open multi-stop directions');
      }
    });
  };

  const routeAllDeliveries = () => {
    if (deliveries.length === 0) {
      Alert.alert('No Deliveries', 'No deliveries available to route');
      return;
    }

    // Sort deliveries by priority and status for optimal routing
    const sortedDeliveries = [...deliveries].sort((a, b) => {
      // Priority order: assigned > picked_up > out_for_delivery > delivered
      const statusPriority = {
        'assigned': 1,
        'picked_up': 2,
        'out_for_delivery': 3,
        'delivered': 4
      };
      
      const priorityOrder = {
        'urgent': 1,
        'high': 2,
        'normal': 3
      };

      // First sort by status priority
      const statusDiff = (statusPriority[a.status] || 5) - (statusPriority[b.status] || 5);
      if (statusDiff !== 0) return statusDiff;

      // Then by delivery priority
      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    });

    const addresses = sortedDeliveries.map(delivery => delivery.address);
    
    Alert.alert(
      'Route All Deliveries',
      `Create optimized route for ${addresses.length} deliveries?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Route All', 
          onPress: () => getMultiStopDirections(addresses)
        }
      ]
    );
  };

    const getOptimizedPickupRoute = () => {
    // Get deliveries that need pickup (assigned status)
    const pickupDeliveries = deliveries.filter(d => 
      d.status === 'assigned' && d.pickupAddress
    );

    if (pickupDeliveries.length === 0) {
      Alert.alert('No Pickups Needed', 'All orders are already picked up or out for delivery');
      return;
    }

    // Create route through all pickup locations
    const pickupAddresses = pickupDeliveries.map(d => d.pickupAddress);
    
    Alert.alert(
      'Pickup Route',
      `Create route for ${pickupAddresses.length} pickup locations?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Route Pickups', 
          onPress: () => getMultiStopDirections(pickupAddresses)
        }
      ]
    );
  };

  const getNextDeliveryRoute = () => {
    // Get pending deliveries (assigned or picked_up)
    const pendingDeliveries = deliveries.filter(d => 
      d.status === 'assigned' || d.status === 'picked_up'
    );

    if (pendingDeliveries.length === 0) {
      Alert.alert('No Active Deliveries', 'All deliveries are completed or out for delivery');
      return;
    }

    // Sort by priority
    const sortedPending = pendingDeliveries.sort((a, b) => {
      const priorityOrder = { 'urgent': 1, 'high': 2, 'normal': 3 };
      const statusOrder = { 'assigned': 1, 'picked_up': 2 };
      
      // First by status (assigned first)
      const statusDiff = (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3);
      if (statusDiff !== 0) return statusDiff;
      
      // Then by priority
      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    });

    if (sortedPending.length === 1) {
      getDirections(sortedPending[0].address);
    } else {
      const addresses = sortedPending.map(d => d.address);
      Alert.alert(
        'Next Deliveries',
        `Route to ${sortedPending.length} pending deliveries?`,
        [
          { text: 'Just Next', onPress: () => getDirections(sortedPending[0].address) },
          { text: 'Route All Pending', onPress: () => getMultiStopDirections(addresses) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      assigned: colors.primary.yellow2,
      picked_up: colors.primary.yellow1, 
      out_for_delivery: colors.primary.yellow3,
      delivered: colors.neutrals.dark
    };
    return statusColors[status] || colors.neutrals.gray;
  };

  const getStatusText = (status) => {
    const texts = {
      assigned: 'Assigned',
      picked_up: 'Picked Up',
      out_for_delivery: 'Out for Delivery', 
      delivered: 'Delivered'
    };
    return texts[status] || status;
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return 'alert-circle';
      case 'high': return 'chevron-up';
      default: return 'remove';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#FF6B6B';
      case 'high': return '#FFA726';
      default: return colors.neutrals.gray;
    }
  };

  const renderDeliveryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.deliveryItem}
      onPress={() => {
        setSelectedDelivery(item);
        setShowDeliveryDetails(true);
      }}
    >
      <View style={styles.deliveryHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>{item.id}</Text>
          <View style={[styles.priorityBadge, { borderColor: getPriorityColor(item.priority) }]}>
            <Ionicons 
              name={getPriorityIcon(item.priority)} 
              size={12} 
              color={getPriorityColor(item.priority)} 
            />
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <Text style={styles.customerName}>{item.customerName}</Text>
      
      {/* Pickup Location */}
      {item.vendorName && item.pickupAddress && (
        <View style={styles.locationSection}>
          <View style={styles.locationHeader}>
            <Ionicons name="storefront" size={16} color={colors.primary.yellow2} />
            <Text style={styles.locationLabel}>Pickup from:</Text>
          </View>
          <Text style={styles.vendorName}>{item.vendorName}</Text>
          <Text style={styles.pickupAddress} numberOfLines={2}>{item.pickupAddress}</Text>
        </View>
      )}
      
      {/* Delivery Address */}
      <View style={styles.locationSection}>
        <View style={styles.locationHeader}>
          <Ionicons name="location" size={16} color={colors.neutrals.gray} />
          <Text style={styles.locationLabel}>Deliver to:</Text>
        </View>
        <Text style={styles.address} numberOfLines={2}>{item.address}</Text>
      </View>

      <View style={styles.deliveryMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="navigate-outline" size={14} color={colors.neutrals.gray} />
          <Text style={styles.metaText}>{item.distance}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={colors.neutrals.gray} />
          <Text style={styles.metaText}>{item.estimatedTime}</Text>
        </View>
        <Text style={styles.amount}>{item.amount}</Text>
      </View>

      <View style={styles.actionButtons}>
        {/* Pickup Navigation */}
        {item.pickupAddress && (
          <TouchableOpacity 
            style={styles.pickupButton}
            onPress={() => getPickupDirections(item.pickupAddress)}
          >
            <Ionicons name="storefront-outline" size={16} color={colors.primary.yellow2} />
            <Text style={styles.pickupButtonText}>To Store</Text>
          </TouchableOpacity>
        )}
        
        {/* Delivery Navigation */}
        <TouchableOpacity 
          style={styles.directionsButton}
          onPress={() => getDirections(item.address, 'delivery')}
        >
          <Ionicons name="navigate" size={16} color="white" />
          <Text style={styles.directionsButtonText}>To Customer</Text>
        </TouchableOpacity>

        {/* Full Route */}
        {item.pickupAddress && (
          <TouchableOpacity 
            style={styles.routeButton}
            onPress={() => getFullRoute(item.pickupAddress, item.address)}
          >
            <Ionicons name="git-network-outline" size={16} color="white" />
            <Text style={styles.routeButtonText}>Full Route</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.neutrals.dark} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Delivery Locations</Text>
          <Text style={styles.headerSubtitle}>
            {deliveries.length} {deliveries.length === 1 ? 'delivery' : 'deliveries'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.routeAllButton}
            onPress={() => {
              if (deliveries.length > 1) {
                Alert.alert(
                  'Create Route',
                  'Choose routing option:',
                  [
                    { 
                      text: 'Optimized Route', 
                      onPress: routeAllDeliveries
                    },
                    { 
                      text: 'All Locations', 
                      onPress: () => {
                        const addresses = deliveries.map(d => d.address);
                        getMultiStopDirections(addresses);
                      }
                    },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              } else {
                routeAllDeliveries();
              }
            }}
          >
            <Ionicons name="git-network-outline" size={20} color={colors.primary.yellow2} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => {
              // Refresh delivery locations
              Alert.alert('Refreshed', 'Delivery locations updated');
            }}
          >
            <Ionicons name="refresh-outline" size={24} color={colors.neutrals.dark} />
          </TouchableOpacity>
        </View>
      </View>


      {/* Delivery List */}
      <View style={styles.deliveriesSection}>
        {deliveries.length > 0 ? (
          <FlatList
            data={deliveries}
            renderItem={renderDeliveryItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.deliveriesList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={48} color={colors.neutrals.gray} />
            <Text style={styles.emptyText}>No deliveries to show</Text>
            <Text style={styles.emptySubtext}>
              Delivery locations will appear here
            </Text>
          </View>
        )}
      </View>

      {/* Delivery Details Modal */}
      <Modal
        visible={showDeliveryDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDeliveryDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedDelivery && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity 
                    onPress={() => setShowDeliveryDetails(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color={colors.neutrals.gray} />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>{selectedDelivery.id}</Text>
                  <View style={styles.headerSpacer} />
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.customerSection}>
                    <Text style={styles.sectionLabel}>Customer</Text>
                    <Text style={styles.customerDetailName}>{selectedDelivery.customerName}</Text>
                    <Text style={styles.customerPhone}>{selectedDelivery.customerPhone}</Text>
                  </View>

                  {/* Pickup Location Section */}
                  {selectedDelivery.vendorName && selectedDelivery.pickupAddress && (
                    <View style={styles.pickupDetailSection}>
                      <Text style={styles.sectionLabel}>Pickup Location</Text>
                      <View style={styles.locationCard}>
                        <Ionicons name="storefront" size={20} color={colors.primary.yellow2} />
                        <View style={styles.locationDetails}>
                          <Text style={styles.vendorDetailName}>{selectedDelivery.vendorName}</Text>
                          <Text style={styles.pickupDetailAddress}>{selectedDelivery.pickupAddress}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.locationActions}>
                        <TouchableOpacity 
                          style={styles.pickupNavButton}
                          onPress={() => {
                            setShowDeliveryDetails(false);
                            openGoogleMaps(selectedDelivery.pickupAddress, selectedDelivery.vendorName);
                          }}
                        >
                          <Ionicons name="map" size={16} color={colors.primary.yellow2} />
                          <Text style={styles.pickupNavText}>View Store</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.pickupDirectionsButton}
                          onPress={() => {
                            setShowDeliveryDetails(false);
                            getPickupDirections(selectedDelivery.pickupAddress);
                          }}
                        >
                          <Ionicons name="navigate" size={16} color="white" />
                          <Text style={styles.pickupDirectionsText}>To Store</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <View style={styles.addressDetailSection}>
                    <Text style={styles.sectionLabel}>Delivery Address</Text>
                    <View style={styles.addressCard}>
                      <Ionicons name="location" size={20} color={colors.primary.yellow2} />
                      <Text style={styles.fullAddress}>{selectedDelivery.address}</Text>
                    </View>
                  </View>

                  <View style={styles.deliveryInfoSection}>
                    <Text style={styles.sectionLabel}>Delivery Information</Text>
                    <View style={styles.infoGrid}>
                      <View style={styles.infoItem}>
                        <Ionicons name="navigate" size={16} color={colors.neutrals.gray} />
                        <Text style={styles.infoLabel}>Distance</Text>
                        <Text style={styles.infoValue}>{selectedDelivery.distance}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Ionicons name="time" size={16} color={colors.neutrals.gray} />
                        <Text style={styles.infoLabel}>Est. Time</Text>
                        <Text style={styles.infoValue}>{selectedDelivery.estimatedTime}</Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalActions}>
                  {/* Full Route Navigation */}
                  {selectedDelivery.pickupAddress && (
                    <TouchableOpacity 
                      style={styles.fullRouteButton}
                      onPress={() => {
                        setShowDeliveryDetails(false);
                        getFullRoute(selectedDelivery.pickupAddress, selectedDelivery.address);
                      }}
                    >
                      <Ionicons name="git-network-outline" size={18} color="white" />
                      <Text style={styles.fullRouteText}>Full Route</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                    style={styles.modalMapButton}
                    onPress={() => {
                      setShowDeliveryDetails(false);
                      openGoogleMaps(selectedDelivery.address, selectedDelivery.customerName);
                    }}
                  >
                    <Ionicons name="map" size={18} color={colors.primary.yellow2} />
                    <Text style={styles.modalMapText}>View Customer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.modalDirectionsButton}
                    onPress={() => {
                      setShowDeliveryDetails(false);
                      getDirections(selectedDelivery.address, 'customer');
                    }}
                  >
                    <Ionicons name="navigate" size={18} color="white" />
                    <Text style={styles.modalDirectionsText}>To Customer</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutrals.lightGray,
  },
  header: {
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.neutrals.lightGray,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutrals.dark,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.neutrals.gray,
    marginTop: 2,
    fontFamily: typography.fontFamily.regular,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeAllButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.primary.yellow1,
    borderWidth: 1,
    borderColor: colors.primary.yellow2,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.neutrals.lightGray,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.yellow1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary.yellow2,
    gap: 4,
  },
  quickActionText: {
    fontSize: 11,
    color: colors.neutrals.dark,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
  deliveriesSection: {
    flex: 1,
    marginTop: 8,
  },
  deliveriesList: {
    paddingBottom: 24,
    paddingTop: 8,
  },
  deliveryItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.neutrals.lightGray,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutrals.dark,
    letterSpacing: -0.2,
  },
  priorityBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    color: 'white',
    fontFamily: typography.fontFamily.medium,
  },
  customerName: {
    fontSize: 15,
    color: colors.neutrals.dark,
    fontFamily: typography.fontFamily.medium,
    marginBottom: 8,
  },
  locationSection: {
    marginBottom: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  locationLabel: {
    fontSize: 12,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  vendorName: {
    fontSize: 14,
    color: colors.neutrals.dark,
    fontFamily: typography.fontFamily.medium,
    marginBottom: 2,
    marginLeft: 22,
  },
  pickupAddress: {
    fontSize: 13,
    color: colors.neutrals.gray,
    marginLeft: 22,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  address: {
    fontSize: 13,
    color: colors.neutrals.gray,
    flex: 1,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    marginLeft: 22,
  },
  deliveryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutrals.lightGray,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.regular,
  },
  amount: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutrals.dark,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  pickupButton: {
    flex: 1,
    minWidth: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary.yellow2,
    backgroundColor: colors.primary.yellow1,
    gap: 4,
  },
  pickupButtonText: {
    color: colors.primary.yellow2,
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
  },
  mapButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary.yellow2,
    backgroundColor: colors.primary.yellow1,
    gap: 6,
  },
  mapButtonText: {
    color: colors.primary.yellow2,
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
  },
  directionsButton: {
    flex: 1,
    minWidth: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: colors.primary.yellow2,
    gap: 4,
  },
  directionsButtonText: {
    color: 'white',
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
  },
  routeButton: {
    flex: 1,
    minWidth: 85,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: colors.neutrals.dark,
    gap: 4,
  },
  routeButtonText: {
    color: 'white',
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.medium,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.neutrals.gray,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: typography.fontFamily.regular,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  closeButton: {
    padding: 4,
    borderRadius: 16,
    backgroundColor: colors.neutrals.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutrals.dark,
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 32,
  },
  modalBody: {
    maxHeight: 400,
  },
  customerSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  sectionLabel: {
    fontSize: 12,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  customerDetailName: {
    fontSize: 16,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.regular,
  },
  pickupDetailSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.neutrals.lightGray,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 12,
  },
  locationDetails: {
    flex: 1,
  },
  vendorDetailName: {
    fontSize: 15,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
    marginBottom: 4,
  },
  pickupDetailAddress: {
    fontSize: 13,
    color: colors.neutrals.gray,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
  },
  locationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  pickupNavButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary.yellow2,
    backgroundColor: colors.primary.yellow1,
    gap: 6,
  },
  pickupNavText: {
    color: colors.primary.yellow2,
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
  },
  pickupDirectionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary.yellow2,
    gap: 6,
  },
  pickupDirectionsText: {
    color: 'white',
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
  },
  addressDetailSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.neutrals.lightGray,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  fullAddress: {
    fontSize: 14,
    color: colors.neutrals.dark,
    lineHeight: 20,
    flex: 1,
    fontFamily: typography.fontFamily.regular,
  },
  deliveryInfoSection: {
    padding: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.neutrals.lightGray,
    padding: 16,
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.neutrals.gray,
    marginTop: 8,
    marginBottom: 4,
    fontFamily: typography.fontFamily.regular,
  },
  infoValue: {
    fontSize: 13,
    color: colors.neutrals.dark,
    fontFamily: typography.fontFamily.medium,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 8,
    flexWrap: 'wrap',
  },
  fullRouteButton: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.neutrals.dark,
    gap: 6,
    marginBottom: 8,
  },
  fullRouteText: {
    color: 'white',
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
  },
  modalMapButton: {
    flex: 1,
    minWidth: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary.yellow2,
    backgroundColor: colors.primary.yellow1,
    gap: 8,
  },
  modalMapText: {
    color: colors.primary.yellow2,
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
  },
  modalDirectionsButton: {
    flex: 1,
    minWidth: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary.yellow2,
    gap: 8,
  },
  modalDirectionsText: {
    color: 'white',
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
  },
});

export default Maps;