import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { colors, typography } from '../components/colors';
import { dashboardAPI } from '../utils/dashboard';

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
  
  // Auto status management states
  const [showGoOnlinePrompt, setShowGoOnlinePrompt] = useState(false);
  const [hasCheckedInitialStatus, setHasCheckedInitialStatus] = useState(false);
  
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

  // Auto status management based on order count
  const checkAndManageStatus = async (currentDeliveries = deliveries, currentOnlineStatus = isOnline) => {
    const activeOrders = currentDeliveries.filter(delivery => 
      ['assigned', 'picked_up', 'out_for_delivery'].includes(delivery.status)
    );
    
    console.log(`📊 Active orders count: ${activeOrders.length}, Current status: ${currentOnlineStatus ? 'online' : 'offline'}`);
    
    // If has more than 2 active orders and currently online, automatically go offline
    if (activeOrders.length > 2 && currentOnlineStatus) {
      console.log('🔴 Too many orders (>2), automatically going offline...');
      try {
        const response = await dashboardAPI.updateAvailability('offline');
        if (response.success) {
          setIsOnline(false);
          Alert.alert(
            'Status Updated',
            `You have ${activeOrders.length} active orders. You've been automatically set to offline to prevent overload.`,
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error auto-setting offline:', error);
      }
    }
    
    // If has no active orders, offline, and hasn't been prompted yet, ask to go online
    if (activeOrders.length === 0 && !currentOnlineStatus && hasCheckedInitialStatus) {
      console.log('🟢 No active orders, prompting to go online...');
      setShowGoOnlinePrompt(true);
    }
  };

  // Handle the go online prompt response
  const handleGoOnlinePrompt = async (shouldGoOnline) => {
    setShowGoOnlinePrompt(false);
    
    if (shouldGoOnline) {
      try {
        const response = await dashboardAPI.updateAvailability('online');
        if (response.success) {
          setIsOnline(true);
          
          // Handle any new orders from going online
          if (response.data.pendingOrders && response.data.pendingOrders.length > 0) {
            const transformedOrders = response.data.pendingOrders.map(order => {
              // ... (transformation logic from handleAvailabilityToggle)
              // Handle address object - use the actual structure from API
              let addressText = 'Address not available';
              if (order.deliveryAddress) {
                if (typeof order.deliveryAddress === 'string') {
                  addressText = order.deliveryAddress;
                } else if (typeof order.deliveryAddress === 'object') {
                  const addr = order.deliveryAddress;
                  const parts = [
                    addr.address,
                    addr.landmark,
                    addr.city,
                    addr.state,
                    addr.pincode
                  ].filter(Boolean);
                  addressText = parts.length > 0 ? parts.join(', ') : 'Address not available';
                }
              }

              // Handle customer name
              let customerName = 'Unknown Customer';
              let customerPhone = '';
              
              if (order.customerInfo) {
                customerName = order.customerInfo.name || 'Unknown Customer';
                customerPhone = order.customerInfo.phone || '';
              } else if (order.customer) {
                if (order.customer.firstName || order.customer.lastName) {
                  customerName = `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim();
                } else if (order.customer.name) {
                  customerName = order.customer.name;
                }
                customerPhone = order.customer.phoneNumber || '';
              }

              // Handle vendor information
              let vendorName = '';
              let pickupAddress = '';
              if (order.vendors && order.vendors.length > 0) {
                const firstVendor = order.vendors[0];
                if (firstVendor.vendor) {
                  vendorName = firstVendor.vendor.vendorInfo?.businessName || firstVendor.vendor.name || '';
                  const businessAddr = firstVendor.vendor.vendorInfo?.businessAddress;
                  if (businessAddr) {
                    const vendorParts = [
                      businessAddr.address,
                      businessAddr.city,
                      businessAddr.state,
                      businessAddr.pincode
                    ].filter(Boolean);
                    pickupAddress = vendorParts.join(', ');
                  }
                }
              }

              // Handle items
              const itemsList = order.items?.map(item => {
                const productName = item.product?.name || item.name || 'Item';
                return `${item.quantity}x ${productName}`;
              }) || ['Items not specified'];

              return {
                id: order._id,
                mongoId: order._id,
                orderNumber: order.orderNumber,
                customerName: customerName,
                customerPhone: customerPhone,
                customerEmail: order.customerInfo?.email || '',
                address: addressText,
                items: itemsList,
                amount: `₹${(order.pricing?.total || order.totalAmount || 0).toFixed(2)}`,
                status: order.status || 'out_for_delivery',
                distance: order.deliveryDistance || 'N/A',
                estimatedTime: order.estimatedDeliveryTime || 'N/A',
                assignedBy: 'system',
                assignedVendor: order.vendors?.[0]?.vendor?._id || null,
                orderType: 'lalaji_store',
                priority: order.priority || 'normal',
                vendorName: vendorName,
                pickupAddress: pickupAddress,
                paymentMethod: order.payment?.method || 'cod',
                paymentStatus: order.payment?.status || 'pending',
                specialInstructions: order.specialInstructions || '',
                coordinates: order.deliveryAddress?.coordinates || null,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt
              };
            });
            
            setDeliveries(transformedOrders);
            
            Alert.alert(
              'You\'re Online!',
              `Great! You're now online and ready for deliveries. ${response.data.ordersCount || 0} orders available.`,
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert(
              'You\'re Online!',
              'Great! You\'re now online and ready for deliveries.',
              [{ text: 'OK' }]
            );
            // Refresh to get latest orders
            loadDashboardData(false);
          }
        }
      } catch (error) {
        console.error('Error going online:', error);
        Alert.alert('Error', 'Failed to go online. Please try again.');
      }
    }
  };

  // Load Dashboard Data from API
  const loadDashboardData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      // Fetch delivery boy profile
      try {
        const profileResponse = await dashboardAPI.getProfile();
        if (profileResponse.success) {
          const userData = profileResponse.data;
          setDeliveryBoyInfo({
            id: userData._id,
            name: userData.name || 'Unknown User',
            phone: userData.phoneNumber || '',
            isVerified: userData.isPhoneVerified || false,
            approvalStatus: userData.deliveryBoyInfo?.approvalStatus || userData.isActive ? 'approved' : 'pending'
          });
          
          // Set delivery boy type based on profile data
          if (userData.deliveryBoyInfo?.deliveryPartner) {
            setDeliveryBoyType(userData.deliveryBoyInfo.deliveryPartner === 'lalaji_network' ? 'lalaji_store' : 'vendor_managed');
          }
        }
      } catch (profileError) {
        console.warn('Profile API error:', profileError);
        // Keep existing delivery boy info if API fails
      }

      // Fetch dashboard data from API
      try {
        const dashboardResponse = await dashboardAPI.getDashboard();
        if (dashboardResponse.success) {
          // Update dashboard stats
          setDashboardStats({
            todayStats: dashboardResponse.data.todayStats || {
              totalOrders: 0,
              completedOrders: 0,
              earnings: 0
            }
          });
          
          // Set online status from API (only if not manually toggling)
          if (dashboardResponse.data.currentStatus) {
            setIsOnline(dashboardResponse.data.currentStatus === 'online');
          }
        }
      } catch (dashboardError) {
        console.error('Dashboard API error:', dashboardError);
        // Keep existing dashboard stats if API fails
      }

      // Fetch assigned deliveries from API
      try {
        const deliveriesResponse = await dashboardAPI.getAssignedDeliveries();
        if (deliveriesResponse.success) {
          // Transform API data to match component format
          const transformedDeliveries = deliveriesResponse.data.orders.map(order => {
            // Handle address object - use the actual structure from API
            let addressText = 'Address not available';
            if (order.deliveryAddress) {
              if (typeof order.deliveryAddress === 'string') {
                addressText = order.deliveryAddress;
              } else if (typeof order.deliveryAddress === 'object') {
                // Extract address from object structure
                const addr = order.deliveryAddress;
                const parts = [
                  addr.address,
                  addr.landmark,
                  addr.city,
                  addr.state,
                  addr.pincode
                ].filter(Boolean);
                addressText = parts.length > 0 ? parts.join(', ') : 'Address not available';
              }
            }

            // Handle customer name from customerInfo
            let customerName = 'Unknown Customer';
            let customerPhone = '';
            
            if (order.customerInfo) {
              customerName = order.customerInfo.name || 'Unknown Customer';
              customerPhone = order.customerInfo.phone || '';
            } else if (order.customer) {
              if (order.customer.firstName || order.customer.lastName) {
                customerName = `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim();
              } else if (order.customer.name) {
                customerName = order.customer.name;
              }
              customerPhone = order.customer.phoneNumber || '';
            }

            // Handle vendor information
            let vendorName = '';
            let pickupAddress = '';
            if (order.vendors && order.vendors.length > 0) {
              const firstVendor = order.vendors[0];
              if (firstVendor.vendor) {
                vendorName = firstVendor.vendor.vendorInfo?.businessName || firstVendor.vendor.name || '';
                const businessAddr = firstVendor.vendor.vendorInfo?.businessAddress;
                if (businessAddr) {
                  const vendorParts = [
                    businessAddr.address,
                    businessAddr.city,
                    businessAddr.state,
                    businessAddr.pincode
                  ].filter(Boolean);
                  pickupAddress = vendorParts.join(', ');
                }
              }
            }

            // Handle items with proper quantity and name formatting
            const itemsList = order.items?.map(item => {
              const productName = item.product?.name || item.name || 'Item';
              return `${item.quantity}x ${productName}`;
            }) || ['Items not specified'];

            return {
              id: order._id,
              mongoId: order._id, // Keep the actual MongoDB ID for API calls
              orderNumber: order.orderNumber,
              customerName: customerName,
              customerPhone: customerPhone,
              customerEmail: order.customerInfo?.email || '',
              address: addressText,
              items: itemsList,
              amount: `₹${(order.pricing?.total || order.totalAmount || 0).toFixed(2)}`,
              status: order.status || 'assigned',
              distance: order.deliveryDistance || 'N/A',
              estimatedTime: order.estimatedDeliveryTime || 'N/A',
              assignedBy: 'system',
              assignedVendor: order.vendors?.[0]?.vendor?._id || null,
              orderType: 'lalaji_store',
              priority: order.priority || 'normal',
              vendorName: vendorName,
              pickupAddress: pickupAddress,
              paymentMethod: order.payment?.method || 'cod',
              paymentStatus: order.payment?.status || 'pending',
              specialInstructions: order.specialInstructions || '',
              coordinates: order.deliveryAddress?.coordinates || null,
              createdAt: order.createdAt,
              updatedAt: order.updatedAt
            };
          });
          
          setDeliveries(transformedDeliveries);
          console.log(`📦 Loaded ${transformedDeliveries.length} delivery orders from API`);
        }
      } catch (deliveriesError) {
        console.error('Deliveries API error:', deliveriesError);
        // Keep existing deliveries if API fails
      }
      
      // Load notifications
      loadNotifications();
        
    } catch (error) {
      console.error('Dashboard load error:', error);
      setError('Failed to load dashboard data');
      
      // Don't show alert on every refresh, only on initial load
      if (showLoader) {
        Alert.alert(
          'Connection Error', 
          'Failed to load dashboard data. Please check your internet connection and try again.',
          [
            { text: 'Retry', onPress: () => loadDashboardData(true) },
            { text: 'Continue', style: 'cancel' }
          ]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };  const loadNotifications = async () => {
    try {
      console.log('📢 Loading notifications...');
      const response = await dashboardAPI.getNotifications();
      console.log('📢 Notifications API response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        const notifications = response.data.notifications || [];
        const unreadCount = response.data.unreadCount || 0;
        
        console.log('📢 Setting notifications:', notifications);
        console.log('📢 Setting unread count:', unreadCount);
        
        setNotificationsList(notifications);
        setNotifications(unreadCount);
        console.log(`📢 Loaded ${notifications.length} notifications from API`);
      } else {
        console.warn('📢 Notifications API failed:', response);
        console.log('📢 Using empty state due to API failure');
        setNotificationsList([]);
        setNotifications(0);
      }
    } catch (error) {
      console.error('📢 Notifications load error:', error);
      
      // For now, add some mock notifications for testing when API fails
      const mockNotifications = [
        {
          id: 'mock_1',
          type: 'assignment',
          title: 'New Order Assigned',
          message: 'You have been assigned a new delivery order #LLJ740433343',
          timestamp: new Date(),
          isRead: false,
          orderId: 'test_order_1'
        },
        {
          id: 'mock_2',
          type: 'reminder',
          title: 'Pickup Reminder',
          message: 'Order is ready for pickup from LALJI_STORE',
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
          isRead: false,
          orderId: 'test_order_2'
        },
        {
          id: 'mock_3',
          type: 'earnings',
          title: 'Payment Received',
          message: 'You received ₹45 for completed delivery',
          timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          isRead: true,
          orderId: 'test_order_3'
        }
      ];
      
      console.log('📢 Using mock notifications due to API error:', mockNotifications);
      setNotificationsList(mockNotifications);
      setNotifications(mockNotifications.filter(n => !n.isRead).length);
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

  // Auto status management - monitor delivery count changes
  useEffect(() => {
    if (hasCheckedInitialStatus) {
      checkAndManageStatus(deliveries, isOnline);
    }
  }, [deliveries.length, hasCheckedInitialStatus]);

  // Set initial status check flag after first load
  useEffect(() => {
    if (!hasCheckedInitialStatus && deliveries.length >= 0) {
      setHasCheckedInitialStatus(true);
      // Check status on initial load
      setTimeout(() => {
        checkAndManageStatus(deliveries, isOnline);
      }, 1000); // Small delay to ensure everything is loaded
    }
  }, [deliveries, hasCheckedInitialStatus]);

  // Auto-refresh orders when online
  useEffect(() => {
    let interval = null;
    
    if (isOnline) {
      // Refresh orders every 30 seconds when online
      interval = setInterval(() => {
        console.log('🔄 Auto-refreshing orders...');
        loadDashboardData(false); // Refresh without showing loader
      }, 30000); // 30 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isOnline]);

  const refreshDeliveries = async () => {
    try {
      console.log('🔄 Manually refreshing orders...');
      
      // Refresh orders from API
      await loadDashboardData(false);
      
      // Show success message
      Alert.alert(
        'Refreshed',
        'Orders refreshed successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error refreshing orders:', error);
      Alert.alert('Error', 'Failed to refresh orders');
    }
  };

  const handleAvailabilityToggle = async () => {
    try {
      const newStatus = !isOnline ? 'online' : 'offline';
      
      // Update availability status via API
      const response = await dashboardAPI.updateAvailability(newStatus);
      
      if (response.success) {
        setIsOnline(!isOnline);
        
        // If going online and we got pending orders, update the deliveries list
        if (newStatus === 'online' && response.data.pendingOrders) {
          const transformedOrders = response.data.pendingOrders.map(order => {
            // Handle address object - use the actual structure from API
            let addressText = 'Address not available';
            if (order.deliveryAddress) {
              if (typeof order.deliveryAddress === 'string') {
                addressText = order.deliveryAddress;
              } else if (typeof order.deliveryAddress === 'object') {
                // Extract address from object structure
                const addr = order.deliveryAddress;
                const parts = [
                  addr.address,
                  addr.landmark,
                  addr.city,
                  addr.state,
                  addr.pincode
                ].filter(Boolean);
                addressText = parts.length > 0 ? parts.join(', ') : 'Address not available';
              }
            }

            // Handle customer name from customerInfo
            let customerName = 'Unknown Customer';
            let customerPhone = '';
            
            if (order.customerInfo) {
              customerName = order.customerInfo.name || 'Unknown Customer';
              customerPhone = order.customerInfo.phone || '';
            } else if (order.customer) {
              if (order.customer.firstName || order.customer.lastName) {
                customerName = `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim();
              } else if (order.customer.name) {
                customerName = order.customer.name;
              }
              customerPhone = order.customer.phoneNumber || '';
            }

            // Handle vendor information
            let vendorName = '';
            let pickupAddress = '';
            if (order.vendors && order.vendors.length > 0) {
              const firstVendor = order.vendors[0];
              if (firstVendor.vendor) {
                vendorName = firstVendor.vendor.vendorInfo?.businessName || firstVendor.vendor.name || '';
                const businessAddr = firstVendor.vendor.vendorInfo?.businessAddress;
                if (businessAddr) {
                  const vendorParts = [
                    businessAddr.address,
                    businessAddr.city,
                    businessAddr.state,
                    businessAddr.pincode
                  ].filter(Boolean);
                  pickupAddress = vendorParts.join(', ');
                }
              }
            }

            // Handle items with proper quantity and name formatting
            const itemsList = order.items?.map(item => {
              const productName = item.product?.name || item.name || 'Item';
              return `${item.quantity}x ${productName}`;
            }) || ['Items not specified'];

            return {
              id: order._id,
              mongoId: order._id, // Keep the actual MongoDB ID for API calls
              orderNumber: order.orderNumber,
              customerName: customerName,
              customerPhone: customerPhone,
              customerEmail: order.customerInfo?.email || '',
              address: addressText,
              items: itemsList,
              amount: `₹${(order.pricing?.total || order.totalAmount || 0).toFixed(2)}`,
              status: order.status || 'out_for_delivery',
              distance: order.deliveryDistance || 'N/A',
              estimatedTime: order.estimatedDeliveryTime || 'N/A',
              assignedBy: 'system',
              assignedVendor: order.vendors?.[0]?.vendor?._id || null,
              orderType: 'lalaji_store',
              priority: order.priority || 'normal',
              vendorName: vendorName,
              pickupAddress: pickupAddress,
              paymentMethod: order.payment?.method || 'cod',
              paymentStatus: order.payment?.status || 'pending',
              specialInstructions: order.specialInstructions || '',
              coordinates: order.deliveryAddress?.coordinates || null,
              createdAt: order.createdAt,
              updatedAt: order.updatedAt
            };
          });
          
          setDeliveries(transformedOrders);
          
          // Show enhanced message with auto-assignment info
          let alertMessage = `You are now ${newStatus}. ${response.data.ordersCount || 0} orders found for delivery.`;
          
          if (response.data.autoAssignmentActive && response.data.newlyAssignedCount > 0) {
            alertMessage += `\n🎯 ${response.data.newlyAssignedCount} new orders automatically assigned to you based on your location!`;
          }
          
          Alert.alert(
            'Status Updated',
            alertMessage,
            [{ text: 'OK' }]
          );

          // Check status after getting new orders
          setTimeout(() => {
            checkAndManageStatus(transformedOrders, newStatus === 'online');
          }, 1000);
        } else if (newStatus === 'online') {
          // If going online but no orders from API, fetch fresh data
          console.log('🔄 Going online - fetching new orders...');
          await loadDashboardData(false); // Refresh without showing loader
          
          Alert.alert(
            'Status Updated',
            `You are now ${newStatus}. Checking for new orders...`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Status Updated',
            `You are now ${newStatus}`,
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to update availability status');
      }
    } catch (error) {
      console.error('Availability toggle error:', error);
      Alert.alert('Error', 'Failed to update availability status. Please check your connection.');
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      console.log(`📋 Updating order status - OrderID: ${orderId}, New Status: ${newStatus}`);
      
      // Find the delivery to get the MongoDB ID
      const delivery = deliveries.find(d => d.id === orderId);
      const mongoId = delivery?.mongoId || delivery?._id || orderId;
      
      console.log(`📋 Using MongoDB ID: ${mongoId} for order: ${orderId}`);
      
      let response;
      
      // Call appropriate API method based on status
      switch (newStatus) {
        case 'picked_up':
          response = await dashboardAPI.markPickedUp(mongoId);
          break;
        case 'delivered':
          response = await dashboardAPI.markDelivered(mongoId);
          break;
        default:
          response = await dashboardAPI.updateDeliveryStatus(mongoId, newStatus);
      }

      if (response.success) {
        // Update local state
        const updatedDeliveries = deliveries.map(delivery => 
          delivery.id === orderId 
            ? { ...delivery, status: newStatus }
            : delivery
        );
        setDeliveries(updatedDeliveries);

        const statusMessages = {
          picked_up: 'Order marked as picked up',
          out_for_delivery: 'Order is now out for delivery',
          delivered: 'Order marked as delivered'
        };

        Alert.alert('Status Updated', statusMessages[newStatus]);
        
        // Update stats if delivered
        if (newStatus === 'delivered') {
          setDashboardStats(prev => ({
            ...prev,
            todayStats: {
              ...prev.todayStats,
              completedOrders: prev.todayStats.completedOrders + 1
            }
          }));
        }

        // Check and manage status after order completion
        setTimeout(() => {
          checkAndManageStatus(updatedDeliveries, isOnline);
        }, 500);
      } else {
        console.error(`❌ API Error: ${response.error}`);
        Alert.alert('Error', response.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Status update error:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const handleReportIssue = async (orderId, issue) => {
    try {
      // Report issue via API
      const response = await dashboardAPI.reportIssue(orderId, issue);
      
      if (response.success) {
        Alert.alert(
          'Issue Reported',
          `Issue "${issue}" reported for order ${orderId}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to report issue');
      }
    } catch (error) {
      console.error('Report issue error:', error);
      Alert.alert('Error', 'Failed to report issue');
    }
    
    setShowIssueModal(false);
    setSelectedOrder(null);
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark notification as read if it's unread
      if (!notification.isRead) {
        await dashboardAPI.markNotificationRead(notification.id);
        // Update local state
        setNotificationsList(prev => 
          prev.map(n => 
            n.id === notification.id 
              ? { ...n, isRead: true }
              : n
          )
        );
        // Update unread count
        setNotifications(prev => Math.max(0, prev - 1));
      }

      // Handle notification action
      if (notification.orderId) {
        const delivery = filteredDeliveries.find(d => d.id === notification.orderId);
        if (delivery) {
          setSelectedDelivery(delivery);
          setShowDeliveryDetails(true);
          setShowNotifications(false);
        }
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
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
          <Text style={styles.orderId}>#{item.orderNumber || item.id}</Text>
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
          {item.customerPhone && (
            <TouchableOpacity 
              style={styles.phoneButton}
              onPress={() => {
                // Handle phone call
                console.log('Calling:', item.customerPhone);
              }}
            >
              <Ionicons name="call-outline" size={16} color={colors.neutrals.dark} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Payment Info */}
      <View style={styles.paymentSection}>
        <View style={styles.paymentInfo}>
          <Ionicons name="card-outline" size={16} color={colors.neutrals.gray} />
          <Text style={styles.paymentText}>
            {item.paymentMethod?.toUpperCase() || 'COD'} - {item.paymentStatus || 'Pending'}
          </Text>
        </View>
      </View>

      {/* Vendor/Pickup Info */}
      {item.vendorName && (
        <View style={styles.vendorSection}>
          <Ionicons name="storefront-outline" size={16} color={colors.neutrals.gray} />
          <View style={styles.vendorInfo}>
            <Text style={styles.vendorName}>{item.vendorName}</Text>
            {item.pickupAddress && (
              <Text style={styles.pickupAddress}>{item.pickupAddress}</Text>
            )}
          </View>
        </View>
      )}

      {/* Delivery Address */}
      <View style={styles.addressSection}>
        <Ionicons name="location-outline" size={16} color={colors.neutrals.gray} />
        <Text style={styles.address}>{item.address}</Text>
      </View>

      {/* Special Instructions */}
      {item.specialInstructions && (
        <View style={styles.instructionsSection}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary.yellow1} />
          <Text style={styles.instructions}>{item.specialInstructions}</Text>
        </View>
      )}

      {/* Items */}
      <View style={styles.itemsSection}>
        <Text style={styles.itemsLabel}>Items ({item.items.length}):</Text>
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
        {item.createdAt && (
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.neutrals.gray} />
            <Text style={styles.metaText}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        )}
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
            onPress={() => navigation.navigate('Maps', { deliveries: filteredDeliveries })}
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
            {filteredDeliveries.filter(d => ['assigned', 'picked_up', 'out_for_delivery'].includes(d.status)).length > 2 && isOnline && (
              <View style={styles.autoManageIndicator}>
                <Text style={styles.autoManageText}>Auto-managed</Text>
              </View>
            )}
          </View>
          <Text style={styles.statusSubtext}>
            {isOnline ? 'Available for deliveries' : 'Not accepting orders'}
            {filteredDeliveries.filter(d => ['assigned', 'picked_up', 'out_for_delivery'].includes(d.status)).length > 2 && 
              ' • Will auto-offline if overloaded'}
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
            {deliveryBoyType === 'lalaji_store' ? 'Assigned' : 'Vendor Assigned'} Deliveries ({filteredDeliveries.length})
          </Text>
          <TouchableOpacity 
            style={styles.testButton}
            onPress={refreshDeliveries}
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

            <ScrollView 
              style={styles.notificationsList}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={true}
            >
              {(() => {
                return notificationsList.length > 0 ? (
                  notificationsList.map((notification, index) => {
                    return (
                      <TouchableOpacity 
                        key={notification.id || index} 
                        style={[
                          styles.notificationItem,
                          !notification.isRead && styles.unreadNotification
                        ]}
                        onPress={() => handleNotificationClick(notification)}
                      >
                        <View style={[
                          styles.notificationDot,
                          { backgroundColor: notification.isRead ? colors.neutrals.gray : colors.primary.yellow2 }
                        ]} />
                        <View style={styles.notificationContent}>
                          <Text style={styles.notificationTitle}>{notification.title || 'No Title'}</Text>
                          <Text style={styles.notificationText}>{notification.message || 'No Message'}</Text>
                          <Text style={styles.notificationTime}>
                            {notification.timestamp ? 
                              (new Date(notification.timestamp)).toLocaleTimeString() : 
                              'Now'
                            }
                          </Text>
                        </View>
                        <Ionicons 
                          name={getNotificationIcon(notification.type)} 
                          size={16} 
                          color={colors.neutrals.gray} 
                        />
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.emptyNotifications}>
                    <Ionicons name="notifications-outline" size={48} color={colors.neutrals.gray} />
                    <Text style={styles.emptyNotificationsText}>No notifications yet</Text>
                    <Text style={styles.emptyNotificationsSubtext}>
                      You'll see order updates and messages here
                    </Text>
                  </View>
                );
              })()}
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
                {/* Modal Header - Fixed at top */}
                <View style={styles.detailsHeader}>
                  <TouchableOpacity 
                    onPress={() => setShowDeliveryDetails(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color={colors.neutrals.gray} />
                  </TouchableOpacity>
                  <View style={styles.headerInfo}>
                    <Text style={styles.detailsTitle}>#{selectedDelivery.orderNumber || selectedDelivery.id}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedDelivery.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(selectedDelivery.status)}</Text>
                    </View>
                  </View>
                  <Text style={styles.detailsAmount}>{selectedDelivery.amount}</Text>
                </View>

                {/* Scrollable Content */}
                <ScrollView 
                  style={styles.modalScrollView}
                  showsVerticalScrollIndicator={true}
                  bounces={true}
                >
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
                          {selectedDelivery.customerPhone && (
                            <TouchableOpacity style={styles.phoneRow}>
                              <Ionicons name="call" size={16} color={colors.neutrals.gray} />
                              <Text style={styles.phoneNumber}>{selectedDelivery.customerPhone}</Text>
                            </TouchableOpacity>
                          )}
                          {selectedDelivery.customerEmail && (
                            <View style={styles.emailRow}>
                              <Ionicons name="mail" size={16} color={colors.neutrals.gray} />
                              <Text style={styles.emailText}>{selectedDelivery.customerEmail}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Payment Information */}
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionLabel}>Payment Information</Text>
                    <View style={styles.paymentDetails}>
                      <View style={styles.paymentRow}>
                        <Ionicons name="card" size={20} color={colors.primary.yellow2} />
                        <View style={styles.paymentText}>
                          <Text style={styles.paymentMethod}>
                            {selectedDelivery.paymentMethod?.toUpperCase() || 'COD'}
                          </Text>
                          <Text style={styles.paymentStatus}>
                            Status: {selectedDelivery.paymentStatus || 'Pending'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Vendor/Pickup Information */}
                  {selectedDelivery.vendorName && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.sectionLabel}>Pickup Information</Text>
                      <View style={styles.vendorDetails}>
                        <Ionicons name="storefront" size={20} color={colors.primary.yellow2} />
                        <View style={styles.vendorText}>
                          <Text style={styles.vendorDetailName}>{selectedDelivery.vendorName}</Text>
                          {selectedDelivery.pickupAddress && (
                            <Text style={styles.pickupDetailAddress}>{selectedDelivery.pickupAddress}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Special Instructions */}
                  {selectedDelivery.specialInstructions && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.sectionLabel}>Special Instructions</Text>
                      <View style={styles.instructionsDetails}>
                        <Ionicons name="information-circle" size={20} color={colors.primary.yellow1} />
                        <Text style={styles.instructionsDetailText}>
                          {selectedDelivery.specialInstructions}
                        </Text>
                      </View>
                    </View>
                  )}

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
                      {selectedDelivery.createdAt && (
                        <View style={styles.infoRow}>
                          <View style={styles.infoIcon}>
                            <Ionicons name="calendar" size={16} color={colors.neutrals.gray} />
                          </View>
                          <Text style={styles.infoLabel}>Order Date:</Text>
                          <Text style={styles.infoValue}>
                            {new Date(selectedDelivery.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.detailsActions}>
                    {selectedDelivery.status === 'assigned' && (
                      <TouchableOpacity 
                        style={[styles.detailsActionBtn, styles.primaryActionBtn]}
                        onPress={() => {
                          handleStatusUpdate(selectedDelivery.id, 'picked_up');
                          setShowDeliveryDetails(false);
                        }}
                      >
                        <Ionicons name="bag-check" size={18} color="white" />
                        <Text style={styles.primaryActionText}>Mark Picked Up</Text>
                      </TouchableOpacity>
                    )}
                    
                    {selectedDelivery.status === 'picked_up' && (
                      <TouchableOpacity 
                        style={[styles.detailsActionBtn, styles.primaryActionBtn]}
                        onPress={() => {
                          handleStatusUpdate(selectedDelivery.id, 'out_for_delivery');
                          setShowDeliveryDetails(false);
                        }}
                      >
                        <Ionicons name="bicycle" size={18} color="white" />
                        <Text style={styles.primaryActionText}>Out for Delivery</Text>
                      </TouchableOpacity>
                    )}
                    
                    {selectedDelivery.status === 'out_for_delivery' && (
                      <>
                        <TouchableOpacity 
                          style={[styles.detailsActionBtn, styles.cameraActionBtn]}
                          onPress={() => {
                            setShowDeliveryDetails(false);
                            navigation.navigate('Camera', { 
                              type: 'delivery-proof', 
                              orderId: selectedDelivery.id 
                            });
                          }}
                        >
                          <Ionicons name="camera" size={18} color="white" />
                          <Text style={styles.cameraActionText}>Take Photo</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.detailsActionBtn, styles.primaryActionBtn]}
                          onPress={() => {
                            handleStatusUpdate(selectedDelivery.id, 'delivered');
                            setShowDeliveryDetails(false);
                          }}
                        >
                          <Ionicons name="checkmark-circle" size={18} color="white" />
                          <Text style={styles.primaryActionText}>Mark Delivered</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    <TouchableOpacity 
                      style={[styles.detailsActionBtn, styles.mapActionBtn]}
                      onPress={() => {
                        setShowDeliveryDetails(false);
                        navigation.navigate('Maps', { 
                          deliveries: filteredDeliveries,
                          delivery: selectedDelivery,
                          destination: selectedDelivery.coordinates,
                          address: selectedDelivery.address 
                        });
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
                  
                  {/* Bottom padding for scroll */}
                  <View style={styles.modalBottomPadding} />
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Go Online Prompt Modal */}
      <Modal
        visible={showGoOnlinePrompt}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowGoOnlinePrompt(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '40%' }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="bicycle-outline" size={48} color={colors.primary.yellow2} />
              <Text style={styles.modalTitle}>Ready for Deliveries?</Text>
              <Text style={styles.modalSubtitle}>
                You don't have any active orders. Would you like to go online to start receiving new deliveries?
              </Text>
            </View>

            <View style={styles.promptActions}>
              <TouchableOpacity
                style={[styles.promptBtn, styles.primaryPromptBtn]}
                onPress={() => handleGoOnlinePrompt(true)}
              >
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.primaryPromptText}>Yes, Go Online</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.promptBtn, styles.secondaryPromptBtn]}
                onPress={() => handleGoOnlinePrompt(false)}
              >
                <Text style={styles.secondaryPromptText}>Maybe Later</Text>
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
    fontFamily: typography.fontFamily.regular,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    fontSize: 12,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.regular,
  },
  driverName: {
    fontSize: 22,
    color: colors.neutrals.dark,
    fontFamily: typography.fontFamily.bold,
    marginTop: 1,
    letterSpacing: -0.3,
  },
  deliveryBoyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.yellow1,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 3,
    alignSelf: 'flex-start',
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  badgeText: {
    fontSize: 10,
    color: colors.neutrals.dark,
    fontFamily: typography.fontFamily.medium,
    marginLeft: 4,
  },
  mapButton: {
    padding: 8,
    marginRight: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
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
    fontFamily: typography.fontFamily.bold,
  },
  availabilitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
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
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
  },
  statusSubtext: {
    fontSize: 12,
    color: colors.neutrals.gray,
    marginTop: 2,
    fontFamily: typography.fontFamily.regular,
  },
  autoManageIndicator: {
    backgroundColor: colors.primary.yellow1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  autoManageText: {
    fontSize: 10,
    color: colors.neutrals.dark,
    fontFamily: typography.fontFamily.medium,
  },
  statsSection: {
    marginHorizontal: 20,
    marginVertical: 8,
  },
  statsTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.neutrals.lightGray,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutrals.dark,
    marginTop: 6,
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
  deliveryBoyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.yellow1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  deliveriesSection: {
    flex: 1,
    paddingTop: 8,
  },
  deliveriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
    letterSpacing: -0.3,
  },
  testButton: {
    padding: 8,
  },
  deliveriesList: {
    paddingHorizontal: 20,
  },
  deliveryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.neutrals.lightGray,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutrals.dark,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
    color: 'white',
  },
  amount: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutrals.dark,
  },
  customerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    color: colors.neutrals.dark,
    fontFamily: typography.fontFamily.medium,
    marginLeft: 6,
  },
  phoneButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: colors.neutrals.lightGray,
  },
  paymentSection: {
    marginBottom: 8,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    fontSize: 12,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.medium,
    marginLeft: 6,
  },
  vendorSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  vendorInfo: {
    flex: 1,
    marginLeft: 6,
  },
  vendorName: {
    fontSize: 13,
    color: colors.neutrals.dark,
    fontFamily: typography.fontFamily.medium,
  },
  pickupAddress: {
    fontSize: 12,
    color: colors.neutrals.gray,
    marginTop: 2,
    lineHeight: 16,
  },
  instructionsSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary.yellow1.replace('#', '#').slice(0, 7) + '10', // Light yellow background
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  instructions: {
    fontSize: 12,
    color: colors.neutrals.dark,
    fontFamily: typography.fontFamily.medium,
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  address: {
    fontSize: 13,
    color: colors.neutrals.gray,
    flex: 1,
    marginLeft: 6,
    lineHeight: 18,
  },
  itemsSection: {
    marginBottom: 8,
  },
  itemsLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.gray,
    marginBottom: 4,
  },
  items: {
    fontSize: 13,
    color: colors.neutrals.dark,
    lineHeight: 18,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: colors.neutrals.gray,
    marginLeft: 4,
    fontFamily: typography.fontFamily.regular,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: colors.neutrals.dark,
  },
  secondaryBtn: {
    backgroundColor: colors.neutrals.lightGray,
    borderWidth: 1,
    borderColor: colors.neutrals.gray,
  },
  cameraBtn: {
    backgroundColor: colors.primary.yellow2,
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: 'white',
    marginLeft: 4,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.gray,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.gray,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.neutrals.gray,
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: '80%',
    minHeight: 560,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutrals.dark,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.neutrals.gray,
    marginTop: 4,
  },
  cancelButton: {
    backgroundColor: colors.neutrals.lightGray,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.gray,
  },
  // Notifications Styles
  notificationsList: {
    flex: 1,
    paddingTop: 8,
    minHeight: 200,
    maxHeight: 400,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.neutrals.lightGray,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 80,
  },
  unreadNotification: {
    backgroundColor: colors.primary.yellow1,
    borderColor: colors.primary.yellow2,
    borderWidth: 1.5,
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutrals.dark,
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 13,
    color: colors.neutrals.gray,
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 11,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.regular,
  },
  // Empty notifications state
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyNotificationsText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.gray,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyNotificationsSubtext: {
    fontSize: 14,
    color: colors.neutrals.gray,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Issues Modal Styles
  issuesList: {
    flex: 1,
    maxHeight: 300,
  },
  issueOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  issueText: {
    fontSize: 16,
    color: colors.neutrals.dark,
    fontFamily: typography.fontFamily.regular,
  },
  // Delivery Details Modal Styles
  detailsModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 0, // Remove horizontal padding from main container
    paddingBottom: 0, // Remove bottom padding from main container
    maxHeight: '90%',
    flex: 1,
  },
  modalScrollView: {
    flex: 1,
    paddingHorizontal: 20, // Add horizontal padding to scrollable content
  },
  modalBottomPadding: {
    height: 34, // Safe area padding at bottom
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    paddingHorizontal: 20, // Add horizontal padding to header
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  closeButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutrals.dark,
    marginBottom: 4,
  },
  detailsAmount: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutrals.dark,
  },
  detailsSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
    marginBottom: 12,
  },
  customerDetails: {
    backgroundColor: colors.neutrals.lightGray,
    borderRadius: 12,
    padding: 12,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.yellow1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerText: {
    flex: 1,
  },
  customerDetailName: {
    fontSize: 16,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  phoneNumber: {
    fontSize: 14,
    color: colors.neutrals.gray,
    marginLeft: 6,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  emailText: {
    fontSize: 14,
    color: colors.neutrals.gray,
    marginLeft: 6,
  },
  paymentDetails: {
    backgroundColor: colors.neutrals.lightGray,
    borderRadius: 12,
    padding: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    marginLeft: 12,
    flex: 1,
  },
  paymentMethod: {
    fontSize: 16,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
  },
  paymentStatus: {
    fontSize: 14,
    color: colors.neutrals.gray,
    marginTop: 2,
  },
  vendorDetails: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.neutrals.lightGray,
    borderRadius: 12,
    padding: 12,
  },
  vendorText: {
    marginLeft: 12,
    flex: 1,
  },
  vendorDetailName: {
    fontSize: 16,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
  },
  pickupDetailAddress: {
    fontSize: 14,
    color: colors.neutrals.gray,
    marginTop: 4,
    lineHeight: 18,
  },
  instructionsDetails: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary.yellow1.replace('#', '#').slice(0, 7) + '20', // Light yellow background
    borderRadius: 12,
    padding: 12,
  },
  instructionsDetailText: {
    fontSize: 14,
    color: colors.neutrals.dark,
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
    fontFamily: typography.fontFamily.medium,
  },
  addressDetails: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.neutrals.lightGray,
    borderRadius: 12,
    padding: 12,
  },
  addressDetailText: {
    fontSize: 14,
    color: colors.neutrals.dark,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  itemsDetails: {
    backgroundColor: colors.neutrals.lightGray,
    borderRadius: 12,
    padding: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary.yellow2,
    marginRight: 12,
  },
  itemText: {
    fontSize: 14,
    color: colors.neutrals.dark,
    flex: 1,
  },
  deliveryInfo: {
    backgroundColor: colors.neutrals.lightGray,
    borderRadius: 12,
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.neutrals.gray,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
  },
  detailsActions: {
    marginTop: 20,
    gap: 16,
    paddingHorizontal: 4,
  },
  detailsActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
    minHeight: 50,
  },
  mapActionBtn: {
    backgroundColor: colors.primary.yellow1,
    borderWidth: 1,
    borderColor: colors.primary.yellow2,
    marginTop: 8,
  },
  mapActionText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary.yellow2,
  },
  issueBtn: {
    backgroundColor: colors.neutrals.lightGray,
    borderWidth: 1,
    borderColor: colors.neutrals.gray,
  },
  issueBtnText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.gray,
  },
  primaryActionBtn: {
    backgroundColor: colors.primary.yellow2,
  },
  primaryActionText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
  },
  cameraActionBtn: {
    backgroundColor: colors.primary.yellow3,
    marginBottom: 0,
  },
  cameraActionText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
  },
  
  // Go Online Prompt Styles
  promptActions: {
    gap: 12,
    marginTop: 20,
  },
  promptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryPromptBtn: {
    backgroundColor: colors.primary.yellow2,
  },
  secondaryPromptBtn: {
    backgroundColor: colors.neutrals.lightGray,
    borderWidth: 1,
    borderColor: colors.neutrals.gray,
  },
  primaryPromptText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.medium,
    color: 'white',
  },
  secondaryPromptText: {
    fontSize: 16,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.gray,
  },
});

export default Dashboard;