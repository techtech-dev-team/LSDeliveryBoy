import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Platform
} from 'react-native';
import { colors, typography } from '../components/colors';
import { fetchOrderDetails } from '../utils/ordershistory';

const OrderDetails = ({ navigation, route }) => {
  const { order } = route.params;
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(order);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    fetchDetailedOrderData();
  }, [order]);

  const fetchDetailedOrderData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('delivery_boy_token');
      const response = await fetchOrderDetails(order._id, token);
      
      if (response.success && response.order) {
        setOrderData(response.order);
      } else {
        // If detailed fetch fails, use the existing order data
        setOrderData(order);
      }
    } catch (error) {
      console.error('Error fetching detailed order:', error);
      setOrderData(order); // Fallback to existing data
    } finally {
      setLoading(false);
    }
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

  const handleCallCustomer = () => {
    const phone = orderData.customer?.phone || orderData.customerInfo?.phone;
    if (phone) {
      const phoneUrl = Platform.OS === 'ios' ? `tel:${phone}` : `tel:${phone}`;
      Linking.openURL(phoneUrl);
    } else {
      Alert.alert('Error', 'Customer phone number not available');
    }
  };

  const handleUpdateStatus = () => {
    // Navigate to status update screen or show modal
    Alert.alert(
      'Update Status',
      'Choose the next status for this order',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark as Picked Up', onPress: () => updateOrderStatus('picked_up') },
        { text: 'Out for Delivery', onPress: () => updateOrderStatus('out_for_delivery') },
        { text: 'Delivered', onPress: () => updateOrderStatus('delivered') },
      ]
    );
  };

  const updateOrderStatus = (newStatus) => {
    setUpdateLoading(true);
    // TODO: Implement API call to update order status
    setTimeout(() => {
      setOrderData({ ...orderData, status: newStatus });
      setUpdateLoading(false);
      Alert.alert('Success', 'Order status updated successfully');
    }, 1000);
  };

  const handleNavigateToLocation = () => {
    const address = orderData.deliveryAddress;
    if (address && address.coordinates) {
      const { latitude, longitude } = address.coordinates;
      const url = Platform.OS === 'ios' 
        ? `maps://app?daddr=${latitude},${longitude}`
        : `google.navigation:q=${latitude},${longitude}`;
      
      Linking.openURL(url).catch(() => {
        // Fallback to web maps
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        Linking.openURL(webUrl);
      });
    } else {
      Alert.alert('Error', 'Delivery address coordinates not available');
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'Address not available';
    
    if (typeof address === 'string') return address;
    
    const parts = [
      address.landmark,
      address.address,
      address.city,
      address.state,
      address.pincode
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.neutrals.dark} />
          </TouchableOpacity>
          <Text style={styles.title}>Order Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.yellow2} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </View>
    );
  }

  if (!orderData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.neutrals.dark} />
          </TouchableOpacity>
          <Text style={styles.title}>Order Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order data not available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.neutrals.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Header Card - Compact */}
        <View style={styles.orderCard}>
          <View style={styles.cardHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderId}>#{orderData.orderNumber || orderData._id?.slice(-8)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(orderData.status) }]}>
                <Text style={styles.statusText}>{getStatusText(orderData.status)}</Text>
              </View>
            </View>
            <Text style={styles.amount}>₹{orderData.pricing?.total || 0}</Text>
          </View>
          
          <View style={styles.orderMetaInfo}>
            <Text style={styles.orderDate}>{formatDate(orderData.createdAt)}</Text>
            {orderData.delivery?.deliveredAt && (
              <Text style={styles.deliveredDate}>
                Delivered: {formatDate(orderData.delivery.deliveredAt)}
              </Text>
            )}
          </View>
        </View>

        {/* Customer & Address Combined Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={18} color={colors.neutrals.dark} />
            <Text style={styles.sectionTitle}>Customer & Delivery</Text>
          </View>
          
          <View style={styles.customerRow}>
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>
                {orderData.customer?.name || orderData.customerInfo?.name || 'Customer'}
              </Text>
              {orderData.customerInfo?.email && (
                <Text style={styles.customerEmail}>{orderData.customerInfo.email}</Text>
              )}
            </View>
            {(orderData.customer?.phone || orderData.customerInfo?.phone) && (
              <TouchableOpacity style={styles.phoneButton} onPress={handleCallCustomer}>
                <Ionicons name="call" size={14} color="white" />
                <Text style={styles.phoneButtonText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={16} color={colors.neutrals.gray} />
            <Text style={styles.address}>{formatAddress(orderData.deliveryAddress)}</Text>
            <TouchableOpacity style={styles.navigateButton} onPress={handleNavigateToLocation}>
              <Ionicons name="navigate" size={14} color={colors.primary.yellow2} />
            </TouchableOpacity>
          </View>
          
          {orderData.specialInstructions && (
            <View style={styles.instructionsSection}>
              <Ionicons name="information-circle-outline" size={14} color={colors.primary.yellow2} />
              <Text style={styles.instructions}>{orderData.specialInstructions}</Text>
            </View>
          )}
        </View>

        {/* Vendor Information */}
        {orderData.vendors && orderData.vendors.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="storefront-outline" size={18} color={colors.neutrals.dark} />
              <Text style={styles.sectionTitle}>Store Information</Text>
            </View>
            
            {orderData.vendors.map((vendorData, index) => (
              <View key={index} style={styles.vendorInfo}>
                <Text style={styles.vendorName}>
                  {vendorData.vendor?.vendorInfo?.businessName || 
                   vendorData.vendor?.name || 
                   vendorData.vendorInfo?.businessName ||
                   'Store'}
                </Text>
                {(vendorData.vendor?.phoneNumber || vendorData.vendor?.phone) && (
                  <Text style={styles.vendorPhone}>
                    📞 {vendorData.vendor?.phoneNumber || vendorData.vendor?.phone}
                  </Text>
                )}
                {vendorData.vendor?.vendorInfo?.businessAddress && (
                  <Text style={styles.vendorAddress}>
                    📍 {formatAddress(vendorData.vendor.vendorInfo.businessAddress)}
                  </Text>
                )}
                {vendorData.subtotal && (
                  <Text style={styles.vendorSubtotal}>
                    Subtotal: ₹{vendorData.subtotal}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Order Items - Compact */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bag-outline" size={18} color={colors.neutrals.dark} />
            <Text style={styles.sectionTitle}>Items</Text>
            <Text style={styles.itemCount}>
              {Array.isArray(orderData.items) ? orderData.items.length :
               orderData.orderItems?.length || 0} items
            </Text>
          </View>
          
          {orderData.items && orderData.items.length > 0 ? (
            orderData.items.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>
                    {item.name || item.product?.name || `Item ${index + 1}`}
                  </Text>
                  <Text style={styles.itemDetails}>
                    Qty: {item.quantity || 1} × ₹{item.price || item.product?.pricing?.sellingPrice || 0}
                    {item.unit && ` per ${item.unit}`}
                  </Text>
                  {item.sku && (
                    <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                  )}
                </View>
                <Text style={styles.itemTotal}>
                  ₹{item.total || (item.quantity * (item.price || item.product?.pricing?.sellingPrice || 0)) || 0}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.noItemsContainer}>
              <Text style={styles.noItems}>
                Items from {orderData.vendors?.[0]?.vendor?.vendorInfo?.businessName || 'store'}
              </Text>
              <Text style={styles.itemsNote}>
                {orderData.pricing?.subtotal ? `Subtotal: ₹${orderData.pricing.subtotal}` : 'Details not available'}
              </Text>
            </View>
          )}
        </View>

        {/* Payment Summary - Compact */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={18} color={colors.neutrals.dark} />
            <Text style={styles.sectionTitle}>Payment Details</Text>
          </View>
          
          <View style={styles.paymentSummary}>
            {orderData.pricing?.subtotal && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Subtotal</Text>
                <Text style={styles.paymentValue}>₹{orderData.pricing.subtotal}</Text>
              </View>
            )}
            
            {orderData.pricing?.taxes?.total && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Taxes</Text>
                <Text style={styles.paymentValue}>₹{orderData.pricing.taxes.total}</Text>
              </View>
            )}
            
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Delivery Charge</Text>
              <Text style={styles.paymentValue}>₹{orderData.pricing?.deliveryCharge || 0}</Text>
            </View>

            {orderData.pricing?.discount?.amount > 0 && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Discount</Text>
                <Text style={[styles.paymentValue, { color: colors.neutrals.success }]}>
                  -₹{orderData.pricing.discount.amount}
                </Text>
              </View>
            )}
            
            <View style={[styles.paymentRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{orderData.pricing?.total || 0}</Text>
            </View>
            
            <View style={styles.paymentMethodRow}>
              <Text style={styles.paymentMethodLabel}>Method:</Text>
              <Text style={styles.paymentMethodValue}>
                {orderData.payment?.method?.toUpperCase() || 'COD'}
              </Text>
              <Text style={[styles.paymentStatus, { 
                color: orderData.payment?.status === 'completed' ? colors.neutrals.success : colors.neutrals.gray 
              }]}>
                ({orderData.payment?.status || 'pending'})
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons - Compact */}
        {orderData.status !== 'delivered' && orderData.status !== 'cancelled' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.updateButton} 
              onPress={handleUpdateStatus}
              disabled={updateLoading}
            >
              {updateLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="white" />
                  <Text style={styles.buttonText}>Update Status</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutrals.lightGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 65,
  },
  title: {
    fontSize: 18,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.medium,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutrals.lightGray,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutrals.lightGray,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutrals.dark,
  },
  orderMetaInfo: {
    marginTop: 6,
  },
  orderDate: {
    fontSize: 13,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.medium,
  },
  deliveredDate: {
    fontSize: 13,
    color: colors.neutrals.success,
    fontFamily: typography.fontFamily.medium,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
    marginLeft: 6,
    flex: 1,
  },
  itemCount: {
    fontSize: 12,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.medium,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
  },
  customerEmail: {
    fontSize: 12,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.yellow2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  phoneButtonText: {
    fontSize: 12,
    color: 'white',
    fontFamily: typography.fontFamily.medium,
    marginLeft: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: colors.neutrals.dark,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 20,
    flex: 1,
    marginLeft: 6,
  },
  navigateButton: {
    padding: 6,
    backgroundColor: colors.primary.yellow1 + '20',
    borderRadius: 12,
    marginLeft: 8,
  },
  instructionsSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary.yellow1 + '15',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  instructions: {
    fontSize: 13,
    color: colors.neutrals.dark,
    fontFamily: typography.fontFamily.medium,
    marginLeft: 6,
    flex: 1,
    lineHeight: 18,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
  },
  itemDetails: {
    fontSize: 12,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
  },
  itemSku: {
    fontSize: 11,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.regular,
    marginTop: 1,
  },
  noItemsContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  itemsNote: {
    fontSize: 12,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.regular,
    marginTop: 4,
  },
  vendorInfo: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutrals.lightGray,
  },
  vendorName: {
    fontSize: 15,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
  },
  vendorPhone: {
    fontSize: 13,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.regular,
    marginTop: 4,
  },
  vendorAddress: {
    fontSize: 13,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.regular,
    marginTop: 4,
    lineHeight: 18,
  },
  vendorSubtotal: {
    fontSize: 13,
    color: colors.primary.yellow2,
    fontFamily: typography.fontFamily.medium,
    marginTop: 4,
  },
  noItems: {
    fontSize: 13,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
    paddingVertical: 16,
  },
  paymentSummary: {
    marginTop: 4,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  paymentLabel: {
    fontSize: 13,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.regular,
  },
  paymentValue: {
    fontSize: 13,
    color: colors.neutrals.dark,
    fontFamily: typography.fontFamily.medium,
  },
  totalValue: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: colors.neutrals.dark,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  paymentMethodLabel: {
    fontSize: 13,
    color: colors.neutrals.gray,
    fontFamily: typography.fontFamily.regular,
  },
  paymentMethodValue: {
    fontSize: 13,
    color: colors.neutrals.dark,
    fontFamily: typography.fontFamily.medium,
    marginLeft: 6,
  },
  paymentStatus: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    marginLeft: 6,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.neutrals.lightGray,
    marginTop: 8,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: typography.fontFamily.medium,
    color: colors.neutrals.dark,
  },
  actionButtons: {
    paddingVertical: 8,
    marginBottom: 20,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.yellow2,
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.medium,
    color: 'white',
    marginLeft: 6,
  },
});

export default OrderDetails;
