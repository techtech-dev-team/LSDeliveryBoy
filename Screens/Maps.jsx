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

  const getDirections = (address) => {
    const query = encodeURIComponent(address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open directions');
      }
    });
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
      
      <View style={styles.addressSection}>
        <Ionicons name="location-outline" size={16} color={colors.neutrals.gray} />
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
        <TouchableOpacity 
          style={styles.mapButton}
          onPress={() => openGoogleMaps(item.address, item.customerName)}
        >
          <Ionicons name="map-outline" size={16} color={colors.primary.yellow2} />
          <Text style={styles.mapButtonText}>View</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.directionsButton}
          onPress={() => getDirections(item.address)}
        >
          <Ionicons name="navigate" size={16} color="white" />
          <Text style={styles.directionsButtonText}>Directions</Text>
        </TouchableOpacity>
      </View>
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
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Delivery Locations</Text>
          <Text style={styles.headerSubtitle}>
            {deliveries.length} {deliveries.length === 1 ? 'delivery' : 'deliveries'}
          </Text>
        </View>

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

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => {
            const allAddresses = deliveries.map(d => d.address).join(' | ');
            getDirections(allAddresses);
          }}
        >
          <Ionicons name="map" size={20} color={colors.primary.yellow2} />
          <Text style={styles.quickActionText}>Route All</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => {
            const nextDelivery = deliveries.find(d => d.status === 'assigned' || d.status === 'picked_up');
            if (nextDelivery) {
              getDirections(nextDelivery.address);
            } else {
              Alert.alert('No Active Deliveries', 'All deliveries are completed or out for delivery');
            }
          }}
        >
          <Ionicons name="navigate-circle" size={20} color={colors.primary.yellow2} />
          <Text style={styles.quickActionText}>Next Delivery</Text>
        </TouchableOpacity>
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
                  <TouchableOpacity 
                    style={styles.modalMapButton}
                    onPress={() => {
                      setShowDeliveryDetails(false);
                      openGoogleMaps(selectedDelivery.address, selectedDelivery.customerName);
                    }}
                  >
                    <Ionicons name="map" size={18} color={colors.primary.yellow2} />
                    <Text style={styles.modalMapText}>View on Map</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.modalDirectionsButton}
                    onPress={() => {
                      setShowDeliveryDetails(false);
                      getDirections(selectedDelivery.address);
                    }}
                  >
                    <Ionicons name="navigate" size={18} color="white" />
                    <Text style={styles.modalDirectionsText}>Get Directions</Text>
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
    paddingTop:Platform.OS === 'android' ? StatusBar.currentHeight : 45,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: colors.neutrals.dark,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.neutrals.gray,
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutrals.lightGray,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: colors.neutrals.dark,
    fontWeight: '500',
  },
  deliveriesSection: {
    flex: 1,
  },
  deliveriesList: {
    paddingBottom: 24,
  },
  deliveryItem: {
    backgroundColor: 'white',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
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
  },
  orderId: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.neutrals.dark,
  },
  priorityBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  customerName: {
    fontSize: 16,
    color: colors.neutrals.dark,
    fontWeight: '400',
    marginBottom: 8,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  address: {
    fontSize: 14,
    color: colors.neutrals.gray,
    flex: 1,
    lineHeight: 20,
  },
  deliveryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.neutrals.gray,
  },
  amount: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.neutrals.dark,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mapButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary.yellow2,
    backgroundColor: 'white',
    gap: 6,
  },
  mapButtonText: {
    color: colors.primary.yellow2,
    fontSize: 14,
    fontWeight: '500',
  },
  directionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary.yellow2,
    gap: 6,
  },
  directionsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    color: colors.neutrals.gray,
    fontWeight: '300',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.neutrals.gray,
    marginTop: 8,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: colors.neutrals.dark,
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 32,
  },
  modalBody: {
    maxHeight: 400,
  },
  customerSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  sectionLabel: {
    fontSize: 12,
    color: colors.neutrals.gray,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  customerDetailName: {
    fontSize: 18,
    fontWeight: '400',
    color: colors.neutrals.dark,
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: colors.neutrals.gray,
  },
  addressDetailSection: {
    padding: 24,
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
    fontSize: 15,
    color: colors.neutrals.dark,
    lineHeight: 22,
    flex: 1,
  },
  deliveryInfoSection: {
    padding: 24,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.neutrals.lightGray,
    padding: 16,
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.neutrals.gray,
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: colors.neutrals.dark,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  modalMapButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary.yellow2,
    backgroundColor: 'white',
    gap: 8,
  },
  modalMapText: {
    color: colors.primary.yellow2,
    fontSize: 16,
    fontWeight: '500',
  },
  modalDirectionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.primary.yellow2,
    gap: 8,
  },
  modalDirectionsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Maps;