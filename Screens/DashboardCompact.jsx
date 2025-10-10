import { Ionicons } from '@expo/vector-icons';
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

const Dashboard = ({ navigation }) => {
  // ... all the state and logic from original Dashboard component ...
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [notifications, setNotifications] = useState(2);
  const [deliveries, setDeliveries] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    todayStats: { totalOrders: 8, completedOrders: 5, earnings: 450 }
  });
  const [deliveryBoyInfo] = useState({
    name: 'Raj Kumar',
    isVerified: true
  });

  // Mock data
  useEffect(() => {
    const mockDeliveries = [
      {
        id: 'ORD001',
        customerName: 'Priya Sharma',
        address: 'Golf Course Road, DLF Phase 2, Gurgaon',
        items: ['1x Milk (1L)', '2x Bread', '1x Eggs (12pc)'],
        amount: '₹180',
        status: 'assigned',
        distance: '1.8 km',
        estimatedTime: '8 mins'
      }
    ];
    setDeliveries(mockDeliveries);
    setLoading(false);
  }, []);

  const handleAvailabilityToggle = () => setIsOnline(!isOnline);
  const handleStatusUpdate = (orderId, status) => {
    setDeliveries(prev => 
      prev.map(d => d.id === orderId ? { ...d, status } : d)
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      assigned: '#FFB800',
      picked_up: '#FF8A00', 
      out_for_delivery: '#00B8FF',
      delivered: '#1a1a1a'
    };
    return colors[status] || '#666';
  };

  const renderDeliveryCard = ({ item }) => (
    <View style={styles.deliveryCard}>
      <View style={styles.cardHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.amount}>{item.amount}</Text>
      </View>

      <View style={styles.customerRow}>
        <Ionicons name="person-outline" size={14} color="#666" />
        <Text style={styles.customerName}>{item.customerName}</Text>
        <TouchableOpacity style={styles.callButton}>
          <Ionicons name="call" size={14} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      <View style={styles.addressRow}>
        <Ionicons name="location-outline" size={14} color="#666" />
        <Text style={styles.address}>{item.address}</Text>
      </View>

      <Text style={styles.items}>{item.items.join(', ')}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="navigate" size={12} color="#666" />
          <Text style={styles.metaText}>{item.distance}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time" size={12} color="#666" />
          <Text style={styles.metaText}>{item.estimatedTime}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {item.status === 'assigned' && (
          <TouchableOpacity 
            style={styles.primaryAction}
            onPress={() => handleStatusUpdate(item.id, 'picked_up')}
          >
            <Text style={styles.actionText}>Pick Up</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.secondaryAction}>
          <Ionicons name="warning-outline" size={14} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FFB800" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Compact Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.name}>{deliveryBoyInfo.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('Maps')}>
            <Ionicons name="map-outline" size={22} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={22} color="#1a1a1a" />
            {notifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Compact Status Toggle */}
      <View style={styles.statusRow}>
        <View style={styles.statusInfo}>
          <View style={[styles.dot, { backgroundColor: isOnline ? '#FFB800' : '#ccc' }]} />
          <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
          <Text style={styles.statusSubtext}>{isOnline ? 'Available' : 'Not accepting'}</Text>
        </View>
        <Switch value={isOnline} onValueChange={handleAvailabilityToggle} />
      </View>

      {/* Compact Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Ionicons name="bicycle" size={18} color="#FFB800" />
          <Text style={styles.statNumber}>{dashboardStats.todayStats.totalOrders}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle" size={18} color="#FFB800" />
          <Text style={styles.statNumber}>{dashboardStats.todayStats.completedOrders}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="cash" size={18} color="#FFB800" />
          <Text style={styles.statNumber}>₹{dashboardStats.todayStats.earnings}</Text>
          <Text style={styles.statLabel}>Earned</Text>
        </View>
      </View>

      {/* Deliveries List */}
      <View style={styles.deliveriesSection}>
        <Text style={styles.sectionTitle}>Active Deliveries ({deliveries.length})</Text>
        <FlatList
          data={deliveries}
          renderItem={renderDeliveryCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {}} />
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  greeting: {
    fontSize: 12,
    color: '#666',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBtn: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFB800',
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    marginTop: 1,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginRight: 8,
  },
  statusSubtext: {
    fontSize: 12,
    color: '#666',
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginTop: 1,
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  deliveriesSection: {
    flex: 1,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  deliveryCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
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
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  customerName: {
    fontSize: 13,
    color: '#1a1a1a',
    marginLeft: 6,
    flex: 1,
  },
  callButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  address: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
  items: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    color: 'white',
    fontWeight: '500',
  },
  secondaryAction: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
});

export default Dashboard;
