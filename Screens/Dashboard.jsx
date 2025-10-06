import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { colors } from '../components/colors';

const Dashboard = ({ navigation }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notifications, setNotifications] = useState(3); // Badge count
  const [showNotifications, setShowNotifications] = useState(false);

  // Sample delivery data
  const [deliveries, setDeliveries] = useState([
    {
      id: 'ORD001',
      customerName: 'Rahul Sharma',
      customerPhone: '+91 9876543210',
      address: 'Shop No. 15, MG Road, Sector 14, Gurgaon',
      items: ['2x Samosa', '1x Chai', '3x Biscuits'],
      amount: '₹85',
      status: 'assigned', // assigned, picked_up, out_for_delivery, delivered
      distance: '2.3 km',
      estimatedTime: '15 mins'
    },
    {
      id: 'ORD002',
      customerName: 'Priya Singh',
      customerPhone: '+91 9123456789',
      address: 'A-201, Green Valley Apartments, Sector 12',
      items: ['1x Tea', '4x Parle-G', '1x Maggi'],
      amount: '₹45',
      status: 'picked_up',
      distance: '1.8 km',
      estimatedTime: '12 mins'
    },
    {
      id: 'ORD003',
      customerName: 'Amit Kumar',
      customerPhone: '+91 9988776655',
      address: 'Office Complex, Block B, Cyber City',
      items: ['3x Coffee', '2x Sandwich'],
      amount: '₹120',
      status: 'out_for_delivery',
      distance: '3.1 km',
      estimatedTime: '20 mins'
    }
  ]);

  const issueTypes = [
    'Order Not Found',
    'Customer Unavailable',
    'Wrong Address', 
    'Payment Issue',
    'Item Damaged',
    'Other Issue'
  ];

  const notificationsList = [
    'New delivery assigned: Order #ORD004',
    'Order #ORD001 pickup reminder',
    'Daily earnings updated: ₹450'
  ];

  const handleAvailabilityToggle = () => {
    setIsOnline(!isOnline);
    Alert.alert(
      'Status Updated',
      `You are now ${!isOnline ? 'online' : 'offline'}`,
      [{ text: 'OK' }]
    );
  };

  const handleStatusUpdate = (orderId, newStatus) => {
    setDeliveries(prev => 
      prev.map(delivery => 
        delivery.id === orderId 
          ? { ...delivery, status: newStatus }
          : delivery
      )
    );

    const statusMessages = {
      picked_up: 'Order marked as picked up',
      out_for_delivery: 'Order is now out for delivery',
      delivered: 'Order marked as delivered'
    };

    Alert.alert('Status Updated', statusMessages[newStatus]);
  };

  const handleReportIssue = (orderId, issue) => {
    Alert.alert(
      'Issue Reported',
      `Issue "${issue}" reported for order ${orderId}`,
      [{ text: 'OK' }]
    );
    setShowIssueModal(false);
    setSelectedOrder(null);
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

  const renderDeliveryCard = ({ item }) => (
    <View style={styles.deliveryCard}>
      {/* Order Header */}
      <View style={styles.cardHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.amount}>{item.amount}</Text>
      </View>

      {/* Customer Info */}
      <View style={styles.customerSection}>
        <View style={styles.customerInfo}>
          <Ionicons name="person-outline" size={16} color={colors.neutrals.gray} />
          <Text style={styles.customerName}>{item.customerName}</Text>
        </View>
        <TouchableOpacity style={styles.phoneButton}>
          <Ionicons name="call-outline" size={16} color={colors.neutrals.dark} />
        </TouchableOpacity>
      </View>

      {/* Address */}
      <View style={styles.addressSection}>
        <Ionicons name="location-outline" size={16} color={colors.neutrals.gray} />
        <Text style={styles.address}>{item.address}</Text>
      </View>

      {/* Items */}
      <View style={styles.itemsSection}>
        <Text style={styles.itemsLabel}>Items:</Text>
        <Text style={styles.items}>{item.items.join(', ')}</Text>
      </View>

      {/* Distance & Time */}
      <View style={styles.metaInfo}>
        <View style={styles.metaItem}>
          <Ionicons name="navigate-outline" size={14} color={colors.neutrals.gray} />
          <Text style={styles.metaText}>{item.distance}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={colors.neutrals.gray} />
          <Text style={styles.metaText}>{item.estimatedTime}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {item.status === 'assigned' && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.primaryBtn]}
            onPress={() => handleStatusUpdate(item.id, 'picked_up')}
          >
            <Text style={styles.actionBtnText}>Mark Picked Up</Text>
          </TouchableOpacity>
        )}
        
        {item.status === 'picked_up' && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.primaryBtn]}
            onPress={() => handleStatusUpdate(item.id, 'out_for_delivery')}
          >
            <Text style={styles.actionBtnText}>Out for Delivery</Text>
          </TouchableOpacity>
        )}
        
        {item.status === 'out_for_delivery' && (
          <>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.cameraBtn]}
              onPress={() => navigation.navigate('Camera', { 
                type: 'delivery-proof', 
                orderId: item.id 
              })}
            >
              <Ionicons name="camera-outline" size={16} color="white" />
              <Text style={styles.actionBtnText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.primaryBtn]}
              onPress={() => handleStatusUpdate(item.id, 'delivered')}
            >
              <Text style={styles.actionBtnText}>Mark Delivered</Text>
            </TouchableOpacity>
          </>
        )}

        {item.status !== 'delivered' && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.secondaryBtn]}
            onPress={() => {
              setSelectedOrder(item.id);
              setShowIssueModal(true);
            }}
          >
            <Ionicons name="warning-outline" size={16} color={colors.neutrals.gray} />
            <Text style={styles.secondaryBtnText}>Report Issue</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.driverName}>Delivery Partner</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.mapButton}
            onPress={() => navigation.navigate('Maps', { deliveries })}
          >
            <Ionicons name="map-outline" size={24} color={colors.neutrals.dark} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => setShowNotifications(true)}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.neutrals.dark} />
            {notifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>{notifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Availability Toggle */}
      <View style={styles.availabilitySection}>
        <View style={styles.availabilityInfo}>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? colors.primary.yellow2 : colors.neutrals.gray }]} />
            <Text style={styles.statusLabel}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          <Text style={styles.statusSubtext}>
            {isOnline ? 'Available for deliveries' : 'Not accepting orders'}
          </Text>
        </View>
        <Switch
          value={isOnline}
          onValueChange={handleAvailabilityToggle}
          trackColor={{ false: colors.neutrals.lightGray, true: colors.primary.yellow2 }}
          thumbColor={isOnline ? 'white' : colors.neutrals.gray}
        />
      </View>

      {/* Deliveries Section */}
      <View style={styles.deliveriesSection}>
        <Text style={styles.sectionTitle}>
          Assigned Deliveries ({deliveries.length})
        </Text>
        
        {deliveries.length > 0 ? (
          <FlatList
            data={deliveries}
            renderItem={renderDeliveryCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.deliveriesList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bicycle-outline" size={48} color={colors.neutrals.gray} />
            <Text style={styles.emptyText}>No deliveries assigned</Text>
            <Text style={styles.emptySubtext}>
              Turn online to start receiving orders
            </Text>
          </View>
        )}
      </View>

      {/* Issue Report Modal */}
      <Modal
        visible={showIssueModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowIssueModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Issue</Text>
              <Text style={styles.modalSubtitle}>
                Order: {selectedOrder}
              </Text>
            </View>

            <ScrollView style={styles.issuesList}>
              {issueTypes.map((issue, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.issueOption}
                  onPress={() => handleReportIssue(selectedOrder, issue)}
                >
                  <Text style={styles.issueText}>{issue}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.neutrals.gray} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowIssueModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
            </View>

            <ScrollView style={styles.notificationsList}>
              {notificationsList.map((notification, index) => (
                <View key={index} style={styles.notificationItem}>
                  <View style={styles.notificationDot} />
                  <Text style={styles.notificationText}>{notification}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowNotifications(false);
                setNotifications(0);
              }}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
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
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
    backgroundColor: 'white',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: colors.neutrals.gray,
    fontWeight: '400',
  },
  driverName: {
    fontSize: 24,
    color: colors.neutrals.dark,
    fontWeight: '300',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  mapButton: {
    padding: 12,
    marginRight: 8,
  },
  notificationButton: {
    position: 'relative',
    padding: 12,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.primary.yellow2,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  availabilitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 32,
    marginVertical: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutrals.lightGray,
  },
  availabilityInfo: {
    flex: 1,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '400',
    color: colors.neutrals.dark,
  },
  statusSubtext: {
    fontSize: 14,
    color: colors.neutrals.gray,
    marginTop: 4,
    fontWeight: '400',
  },
  deliveriesSection: {
    flex: 1,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.neutrals.dark,
    marginBottom: 20,
    paddingHorizontal: 32,
    letterSpacing: -0.5,
  },
  deliveriesList: {
    paddingBottom: 32,
  },
  deliveryCard: {
    backgroundColor: 'white',
    marginHorizontal: 32,
    marginBottom: 16,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.neutrals.lightGray,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.neutrals.dark,
    marginRight: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  amount: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.neutrals.dark,
    letterSpacing: -0.5,
  },
  customerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    color: colors.neutrals.dark,
    fontWeight: '400',
    marginLeft: 12,
  },
  phoneButton: {
    padding: 12,
    backgroundColor: colors.neutrals.lightGray,
    borderRadius: 12,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  address: {
    fontSize: 14,
    color: colors.neutrals.gray,
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  itemsSection: {
    marginBottom: 16,
  },
  itemsLabel: {
    fontSize: 12,
    color: colors.neutrals.gray,
    fontWeight: '400',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  items: {
    fontSize: 14,
    color: colors.neutrals.dark,
    lineHeight: 22,
    fontWeight: '400',
  },
  metaInfo: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  metaText: {
    fontSize: 12,
    color: colors.neutrals.gray,
    marginLeft: 6,
    fontWeight: '400',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: colors.neutrals.dark,
  },
  cameraBtn: {
    backgroundColor: colors.primary.yellow2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  secondaryBtn: {
    backgroundColor: colors.neutrals.lightGray,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.neutrals.gray,
  },
  actionBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '400',
  },
  secondaryBtnText: {
    color: colors.neutrals.gray,
    fontSize: 14,
    fontWeight: '400',
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
    fontWeight: '400',
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
    maxHeight: '70%',
  },
  modalHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.neutrals.dark,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.neutrals.gray,
    textAlign: 'center',
    marginTop: 6,
  },
  issuesList: {
    maxHeight: 300,
  },
  issueOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  issueText: {
    fontSize: 16,
    color: colors.neutrals.dark,
    fontWeight: '400',
  },
  notificationsList: {
    maxHeight: 300,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  notificationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary.yellow2,
    marginTop: 8,
    marginRight: 12,
  },
  notificationText: {
    fontSize: 14,
    color: colors.neutrals.dark,
    flex: 1,
    lineHeight: 22,
    fontWeight: '400',
  },
  cancelButton: {
    padding: 24,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.neutrals.gray,
    fontWeight: '400',
  },
});

export default Dashboard;
