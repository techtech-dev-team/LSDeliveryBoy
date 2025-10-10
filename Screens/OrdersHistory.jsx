import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { colors, typography } from '../components/colors';
import { fetchAllOrders } from '../utils/ordershistory';

const OrdersHistory = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('all');
  const [ordersData, setOrdersData] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  // Tab configuration
  const tabs = [
    { key: 'all', label: 'All', icon: 'list-outline' },
    { key: 'active', label: 'Active', icon: 'bicycle-outline' },
    { key: 'completed', label: 'Completed', icon: 'checkmark-circle-outline' },
    { key: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline' }
  ];

  // Fetch orders based on selected tab
  const fetchOrders = async (showLoader = true) => {
    try {
      if (showLoader) setLoadingOrders(true);
      setOrdersError(null);

      const token = await AsyncStorage.getItem('delivery_boy_token');
      
      // Prepare API parameters based on selected tab
      let apiParams = { page: 1, limit: 50, token };
      
      if (selectedTab !== 'all') {
        apiParams.tab = selectedTab;
      }

      const res = await fetchAllOrders(apiParams);
      
      if (res.success) {
        setOrdersData(res.orders || []);
      } else {
        setOrdersError(res.message || 'Failed to fetch orders');
        setOrdersData([]);
      }
    } catch (err) {
      console.error('Orders fetch error:', err);
      setOrdersError(err.message || 'Network error occurred');
      setOrdersData([]);
    } finally {
      setLoadingOrders(false);
      setRefreshing(false);
    }
  };

  // Fetch orders when tab changes
  useEffect(() => {
    fetchOrders();
  }, [selectedTab]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(false);
  };

  const filterOrders = (orders) => {
    // Since we're using API-based filtering, return orders as-is
    // The backend handles the filtering based on the tab parameter
    return orders;
  };

  const getStatusColor = (status) => {
    const statusColors = {
      assigned: colors.primary.yellow2,
      packed: colors.primary.yellow2,
      picked_up: colors.primary.yellow1,
      out_for_delivery: colors.primary.yellow3,
      delivered: colors.neutrals.dark,
      cancelled: colors.neutrals.gray
    };
    return statusColors[status] || colors.neutrals.gray;
  };

  const getStatusText = (status) => {
    const statusTexts = {
      assigned: 'Assigned',
      packed: 'Packed',
      picked_up: 'Picked Up',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Completed',
      cancelled: 'Cancelled'
    };
    return statusTexts[status] || status;
  };

  const getTabCount = (tab) => {
    const filtered = ordersData.filter(order => {
      if (tab === 'all') return true;
      if (tab === 'active') return ['assigned', 'packed', 'picked_up', 'out_for_delivery'].includes(order.status);
      if (tab === 'completed') return order.status === 'delivered';
      if (tab === 'cancelled') return order.status === 'cancelled';
      return false;
    });
    return filtered.length;
  };

  const renderOrderCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderCard} 
      onPress={() => navigation.navigate('OrderDetails', { order: item })}
      activeOpacity={0.7}
    >
      {/* Order Header */}
      <View style={styles.cardHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>#{item.orderNumber || item.id || item._id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.amount}>
          {item.pricing?.totalAmount ? `₹${item.pricing.totalAmount}` : item.amount || '₹0'}
        </Text>
      </View>

      {/* Customer Info */}
      <View style={styles.customerSection}>
        <View style={styles.customerInfo}>
          <Ionicons name="person-outline" size={16} color={colors.neutrals.gray} />
          <Text style={styles.customerName}>
            {item.customerInfo?.personalInfo?.name || item.customerName || 'Customer'}
          </Text>
        </View>
        <Text style={styles.itemCount}>
          {Array.isArray(item.items) ? item.items.length : 
           item.orderItems?.length || 0} items
        </Text>
      </View>

      {/* Address */}
      <View style={styles.addressSection}>
        <Ionicons name="location-outline" size={16} color={colors.neutrals.gray} />
        <Text style={styles.address}>
          {item.deliveryAddress
            ? [
                item.deliveryAddress.landmark,
                item.deliveryAddress.address,
                item.deliveryAddress.city,
                item.deliveryAddress.state,
                item.deliveryAddress.pincode
              ].filter(Boolean).join(', ')
            : typeof item.address === 'object' && item.address !== null
            ? [
                item.address.landmark,
                item.address.address,
                item.address.city,
                item.address.state,
                item.address.pincode
              ].filter(Boolean).join(', ')
            : item.address || 'Address not available'}
        </Text>
      </View>

      {/* Date and Time */}
      <View style={styles.metaInfo}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={colors.neutrals.gray} />
          <Text style={styles.metaText}>
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString()
              : item.date || 'Date not available'}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={colors.neutrals.gray} />
          <Text style={styles.metaText}>
            {item.createdAt
              ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : item.time || 'Time not available'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (loadingOrders && ordersData.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.yellow2} />
        <Text style={styles.loadingText}>Loading Order History...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.neutrals.dark} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Order History</Text>
            <Text style={styles.subtitle}>
              {ordersData.length} order{ordersData.length !== 1 ? 's' : ''} found
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsWrapper}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
              onPress={() => setSelectedTab(tab.key)}
            >
              <Ionicons 
                name={tab.icon} 
                size={16} 
                color={selectedTab === tab.key ? 'white' : colors.neutrals.gray} 
              />
              <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
              {getTabCount(tab.key) > 0 && (
                <View style={[styles.tabBadge, selectedTab === tab.key && styles.activeTabBadge]}>
                  <Text style={[styles.tabBadgeText, selectedTab === tab.key && styles.activeTabBadgeText]}>
                    {getTabCount(tab.key)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Orders List */}
      <FlatList
        data={filterOrders(ordersData)}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id || item._id || Math.random().toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ordersList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary.yellow2]}
            tintColor={colors.primary.yellow2}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons 
              name={selectedTab === 'completed' ? 'checkmark-circle-outline' : 
                    selectedTab === 'cancelled' ? 'close-circle-outline' :
                    selectedTab === 'active' ? 'bicycle-outline' : 'list-outline'} 
              size={48} 
              color={colors.neutrals.gray} 
            />
            <Text style={styles.emptyText}>
              {ordersError ? 'Failed to load orders' : 
               selectedTab === 'active' ? 'No active orders' :
               selectedTab === 'completed' ? 'No completed orders' :
               selectedTab === 'cancelled' ? 'No cancelled orders' :
               'No orders found'}
            </Text>
            <Text style={styles.emptySubtext}>
              {ordersError ? 'Pull down to refresh and try again' :
               selectedTab === 'active' ? 'Active orders will appear here' :
               selectedTab === 'completed' ? 'Completed deliveries will appear here' :
               selectedTab === 'cancelled' ? 'Cancelled orders will appear here' :
               'Your order history will appear here'}
            </Text>
            {ordersError && (
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => fetchOrders()}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutrals.dark,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: colors.neutrals.lightGray,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: colors.primary.yellow2,
  },
  tabText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.gray,
  },
  activeTabText: {
    color: 'white',
  },
  tabBadge: {
    backgroundColor: colors.neutrals.gray,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: 'white',
  },
  activeTabBadgeText: {
    color: 'white',
  },
  ordersList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutrals.lightGray,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderId: {
    fontSize: 16,
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
    marginBottom: 12,
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
  itemCount: {
    fontSize: 12,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.regular,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  address: {
    fontSize: 13,
    color: colors.neutrals.gray,
    marginLeft: 6,
    flex: 1,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.gray,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.neutrals.gray,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
  },
  retryButton: {
    backgroundColor: colors.primary.yellow2,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: 'white',
  },
});

export default OrdersHistory;