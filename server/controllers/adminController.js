import { supabase } from '../config/supabase.js';

// @desc    Get admin statistics and analytics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: totalOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    const { count: totalProducts } = await supabase.from('products').select('*', { count: 'exact', head: true });
    
    // Calculate total revenue from all orders
    const { data: orders } = await supabase.from('orders').select('total_amount, created_at');
    const totalRevenue = orders ? orders.reduce((acc, item) => acc + Number(item.total_amount), 0) : 0;

    // Monthly revenue logic manually since PostgreSQL aggregates need RPC
    const monthlyData = Array(12).fill(0);
    if (orders) {
       for (const order of orders) {
          const m = new Date(order.created_at).getMonth();
          monthlyData[m] += Number(order.total_amount);
       }
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthlyRevenue = monthlyData.map((rev, i) => ({
      month: months[i],
      revenue: rev
    })).filter(item => item.revenue > 0);

    // Find low stock products
    const { data: lowStockAlerts } = await supabase
      .from('products')
      .select('name, stock_quantity, price')
      .lte('stock_quantity', 5);

    // For Top products, we will fetch order items and group locally to avoid writing RPC
    const { data: orderItems } = await supabase.from('order_items').select('quantity, product_id, products(name)');
    const productSalesMap = {};
    if (orderItems) {
       for (const item of orderItems) {
           const pid = item.product_id;
           if (!productSalesMap[pid]) {
               productSalesMap[pid] = { name: item.products?.name, totalSold: 0 };
           }
           productSalesMap[pid].totalSold += item.quantity;
       }
    }
    
    const topProducts = Object.values(productSalesMap)
        .sort((a,b) => b.totalSold - a.totalSold)
        .slice(0, 5);

    res.json({
      totalUsers: totalUsers || 0,
      totalOrders: totalOrders || 0,
      totalProducts: totalProducts || 0,
      totalRevenue,
      monthlyRevenue: formattedMonthlyRevenue,
      lowStockAlerts: lowStockAlerts || [],
      topProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
