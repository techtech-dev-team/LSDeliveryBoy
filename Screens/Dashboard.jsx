import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { colors } from '../components/colors';
import { DashboardAPI, DashboardDataTransformer } from '../Utils/Dashboard';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Dashboard = ({ navigation }) => {
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Dashboard states
  const [isOnline, setIsOnline] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notifications, setNotifications] = useState(0); // Badge count
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  
  // API Data states
  const [dashboardStats, setDashboardStats] = useState({
    todayStats: {
      totalOrders: 0,
      completedOrders: 0,
      earnings: 0
    }
  });
  const [deliveries, setDeliveries] = useState([]);
  
  // Delivery Boy Type Management
  const [deliveryBoyType, setDeliveryBoyType] = useState('lalaji_store'); // 'lalaji_store' or 'vendor_managed'
  const [assignedVendor, setAssignedVendor] = useState({
    id: 'VENDOR001',
    name: 'Sharma General Store',
    location: 'Sector 15, Gurgaon'
  }); // For vendor-managed delivery boys
  const [deliveryBoyInfo, setDeliveryBoyInfo] = useState({
    id: 'DB001',
    name: 'Raj Kumar',
    phone: '+91 9876543210',
    isVerified: true,
    approvalStatus: 'approved' // 'pending', 'approved', 'rejected'
  });



  const issueTypes = [
    'Order Not Found',
    'Customer Unavailable',
    'Wrong Address', 
    'Payment Issue',
    'Item Damaged',
    'Other Issue'
  ];

  // Notifications state
  const [notificationsList, setNotificationsList] = useState([]);

  // Filter deliveries based on delivery boy type
  const getFilteredDeliveries = () => {
    return deliveries.filter(delivery => {
      if (deliveryBoyType === 'lalaji_store') {
        return delivery.assignedBy === 'system' && delivery.orderType === 'lalaji_store';
      } else if (deliveryBoyType === 'vendor_managed') {
        return delivery.assignedBy === 'vendor' && 
               delivery.assignedVendor === assignedVendor?.id &&
               delivery.orderType === 'vendor_managed';
      }
      return false;
    });
  };

  const filteredDeliveries = getFilteredDeliveries();

  // API Integration Functions
  const loadDashboardData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      const response = await DashboardAPI.getDashboard();
      
      if (response.success) {
        const transformedData = DashboardDataTransformer.transformDashboardStats(response.data);
        
        // Update dashboard stats
        setDashboardStats(transformedData.todayStats);
        
        // Update deliveries
        setDeliveries(transformedData.pendingOrders);
        
        // Update online status
        setIsOnline(transformedData.currentStatus === 'online');
        
        // Load notifications
        loadNotifications();
        
      } else {
        setError(response.error);
        Alert.alert('Error', response.error);
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
      setError('Failed to load dashboard data');
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await DashboardAPI.getNotifications();
      if (response.success) {
        setNotificationsList(response.data);
        const unreadCount = response.data.filter(n => !n.isRead).length;
        setNotifications(unreadCount);
      }
    } catch (error) {
      console.error('Notifications load error:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData(false);
  };

  // Initialize dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Push notification setup and handlers
  useEffect(() => {
    registerForPushNotificationsAsync();
    
    // Listen for notifications when app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      handleNewNotification(notification);
    });

    // Listen for notification responses (when user taps notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationResponse(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  const registerForPushNotificationsAsync = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert('Permission Required', 'Push notifications are needed for delivery assignments');
        return;
      }
    } catch (error) {
      console.log('Error setting up notifications:', error);
    }
  };

  const handleNewNotification = (notification) => {
    const { title, body, data } = notification.request.content;
    
    // Add to notifications list
    const newNotification = {
      id: `NOTIF_${Date.now()}`,
      type: data?.type || 'general',
      title: title || 'New Notification',
      message: body || '',
      timestamp: new Date(),
      isRead: false,
      orderId: data?.orderId
    };
    
    setNotificationsList(prev => [newNotification, ...prev]);
    setNotifications(prev => prev + 1);
    
    // Handle delivery-specific notifications
    if (data?.type === 'new_delivery' && data?.delivery) {
      setDeliveries(prev => [...prev, data.delivery]);
    }
  };

  const handleNotificationResponse = (response) => {
    const { data } = response.notification.request.content;
    
    if (data?.type === 'new_delivery' && data?.orderId) {
      // Navigate to specific delivery or open delivery details
      const delivery = filteredDeliveries.find(d => d.id === data.orderId);
      if (delivery) {
        setSelectedDelivery(delivery);
        setShowDeliveryDetails(true);
      }
    }
  };

  const simulateNewDeliveryAssignment = async () => {
    const newDelivery = {
      id: `ORD${Date.now()}`,
      customerName: 'Test Customer',
      customerPhone: '+91 9876543210',
      address: 'Test Address, Sector 10, Gurgaon',
      items: ['1x Test Item'],
      amount: '₹50',
      status: 'assigned',
      distance: '1.2 km',
      estimatedTime: '8 mins',
      assignedBy: deliveryBoyType === 'lalaji_store' ? 'system' : 'vendor',
      assignedVendor: deliveryBoyType === 'vendor_managed' ? assignedVendor?.id : null,
      orderType: deliveryBoyType,
      priority: 'normal'
    };

    // Send push notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Delivery Assignment! 🚚',
        body: deliveryBoyType === 'lalaji_store' 
          ? `System assigned order ${newDelivery.id}` 
          : `${assignedVendor?.name} assigned order ${newDelivery.id}`,
        data: {
          type: 'new_delivery',
          orderId: newDelivery.id,
          delivery: newDelivery
        },
      },
      trigger: { seconds: 1 },
    });
  };

  const handleAvailabilityToggle = async () => {
    try {
      const newStatus = !isOnline ? 'online' : 'offline';
      const response = await DashboardAPI.updateAvailability(newStatus);
      
      if (response.success) {
        setIsOnline(!isOnline);
        Alert.alert(
          'Status Updated',
          `You are now ${newStatus}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', response.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability status');
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await DashboardAPI.updateOrderStatus(orderId, newStatus);
      
      if (response.success) {
        // Update local state
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
        
        // Refresh dashboard data to get updated stats
        loadDashboardData(false);
      } else {
        Alert.alert('Error', response.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const handleReportIssue = async (orderId, issue) => {
    try {
      const response = await DashboardAPI.reportIssue(orderId, issue);
      
      if (response.success) {
        Alert.alert(
          'Issue Reported',
          `Issue "${issue}" reported for order ${orderId}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', response.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to report issue');
    }
    
    setShowIssueModal(false);
    setSelectedOrder(null);
  };

  const handleDeliveryCardPress = (delivery) => {
    setSelectedDelivery(delivery);
    setShowDeliveryDetails(true);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment': return 'bicycle-outline';
      case 'reminder': return 'time-outline';
      case 'earnings': return 'cash-outline';
      default: return 'notifications-outline';
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

  const renderDeliveryCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.deliveryCard}
      onPress={() => handleDeliveryCardPress(item)}
      activeOpacity={0.7}
    >
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
    </TouchableOpacity>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.yellow2} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.driverName}>{deliveryBoyInfo.name}</Text>
          <View style={styles.deliveryBoyBadge}>
            <View style={styles.badgeContent}>
              <Ionicons 
                name={deliveryBoyType === 'lalaji_store' ? 'storefront' : 'business'} 
                size={12} 
                color={colors.primary.yellow2} 
              />
              <Text style={styles.badgeText}>
                {deliveryBoyType === 'lalaji_store' ? 'Lalaji Store' : assignedVendor?.name}
              </Text>
            </View>
            {deliveryBoyInfo.isVerified && (
              <Ionicons name="checkmark-circle" size={14} color={colors.primary.yellow2} />
            )}
          </View>
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

      {/* Today's Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>Today's Summary</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="bicycle-outline" size={24} color={colors.primary.yellow2} />
            <Text style={styles.statNumber}>{dashboardStats.todayStats.totalOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.primary.yellow2} />
            <Text style={styles.statNumber}>{dashboardStats.todayStats.completedOrders}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={24} color={colors.primary.yellow2} />
            <Text style={styles.statNumber}>₹{dashboardStats.todayStats.earnings}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>
      </View>

      {/* Deliveries Section */}
      <View style={styles.deliveriesSection}>
        <View style={styles.deliveriesHeader}>
          <Text style={styles.sectionTitle}>
            {deliveryBoyType === 'lalaji_store' ? 'System Assigned' : 'Vendor Assigned'} Deliveries ({filteredDeliveries.length})
          </Text>
          <TouchableOpacity 
            style={styles.testButton}
            onPress={simulateNewDeliveryAssignment}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary.yellow2} />
          </TouchableOpacity>
        </View>
        
        {filteredDeliveries.length > 0 ? (
          <FlatList
            data={filteredDeliveries}
            renderItem={renderDeliveryCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.deliveriesList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary.yellow2]}
                tintColor={colors.primary.yellow2}
              />
            }
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
                <TouchableOpacity 
                  key={notification.id || index} 
                  style={[
                    styles.notificationItem,
                    !notification.isRead && styles.unreadNotification
                  ]}
                  onPress={() => {
                    if (notification.orderId) {
                      const delivery = filteredDeliveries.find(d => d.id === notification.orderId);
                      if (delivery) {
                        setSelectedDelivery(delivery);
                        setShowDeliveryDetails(true);
                        setShowNotifications(false);
                      }
                    }
                  }}
                >
                  <View style={[
                    styles.notificationDot,
                    { backgroundColor: notification.isRead ? colors.neutrals.gray : colors.primary.yellow2 }
                  ]} />
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationText}>{notification.message}</Text>
                    <Text style={styles.notificationTime}>
                      {notification.timestamp?.toLocaleTimeString() || 'Now'}
                    </Text>
                  </View>
                  <Ionicons 
                    name={getNotificationIcon(notification.type)} 
                    size={16} 
                    color={colors.neutrals.gray} 
                  />
                </TouchableOpacity>
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

      {/* Delivery Details Modal */}
      <Modal
        visible={showDeliveryDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDeliveryDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContent}>
            {selectedDelivery && (
              <>
                {/* Modal Header */}
                <View style={styles.detailsHeader}>
                  <TouchableOpacity 
                    onPress={() => setShowDeliveryDetails(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color={colors.neutrals.gray} />
                  </TouchableOpacity>
                  <View style={styles.headerInfo}>
                    <Text style={styles.detailsTitle}>{selectedDelivery.id}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedDelivery.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(selectedDelivery.status)}</Text>
                    </View>
                  </View>
                  <Text style={styles.detailsAmount}>{selectedDelivery.amount}</Text>
                </View>

                {/* Customer Details */}
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionLabel}>Customer Information</Text>
                  <View style={styles.customerDetails}>
                    <View style={styles.customerRow}>
                      <View style={styles.customerIcon}>
                        <Ionicons name="person" size={20} color={colors.primary.yellow2} />
                      </View>
                      <View style={styles.customerText}>
                        <Text style={styles.customerDetailName}>{selectedDelivery.customerName}</Text>
                        <TouchableOpacity style={styles.phoneRow}>
                          <Ionicons name="call" size={16} color={colors.neutrals.gray} />
                          <Text style={styles.phoneNumber}>{selectedDelivery.customerPhone}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Delivery Address */}
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionLabel}>Delivery Address</Text>
                  <View style={styles.addressDetails}>
                    <Ionicons name="location" size={20} color={colors.primary.yellow2} />
                    <Text style={styles.addressDetailText}>{selectedDelivery.address}</Text>
                  </View>
                </View>

                {/* Order Items */}
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionLabel}>Order Items</Text>
                  <View style={styles.itemsDetails}>
                    {selectedDelivery.items.map((item, index) => (
                      <View key={index} style={styles.itemRow}>
                        <View style={styles.itemDot} />
                        <Text style={styles.itemText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Delivery Info */}
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionLabel}>Delivery Information</Text>
                  <View style={styles.deliveryInfo}>
                    <View style={styles.infoRow}>
                      <View style={styles.infoIcon}>
                        <Ionicons name="navigate" size={16} color={colors.neutrals.gray} />
                      </View>
                      <Text style={styles.infoLabel}>Distance:</Text>
                      <Text style={styles.infoValue}>{selectedDelivery.distance}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <View style={styles.infoIcon}>
                        <Ionicons name="time" size={16} color={colors.neutrals.gray} />
                      </View>
                      <Text style={styles.infoLabel}>Estimated Time:</Text>
                      <Text style={styles.infoValue}>{selectedDelivery.estimatedTime}</Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.detailsActions}>
                  {selectedDelivery.status === 'assigned' && (
                    <TouchableOpacity 
                      style={[styles.detailsActionBtn, styles.primaryBtn]}
                      onPress={() => {
                        handleStatusUpdate(selectedDelivery.id, 'picked_up');
                        setShowDeliveryDetails(false);
                      }}
                    >
                      <Text style={styles.actionBtnText}>Mark as Picked Up</Text>
                    </TouchableOpacity>
                  )}
                  
                  {selectedDelivery.status === 'picked_up' && (
                    <TouchableOpacity 
                      style={[styles.detailsActionBtn, styles.primaryBtn]}
                      onPress={() => {
                        handleStatusUpdate(selectedDelivery.id, 'out_for_delivery');
                        setShowDeliveryDetails(false);
                      }}
                    >
                      <Text style={styles.actionBtnText}>Start Delivery</Text>
                    </TouchableOpacity>
                  )}
                  
                  {selectedDelivery.status === 'out_for_delivery' && (
                    <>
                      <TouchableOpacity 
                        style={[styles.detailsActionBtn, styles.cameraBtn]}
                        onPress={() => {
                          setShowDeliveryDetails(false);
                          navigation.navigate('Camera', { 
                            type: 'delivery-proof', 
                            orderId: selectedDelivery.id 
                          });
                        }}
                      >
                        <Ionicons name="camera" size={18} color="white" />
                        <Text style={styles.actionBtnText}>Take Delivery Photo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.detailsActionBtn, styles.primaryBtn]}
                        onPress={() => {
                          handleStatusUpdate(selectedDelivery.id, 'delivered');
                          setShowDeliveryDetails(false);
                        }}
                      >
                        <Text style={styles.actionBtnText}>Mark as Delivered</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  <TouchableOpacity 
                    style={[styles.detailsActionBtn, styles.mapActionBtn]}
                    onPress={() => {
                      setShowDeliveryDetails(false);
                      navigation.navigate('Maps', { delivery: selectedDelivery });
                    }}
                  >
                    <Ionicons name="map" size={18} color={colors.primary.yellow2} />
                    <Text style={styles.mapActionText}>View on Map</Text>
                  </TouchableOpacity>

                  {selectedDelivery.status !== 'delivered' && (
                    <TouchableOpacity 
                      style={[styles.detailsActionBtn, styles.issueBtn]}
                      onPress={() => {
                        setSelectedOrder(selectedDelivery.id);
                        setShowDeliveryDetails(false);
                        setShowIssueModal(true);
                      }}
                    >
                      <Ionicons name="warning" size={18} color={colors.neutrals.gray} />
                      <Text style={styles.issueBtnText}>Report Issue</Text>
                    </TouchableOpacity>
                  )}
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
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.neutrals.gray,
    fontWeight: '400',
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
  statsSection: {
    marginHorizontal: 32,
    marginVertical: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.neutrals.dark,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.neutrals.lightGray,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.neutrals.dark,
    marginTop: 8,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: colors.neutrals.gray,
    textAlign: 'center',
    fontWeight: '400',
  },
  deliveryBoyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutrals.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    maxWidth: 200,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  badgeText: {
    fontSize: 11,
    color: colors.neutrals.dark,
    fontWeight: '500',
    marginLeft: 6,
  },
  deliveriesSection: {
    flex: 1,
    paddingTop: 8,
  },
  deliveriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.neutrals.dark,
    letterSpacing: -0.5,
    flex: 1,
  },
  testButton: {
    padding: 8,
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
  unreadNotification: {
    backgroundColor: colors.neutrals.lightGray + '30',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.yellow2,
    marginTop: 8,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    color: colors.neutrals.dark,
    fontWeight: '500',
    marginBottom: 2,
  },
  notificationText: {
    fontSize: 13,
    color: colors.neutrals.gray,
    lineHeight: 18,
    fontWeight: '400',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    color: colors.neutrals.gray,
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
  // Delivery Details Modal Styles
  detailsModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  detailsHeader: {
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
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: colors.neutrals.dark,
    letterSpacing: -0.5,
  },
  detailsAmount: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.neutrals.dark,
    letterSpacing: -0.5,
  },
  detailsSection: {
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
    marginBottom: 16,
  },
  customerDetails: {
    backgroundColor: colors.neutrals.lightGray,
    borderRadius: 16,
    padding: 16,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  customerText: {
    flex: 1,
  },
  customerDetailName: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.neutrals.dark,
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phoneNumber: {
    fontSize: 14,
    color: colors.neutrals.gray,
    fontWeight: '400',
  },
  addressDetails: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.neutrals.lightGray,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  addressDetailText: {
    fontSize: 15,
    color: colors.neutrals.dark,
    lineHeight: 22,
    flex: 1,
    fontWeight: '400',
  },
  itemsDetails: {
    backgroundColor: colors.neutrals.lightGray,
    borderRadius: 16,
    padding: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary.yellow2,
    marginRight: 12,
  },
  itemText: {
    fontSize: 15,
    color: colors.neutrals.dark,
    fontWeight: '400',
  },
  deliveryInfo: {
    backgroundColor: colors.neutrals.lightGray,
    borderRadius: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.neutrals.gray,
    fontWeight: '400',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: colors.neutrals.dark,
    fontWeight: '500',
  },
  detailsActions: {
    padding: 24,
    gap: 12,
  },
  detailsActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  mapActionBtn: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.primary.yellow2,
  },
  mapActionText: {
    color: colors.primary.yellow2,
    fontSize: 16,
    fontWeight: '400',
  },
  issueBtn: {
    backgroundColor: colors.neutrals.lightGray,
    borderWidth: 1,
    borderColor: colors.neutrals.gray,
  },
  issueBtnText: {
    color: colors.neutrals.gray,
    fontSize: 16,
    fontWeight: '400',
  },
});

export default Dashboard;
