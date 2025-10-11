import { API_CONFIG } from './apiConfig';

// Fetch single order details by ID (with populated fields)
export const fetchOrderDetails = async (orderId, token) => {
  try {
    console.log('🔍 Fetching order details for ID:', orderId);
    
    const response = await fetch(`${API_CONFIG.getBaseURL()}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    
    const data = await response.json();
    console.log('📋 Order Details API Response:', {
      success: data.success,
      orderId: data.data?._id?.slice(-8),
      hasVendors: !!data.data?.vendors,
      vendorsCount: data.data?.vendors?.length || 0,
      vendorStructure: data.data?.vendors?.[0] ? {
        hasVendorField: !!data.data.vendors[0].vendor,
        vendorId: data.data.vendors[0].vendor?._id?.slice(-8),
        vendorName: data.data.vendors[0].vendor?.vendorInfo?.businessName || data.data.vendors[0].vendor?.name,
        hasItems: !!data.data.vendors[0].items,
        itemsCount: data.data.vendors[0].items?.length || 0
      } : null,
      hasItems: !!data.data?.items,
      itemsCount: data.data?.items?.length || 0,
      itemsStructure: data.data?.items?.[0] ? {
        hasProduct: !!data.data.items[0].product,
        hasVendor: !!data.data.items[0].vendor,
        vendorName: data.data.items[0].vendor?.vendorInfo?.businessName || data.data.items[0].vendor?.name
      } : null
    });
    
    if (!response.ok) throw new Error(data.message || 'Failed to fetch order details');
    return { success: true, order: data.data };
  } catch (error) {
    console.error('❌ Error fetching order details:', error);
    return { success: false, message: error.message || 'Server error', order: null };
  }
};

// Fetch all orders (assigned + history) for delivery boy
export const fetchAllOrders = async ({ page = 1, limit = 10, startDate, endDate, token, tab }) => {
  try {
    // Build query params
    let params = `?page=${page}&limit=${limit}`;
    if (startDate && endDate) {
      params += `&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    }
    if (tab && tab !== 'all') {
      params += `&tab=${tab}`;
    }

    console.log('🔗 API Call:', `${API_CONFIG.getBaseURL()}/delivery/deliveries${params}`);

    // Use the single deliveries endpoint which properly populates items
    const response = await fetch(`${API_CONFIG.getBaseURL()}/delivery/deliveries${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch orders');

    console.log('📦 API Response structure:', {
      success: data.success,
      ordersCount: data.data?.orders?.length || 0,
      summary: data.data?.summary,
      firstOrder: data.data?.orders?.[0] ? {
        id: data.data.orders[0]._id?.slice(-8),
        vendors: data.data.orders[0].vendors?.length || 0,
        hasItems: !!data.data.orders[0].vendors?.[0]?.items,
        itemsCount: data.data.orders[0].vendors?.[0]?.items?.length || 0
      } : null
    });

    return {
      success: true,
      orders: data.data?.orders || [],
      pagination: data.data?.pagination || { current: 1, pages: 1, total: 0 },
      summary: data.data?.summary || {},
      earnings: data.data?.earnings || 0,
    };
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return {
      success: false,
      message: error.message || 'Server error',
      orders: [],
      pagination: { current: 1, pages: 1, total: 0 },
      summary: {},
      earnings: 0,
    };
  }
};
