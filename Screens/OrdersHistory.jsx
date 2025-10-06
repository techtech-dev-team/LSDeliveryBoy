import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { colors } from '../components/colors';

const OrdersHistory = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('all'); // all, completed, cancelled

  // Sample orders history data
  const ordersData = [
    {
      id: 'ORD001',
      customerName: 'Rahul Sharma',
      address: 'Shop No. 15, MG Road, Sector 14',
      amount: '₹85',
      status: 'delivered',
      date: '2025-10-06',
      time: '2:30 PM',
      items: 3
    },
    {
      id: 'ORD002',
      customerName: 'Priya Singh',
      address: 'A-201, Green Valley Apartments',
      amount: '₹45',
      status: 'delivered',
      date: '2025-10-06',
      time: '1:15 PM',
      items: 2
    },
    {
      id: 'ORD003',
      customerName: 'Amit Kumar',
      address: 'Office Complex, Block B',
      amount: '₹120',
      status: 'cancelled',
      date: '2025-10-05',
      time: '4:45 PM',
      items: 5
    },
  ];

  const filterOrders = (orders) => {
    if (selectedTab === 'completed') {
      return orders.filter(order => order.status === 'delivered');
    } else if (selectedTab === 'cancelled') {
      return orders.filter(order => order.status === 'cancelled');
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
        <Text style={styles.address}>{item.address}</Text>
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

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'all' && styles.activeTab]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.activeTabText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'completed' && styles.activeTab]}
          onPress={() => setSelectedTab('completed')}
        >
          <Text style={[styles.tabText, selectedTab === 'completed' && styles.activeTabText]}>
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'cancelled' && styles.activeTab]}
          onPress={() => setSelectedTab('cancelled')}
        >
          <Text style={[styles.tabText, selectedTab === 'cancelled' && styles.activeTabText]}>
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <FlatList
        data={filterOrders(ordersData)}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ordersList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 20,
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
    marginHorizontal: 32,
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