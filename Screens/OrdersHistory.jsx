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

    // Fetch orders from backend for 'all' tab
    React.useEffect(() => {
      if (selectedTab === 'all') {
        setLoadingOrders(true);
        setOrdersError(null);
        (async () => {
          try {
            const token = await AsyncStorage.getItem('delivery_boy_token');
            const res = await fetchAllOrders({ page: 1, limit: 20, token });
            if (res.success) {
              setOrdersData(res.orders);
            } else {
              setOrdersError(res.message);
              setOrdersData([]);
            }
          } catch (err) {
            setOrdersError(err.message);
            setOrdersData([]);
          } finally {
            setLoadingOrders(false);
          }
        })();
      }
    }, [selectedTab]);

  const filterOrders = (orders) => {
    if (selectedTab === 'completed') {
      return orders.filter(order => order.status === 'delivered');
    } else if (selectedTab === 'cancelled') {
      return orders.filter(order => order.status === 'cancelled');
    } else if (selectedTab === 'recent') {
      // Sort by date descending and pick top 2 as recent (customize as needed)
      return [...orders]
        .sort((a, b) => {
          // Compare date strings (YYYY-MM-DD)
          if (a.date === b.date) {
            // Compare time if dates are equal
            return b.time.localeCompare(a.time);
          }
          return b.date.localeCompare(a.date);
        })
        .slice(0, 2);
    }
    return orders;
  };

  const getStatusColor = (status) => {
    return status === 'delivered' ? colors.neutrals.dark : colors.neutrals.gray;
  };

  const renderOrderCard = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>{item.id}</Text>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status === 'delivered' ? 'Completed' : 'Cancelled'}
          </Text>
        </View>
        <Text style={styles.amount}>{item.amount}</Text>
      </View>

      <View style={styles.customerSection}>
        <View style={styles.customerInfo}>
          <Ionicons name="person-outline" size={16} color={colors.neutrals.gray} />
          <Text style={styles.customerName}>{item.customerName}</Text>
        </View>
        <Text style={styles.itemCount}>{item.items} items</Text>
      </View>

      <View style={styles.addressSection}>
        <Ionicons name="location-outline" size={16} color={colors.neutrals.gray} />
        <Text style={styles.address}>
          {typeof item.address === 'object' && item.address !== null
            ? [
                item.address.landmark,
                item.address.address,
                item.address.city,
                item.address.state,
                item.address.pincode
              ].filter(Boolean).join(', ')
            : item.address}
        </Text>
      </View>

      <View style={styles.timeSection}>
        <Text style={styles.dateTime}>{item.date} at {item.time}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Order History</Text>
      </View>

      {/* Filter Tabs - horizontal scroll */}
      <View style={styles.filterTabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
          {[
            { key: 'all', label: 'All' },
            { key: 'recent', label: 'Recent' },
            { key: 'completed', label: 'Completed' },
            { key: 'failed', label: 'Failed' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={[styles.tab, selectedTab === item.key && styles.activeTab]}
              onPress={() => setSelectedTab(item.key)}
            >
              <Text style={[styles.tabText, selectedTab === item.key && styles.activeTabText]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
  filterTabsWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
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
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    marginBottom: 20,
    gap: 12,
  },
  tab: {
    minWidth: 110,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: colors.neutrals.lightGray,
  },
  activeTab: {
    backgroundColor: colors.primary.yellow2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.neutrals.gray,
  },
  activeTabText: {
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
  },
  orderId: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.neutrals.dark,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '400',
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