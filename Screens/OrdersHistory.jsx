import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { colors } from '../components/colors';
import { fetchAllOrders } from '../utils/ordershistory';

const OrdersHistory = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('all'); // all, completed, cancelled, recent

  // Sample orders history data
  const [ordersData, setOrdersData] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  // Fetch orders from backend based on selected tab
  React.useEffect(() => {
    setLoadingOrders(true);
    setOrdersError(null);
    (async () => {
      try {
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
      }
    })();
  }, [selectedTab]);

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
    <TouchableOpacity style={styles.orderCard} onPress={() => navigation.navigate('OrderDetails', { order: item })}>
      <View style={styles.cardHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>#{item.orderNumber || item._id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.amount}>₹{item.pricing?.total || item.pricing?.totalAmount || 0}</Text>
      </View>

      <View style={styles.customerSection}>
        <View style={styles.customerInfo}>
          <Ionicons name="person-outline" size={16} color={colors.neutrals.gray} />
          <Text style={styles.customerName}>
            {item.customer?.name || item.customerInfo?.name || item.customerName || 'Customer'}
          </Text>
        </View>
        <Text style={styles.itemCount}>
          {Array.isArray(item.items) ? item.items.length : 
           item.orderItems?.length || item.vendors?.[0]?.items?.length || 0} items
        </Text>
      </View>

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

      <View style={styles.timeSection}>
        <Text style={styles.dateTime}>
          {item.createdAt
            ? `${new Date(item.createdAt).toLocaleDateString()} at ${new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : item.date && item.time
            ? `${item.date} at ${item.time}`
            : 'Date not available'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Order History</Text>
      </View>

      {/* Filter Tabs - Capsule Design */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsWrapper}>
          {[
            { key: 'all', label: 'All', icon: 'list-outline' },
            { key: 'active', label: 'Active', icon: 'bicycle-outline' },
            { key: 'completed', label: 'Completed', icon: 'checkmark-circle-outline' },
            { key: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline' },
          ].map(tab => (
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
        keyExtractor={(item) => item.id || item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ordersList}
        ListEmptyComponent={
          loadingOrders ? (
            <Text style={{ textAlign: 'center', marginTop: 40 }}>Loading orders...</Text>
          ) : ordersError ? (
            <Text style={{ textAlign: 'center', marginTop: 40, color: 'red' }}>Error: {ordersError}</Text>
          ) : (
            <Text style={{ textAlign: 'center', marginTop: 40 }}>No orders found.</Text>
          )
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
  header: {
    paddingHorizontal: 32,
    paddingVertical: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.neutrals.dark,
    letterSpacing: -0.5,
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
    fontWeight: '500',
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
    fontWeight: 'bold',
    color: 'white',
  },
  activeTabBadgeText: {
    color: 'white',
  },
  ordersList: {
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '400',
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
    fontWeight: '500',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: 18,
    fontWeight: '300',
    color: colors.neutrals.dark,
    letterSpacing: -0.5,
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
    fontWeight: '400',
    marginLeft: 8,
  },
  itemCount: {
    fontSize: 12,
    color: colors.neutrals.gray,
    fontWeight: '400',
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  address: {
    fontSize: 14,
    color: colors.neutrals.gray,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  timeSection: {
    alignItems: 'flex-end',
  },
  dateTime: {
    fontSize: 12,
    color: colors.neutrals.gray,
    fontWeight: '400',
  },
});

export default OrdersHistory;