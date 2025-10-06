import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { colors } from '../components/colors';

const OrderHistory = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, pending, completed, cancelled
  const [searchQuery, setSearchQuery] = useState('');

  // Sample orders history data with different statuses
  const ordersData = [
    {
      id: 'ORD001',
      customerName: 'Rahul Sharma',
      customerPhone: '+91 9876543210',
      address: 'Shop No. 15, MG Road, Sector 14, Gurgaon',
      items: ['2x Samosa', '1x Chai', '3x Biscuits'],
      amount: '₹85',
      status: 'completed',
      date: '2025-10-06',
      time: '2:30 PM',
      orderTime: '1:45 PM',
      deliveryTime: '15 mins'
    },
    {
      id: 'ORD002',
      customerName: 'Priya Singh',
      customerPhone: '+91 9123456789',
      address: 'A-201, Green Valley Apartments, Sector 12',
      items: ['1x Tea', '4x Parle-G', '1x Maggi'],
      amount: '₹45',
      status: 'pending',
      date: '2025-10-06',
      time: 'Now',
      orderTime: '3:15 PM',
      deliveryTime: '12 mins'
    },
    {
      id: 'ORD003',
      customerName: 'Amit Kumar',
      customerPhone: '+91 9988776655',
      address: 'Office Complex, Block B, Cyber City',
      items: ['3x Coffee', '2x Sandwich'],
      amount: '₹120',
      status: 'cancelled',
      date: '2025-10-05',
      time: '4:45 PM',
      orderTime: '4:30 PM',
      reason: 'Customer unavailable'
    },
    {
      id: 'ORD004',
      customerName: 'Sunita Devi',
      customerPhone: '+91 9765432108',
      address: 'House No. 42, Civil Lines, Near Park',
      items: ['1x Cold Drink', '2x Chips'],
      amount: '₹65',
      status: 'completed',
      date: '2025-10-05',
      time: '6:20 PM',
      orderTime: '5:50 PM',
      deliveryTime: '18 mins'
    },
    {
      id: 'ORD005',
      customerName: 'Rajesh Gupta',
      customerPhone: '+91 9654321098',
      address: 'Flat 3B, Sunrise Apartments, Sector 18',
      items: ['1x Bread', '2x Butter', '1x Milk'],
      amount: '₹95',
      status: 'pending',
      date: '2025-10-06',
      time: 'Now',
      orderTime: '3:45 PM',
      deliveryTime: '8 mins'
    }
  ];

  const filterOrders = (orders) => {
    let filtered = orders;
    
    // Filter by status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(order => order.status === selectedFilter);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(order => 
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        color: colors.primary.yellow2,
        backgroundColor: colors.primary.yellow3,
        text: 'Pending',
        icon: 'time-outline'
      },
      completed: {
        color: colors.neutrals.dark,
        backgroundColor: colors.neutrals.lightGray,
        text: 'Completed',
        icon: 'checkmark-circle-outline'
      },
      cancelled: {
        color: colors.neutrals.gray,
        backgroundColor: colors.neutrals.lightGray,
        text: 'Cancelled',
        icon: 'close-circle-outline'
      }
    };
    return configs[status] || configs.pending;
  };

  const getFilterCount = (filter) => {
    if (filter === 'all') return ordersData.length;
    return ordersData.filter(order => order.status === filter).length;
  };

  const FilterTab = ({ filter, label, isActive, onPress }) => (
    <TouchableOpacity 
      style={[styles.filterTab, isActive && styles.activeFilterTab]}
      onPress={onPress}
    >
      <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
        {label}
      </Text>
      <View style={[styles.countBadge, isActive && styles.activeCountBadge]}>
        <Text style={[styles.countText, isActive && styles.activeCountText]}>
          {getFilterCount(filter)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderOrderCard = ({ item }) => {
    const statusConfig = getStatusConfig(item.status);
    
    return (
      <View style={styles.orderCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>{item.id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
              <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.text}
              </Text>
            </View>
          </View>
          <View style={styles.amountSection}>
            <Text style={styles.amount}>{item.amount}</Text>
            <Text style={styles.orderTime}>{item.time}</Text>
          </View>
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
          <View style={styles.addressInfo}>
            <Ionicons name="location-outline" size={16} color={colors.neutrals.gray} />
            <Text style={styles.address}>{item.address}</Text>
          </View>
          <TouchableOpacity 
            style={styles.mapButton}
            onPress={() => navigation.navigate('Maps', { 
              deliveries: [{ 
                id: item.id,
                customerName: item.customerName,
                address: item.address,
                phone: item.customerPhone,
                status: item.status,
                coordinate: {
                  latitude: 28.4595 + (Math.random() - 0.5) * 0.1,
                  longitude: 77.0266 + (Math.random() - 0.5) * 0.1
                },
                amount: item.amount
              }]
            })}
          >
            <Ionicons name="navigate-outline" size={16} color={colors.primary.yellow2} />
          </TouchableOpacity>
        </View>

        {/* Items */}
        <View style={styles.itemsSection}>
          <Text style={styles.itemsLabel}>Items</Text>
          <Text style={styles.items}>{item.items.join(', ')}</Text>
        </View>

        {/* Order Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Order Time</Text>
            <Text style={styles.detailValue}>{item.orderTime}</Text>
          </View>
          
          {item.status === 'completed' && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Delivery Time</Text>
              <Text style={styles.detailValue}>{item.deliveryTime}</Text>
            </View>
          )}
          
          {item.status === 'cancelled' && item.reason && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Reason</Text>
              <Text style={[styles.detailValue, { color: colors.neutrals.gray }]}>
                {item.reason}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Order History</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={colors.neutrals.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders, customers..."
            placeholderTextColor={colors.neutrals.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.neutrals.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterSection}>
        <FilterTab 
          filter="all"
          label="All"
          isActive={selectedFilter === 'all'}
          onPress={() => setSelectedFilter('all')}
        />
        <FilterTab 
          filter="pending"
          label="Pending"
          isActive={selectedFilter === 'pending'}
          onPress={() => setSelectedFilter('pending')}
        />
        <FilterTab 
          filter="completed"
          label="Completed"
          isActive={selectedFilter === 'completed'}
          onPress={() => setSelectedFilter('completed')}
        />
        <FilterTab 
          filter="cancelled"
          label="Cancelled"
          isActive={selectedFilter === 'cancelled'}
          onPress={() => setSelectedFilter('cancelled')}
        />
      </View>

      {/* Orders List */}
      {filterOrders(ordersData).length > 0 ? (
        <FlatList
          data={filterOrders(ordersData)}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.ordersList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={48} color={colors.neutrals.gray} />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No orders found' : `No ${selectedFilter === 'all' ? '' : selectedFilter} orders`}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Orders will appear here when available'
            }
          </Text>
        </View>
      )}
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
    fontSize: 28,
    fontWeight: '300',
    color: colors.neutrals.dark,
    letterSpacing: -0.5,
  },
  searchSection: {
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutrals.lightGray,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.neutrals.dark,
    marginLeft: 12,
    fontWeight: '400',
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    marginBottom: 24,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: colors.neutrals.lightGray,
  },
  activeFilterTab: {
    backgroundColor: colors.primary.yellow2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.neutrals.gray,
    marginRight: 6,
  },
  activeFilterText: {
    color: 'white',
  },
  countBadge: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  activeCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutrals.gray,
  },
  activeCountText: {
    color: 'white',
  },
  ordersList: {
    paddingBottom: 32,
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
    alignItems: 'flex-start',
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
    fontWeight: '500',
    color: colors.neutrals.dark,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.neutrals.dark,
    letterSpacing: -0.5,
  },
  orderTime: {
    fontSize: 12,
    color: colors.neutrals.gray,
    marginTop: 4,
    fontWeight: '400',
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
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  address: {
    fontSize: 14,
    color: colors.neutrals.gray,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
    fontWeight: '400',
  },
  mapButton: {
    padding: 12,
    backgroundColor: colors.primary.yellow3,
    borderRadius: 12,
    marginLeft: 12,
  },
  itemsSection: {
    marginBottom: 16,
  },
  itemsLabel: {
    fontSize: 12,
    color: colors.neutrals.gray,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  items: {
    fontSize: 14,
    color: colors.neutrals.dark,
    lineHeight: 20,
    fontWeight: '400',
  },
  detailsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    minWidth: 120,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.neutrals.gray,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: colors.neutrals.dark,
    fontWeight: '400',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    color: colors.neutrals.gray,
    fontWeight: '300',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.neutrals.gray,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '400',
  },
});

export default OrderHistory;
