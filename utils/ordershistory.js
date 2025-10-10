import { API_CONFIG } from './apiConfig';

// Fetch single order details by ID (with populated fields)
export const fetchOrderDetails = async (orderId, token) => {
  try {
    const response = await fetch(`${API_CONFIG.getBaseURL()}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await response.json();
    console.log('Order Details Response:', data); // Debug log
    if (!response.ok) throw new Error(data.message || 'Failed to fetch order details');
    return { success: true, order: data.data };
  } catch (error) {
    console.error('Error fetching order details:', error);
    return { success: false, message: error.message || 'Server error', order: null };
  }
};

// Fetch all orders (assigned + history) for delivery boy
export const fetchAllOrders = async ({ page = 1, limit = 10, startDate, endDate, token }) => {
  try {
    // Build query params
    let params = `?page=${page}&limit=${limit}`;
    if (startDate && endDate) {
      params += `&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    }

    // Fetch assigned orders
    const assignedRes = await fetch(`${API_CONFIG.getBaseURL()}/delivery/deliveries${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const assignedData = await assignedRes.json();
    if (!assignedRes.ok) throw new Error(assignedData.message || 'Failed to fetch assigned orders');

    // Fetch delivery history
    const historyRes = await fetch(`${API_CONFIG.getBaseURL()}/delivery/history${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const historyData = await historyRes.json();
    if (!historyRes.ok) throw new Error(historyData.message || 'Failed to fetch delivery history');

    // Merge orders
    const orders = [...(assignedData.data?.orders || []), ...(historyData.data?.orders || [])];

    // Merge pagination (optional: you can customize this)
    const pagination = {
      current: page,
      pages: Math.max(
        assignedData.data?.pagination?.pages || 1,
        historyData.data?.pagination?.pages || 1
      ),
      total:
        (assignedData.data?.pagination?.total || 0) + (historyData.data?.pagination?.total || 0),
    };

    // Merge earnings
    const earnings = historyData.data?.earnings || 0;
    console.log('Order Details Response:', orders); // Debug log

    return {
      success: true,
      orders,
      pagination,
      earnings,
    };
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return {
      success: false,
      message: error.message || 'Server error',
      orders: [],
      pagination: { current: 1, pages: 1, total: 0 },
      earnings: 0,
    };
  }
};
