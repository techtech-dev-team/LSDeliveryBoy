import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../components/colors';
import { fetchOrderDetails } from '../utils/ordershistory';

const OrderDetails = ({ route }) => {
    const { order } = route.params;
    const [orderDetails, setOrderDetails] = useState(order || null);
    const [loading, setLoading] = useState(!order);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!order || !order._id) return;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const token = await AsyncStorage.getItem('delivery_boy_token');
                const res = await fetchOrderDetails(order._id, token);
                if (res.success) {
                    setOrderDetails(res.order);
                } else {
                    setError(res.message);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [order]);

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary.yellow2} /><Text>Loading order details...</Text></View>;
    }
    if (error) {
        return <View style={styles.center}><Text style={{ color: 'red' }}>Error: {error}</Text></View>;
    }
    if (!orderDetails) {
        return <View style={styles.center}><Text>No order details found.</Text></View>;
    }

    // Render order details
    return (
        <ScrollView style={styles.container}>
			// ...existing code...

            <Text style={styles.label}>Customer Info:</Text>
            <Text style={styles.value}>
                {orderDetails.customer?.name || 'N/A'} | {orderDetails.customer?.phone || ''} | {orderDetails.customer?.email || ''}
            </Text>

            <Text style={styles.label}>Delivery Boy:</Text>
            <Text style={styles.value}>
                {orderDetails.delivery?.deliveryBoy?.name || 'N/A'} | {orderDetails.delivery?.deliveryBoy?.phone || ''}
            </Text>

            <Text style={styles.label}>Items:</Text>
            {Array.isArray(orderDetails.items) && orderDetails.items.length > 0 ? (
                orderDetails.items.map((item, idx) => (
                    <View key={idx} style={styles.itemBox}>
                        <Text style={styles.itemName}>
                            {item.product?.name || item.name || 'Item'} ({item.product?.unit || ''})
                        </Text>
                        <Text style={styles.itemQty}>Qty: {item.quantity || item.qty || 1}</Text>
                        <Text style={styles.value}>
                            Price: ₹{item.product?.pricing?.sellingPrice || item.product?.price || 'N/A'}
                        </Text>
                        <Text style={styles.value}>
                            Vendor: {item.vendor?.name || ''} | {item.vendor?.phoneNumber || ''} | {item.vendor?.vendorInfo?.businessName || ''}
                        </Text>
                    </View>
                ))
            ) : (
                <Text style={styles.value}>No items found.</Text>
            )}

            <Text style={styles.label}>Kirana List:</Text>
            {Array.isArray(orderDetails.kiranaList) && orderDetails.kiranaList.length > 0 ? (
                orderDetails.kiranaList.map((k, idx) => (
                    <Text key={idx} style={styles.value}>{k.listId?.name}</Text>
                ))
            ) : (
                <Text style={styles.value}>No kirana list found.</Text>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 20,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        color: colors.neutrals.dark,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
        color: colors.neutrals.gray,
    },
    value: {
        fontSize: 16,
        color: colors.neutrals.dark,
        marginTop: 2,
    },
    itemBox: {
        backgroundColor: colors.neutrals.lightGray,
        borderRadius: 8,
        padding: 8,
        marginVertical: 4,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.neutrals.dark,
    },
    itemQty: {
        fontSize: 14,
        color: colors.neutrals.gray,
    },
});

export default OrderDetails;
