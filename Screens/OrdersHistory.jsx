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
import { FontFamily } from '../utils/fonts';
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
        let apiParams = { page: 1, limit: 50, token, tab: selectedTab };
        
        console.log('🔄 Fetching orders for tab:', selectedTab);
        const res = await fetchAllOrders(apiParams);
        
        if (res.success) {
          console.log('✅ Fetched orders:', res.orders?.length || 0, 'for tab:', selectedTab);
          setOrdersData(res.orders || []);
        } else {
          console.error('❌ Orders fetch failed:', res.message);
          setOrdersError(res.message || 'Failed to fetch orders');
          setOrdersData([]);
        }
      } catch (err) {
        console.error('💥 Orders fetch error:', err);
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
      {/* Header with Order ID, Status, and Amount */}
      <View style={styles.cardHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>#{item.orderNumber || item._id?.slice(-8) || 'N/A'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.amount}>₹{item.pricing?.total || item.pricing?.totalAmount || 0}</Text>
      </View>

      {/* Customer and Items Count */}
      <View style={styles.infoRow}>
        <View style={styles.customerInfo}>
          <Ionicons name="person-outline" size={14} color={colors.neutrals.gray} />
          <Text style={styles.customerText}>
            Customer ID: {item.customer?._id?.slice(-6) || 'N/A'}
          </Text>
        </View>
        <Text style={styles.itemCount}>
          {(() => {
            // Use order.items.length as the primary source (this is populated by the API)
            const itemCount = Array.isArray(item.items) ? item.items.length : 1;
            return `${itemCount} item${itemCount !== 1 ? 's' : ''}`;
          })()}
        </Text>
      </View>

      {/* Vendor Info */}
      {item.vendors && item.vendors.length > 0 && (
        <View style={styles.infoRow}>
          <View style={styles.vendorInfo}>
            <Ionicons name="storefront-outline" size={14} color={colors.neutrals.gray} />
            <Text style={styles.vendorText}>
              {item.vendors[0]?.vendor?.vendorInfo?.businessName || 
               item.vendors[0]?.vendor?.name || 'LALJI_STORE'}
            </Text>
          </View>
        </View>
      )}

      {/* Items List */}
      {item.items && item.items.length > 0 && (
        <View style={styles.itemsSection}>
          <View style={styles.itemsHeader}>
            <Ionicons name="bag-outline" size={14} color={colors.neutrals.gray} />
            <Text style={styles.itemsHeaderText}>Items ({item.items.length})</Text>
          </View>
          <View style={styles.itemsList}>
            {item.items.slice(0, 3).map((orderItem, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {orderItem.name || orderItem.product?.name || 'Item'}
                </Text>
                <Text style={styles.itemDetails}>
                  {orderItem.quantity}x ₹{orderItem.price || orderItem.mrp || 0}
                </Text>
              </View>
            ))}
            {item.items.length > 3 && (
              <Text style={styles.moreItems}>
                +{item.items.length - 3} more items
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Date and Delivery Info */}
      <View style={styles.footerRow}>
        <Text style={styles.dateTime}>
          {item.createdAt
            ? `${new Date(item.createdAt).toLocaleDateString('en-GB')} at ${new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'Date not available'}
        </Text>
        {item.delivery?.deliveredAt && item.status === 'delivered' && (
          <Text style={styles.deliveredTime}>
            Delivered: {new Date(item.delivery.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
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
            { key: 'completed', label: 'Done', icon: 'checkmark-circle-outline' },
            { key: 'cancelled', label: 'Cancel', icon: 'close-circle-outline' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
              onPress={() => {
                console.log('🎯 Tab pressed:', tab.key, 'was:', selectedTab);
                setSelectedTab(tab.key);
              }}
            >
              <Ionicons 
                name={tab.icon} 
                size={16} 
                color={selectedTab === tab.key ? '#FFFFFF' : '#C2C9D3'} 
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
    fontFamily: FontFamily.GilroyRegular,
    fontWeight: '300',
    color: colors.neutrals.dark,
    letterSpacing: -0.5,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
    padding: 3,
    height: 56,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 26,
    gap: 4,
    minWidth: 0,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#F8CB33',
    shadowColor: '#F8CB33',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontFamily: FontFamily.GilroyMedium,
    color: '#C2C9D3',
    textAlign: 'center',
    flexShrink: 1,
    numberOfLines: 1,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.GilroyBold,
  },
  tabBadge: {
    backgroundColor: '#C2C9D3',
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.GilroyBold,
    color: '#FFFFFF',
  },
  activeTabBadgeText: {
    color: '#F8CB33',
    fontFamily: FontFamily.GilroyBold,
  },
  ordersList: {
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.neutrals.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  orderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 15,
    fontFamily: FontFamily.GilroyMedium,
    color: colors.neutrals.dark,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontFamily: FontFamily.GilroyBold,
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: 16,
    fontFamily: FontFamily.GilroyMedium,
    color: colors.neutrals.dark,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  customerText: {
    fontSize: 12,
    fontFamily: FontFamily.GilroyRegular,
    color: colors.neutrals.gray,
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  vendorText: {
    fontSize: 12,
    fontFamily: FontFamily.GilroyMedium,
    color: colors.primary.yellow2,
  },
  itemCount: {
    fontSize: 11,
    fontFamily: FontFamily.GilroyRegular,
    color: colors.neutrals.gray,
    backgroundColor: colors.neutrals.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  dateTime: {
    fontSize: 11,
    fontFamily: FontFamily.GilroyRegular,
    color: colors.neutrals.gray,
  },
  deliveredTime: {
    fontSize: 10,
    fontFamily: FontFamily.GilroyMedium,
    color: colors.neutrals.success,
  },
  itemsSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  itemsHeaderText: {
    fontSize: 12,
    fontFamily: FontFamily.GilroyMedium,
    color: colors.neutrals.gray,
  },
  itemsList: {
    marginLeft: 20,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  itemName: {
    fontSize: 11,
    fontFamily: FontFamily.GilroyRegular,
    color: colors.neutrals.dark,
    flex: 1,
    marginRight: 8,
  },
  itemDetails: {
    fontSize: 11,
    fontFamily: FontFamily.GilroyRegular,
    color: colors.neutrals.gray,
  },
  moreItems: {
    fontSize: 10,
    fontFamily: FontFamily.GilroyMedium,
    color: colors.primary.yellow2,
    fontStyle: 'italic',
    marginTop: 2,
  },
});

export default OrdersHistory;