import { supabase } from '../config/supabase.js';

// Helper to generate unique order number: ORD-YYYYMMDD-XXXXXX
const generateOrderNumber = () => {
  const d = new Date();
  const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${dateStr}-${rand}`;
};

// Helper to generate human-readable tracking number: AANYA-YYYYMMDD-XXXXXX
const generateTrackingNumber = () => {
  const d = new Date();
  const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `AANYA-${dateStr}-${rand}`;
};

// @desc    Create new order with atomic inventory deduction and snapshot
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      address,
      paymentMethod = 'COD',
      taxPrice = 0,
      shippingPrice = 0,
      discountAmount = 0,
      couponCode = null,
      totalAmount,
    } = req.body;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'EMPTY_CART', message: 'Order must contain at least one item.' }
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_ADDRESS', message: 'Shipping address is required.' }
      });
    }

    // 1. Validate all products and stock availability server-side
    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of orderItems) {
      const productId = item.product || item.product_id;
      const qty = Number(item.qty || item.quantity) || 1;

      const { data: dbProduct, error: prodErr } = await supabase
        .from('products')
        .select('id, name, price, images, stock_quantity, status')
        .eq('id', productId)
        .single();

      if (prodErr || !dbProduct) {
        return res.status(404).json({
          success: false,
          error: { code: 'PRODUCT_NOT_FOUND', message: `Product "${item.name || productId}" is no longer available.` }
        });
      }

      if (dbProduct.stock_quantity < qty) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: `"${dbProduct.name}" only has ${dbProduct.stock_quantity} item(s) in stock. Please adjust quantity.`
          }
        });
      }

      const itemPrice = Number(dbProduct.price);
      calculatedSubtotal += itemPrice * qty;

      validatedItems.push({
        product_id: dbProduct.id,
        quantity: qty,
        price_at_time: itemPrice,
        total_price: itemPrice * qty,
        size: item.size || 'Regular',
        color: item.color || null,
        product_name: dbProduct.name,
        product_image: Array.isArray(dbProduct.images) && dbProduct.images.length > 0 ? dbProduct.images[0] : null
      });
    }

    // Server recalculates grand total
    const serverGrandTotal = Math.max(0, calculatedSubtotal + Number(taxPrice) + Number(shippingPrice) - Number(discountAmount));

    const orderNumber = generateOrderNumber();
    const trackingNumber = generateTrackingNumber();

    // 2. Perform atomic stock deduction using RPC or conditional UPDATE
    for (const vItem of validatedItems) {
      // Attempt RPC decrement_stock
      const { error: rpcError } = await supabase.rpc('decrement_stock', {
        p_product_id: vItem.product_id,
        p_qty: vItem.quantity
      });

      if (rpcError) {
        // Fallback to conditional update if RPC is missing
        const { data: updatedProduct, error: updateErr } = await supabase
          .from('products')
          .update({
            stock_quantity: supabase.raw ? supabase.raw(`stock_quantity - ${vItem.quantity}`) : 0,
            updated_at: new Date()
          })
          .eq('id', vItem.product_id)
          .gte('stock_quantity', vItem.quantity)
          .select('stock_quantity');

        if (updateErr) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_STOCK',
              message: `Could not reserve stock for item "${vItem.product_name}".`
            }
          });
        }
      }
    }

    // 3. Create the authoritative Order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: req.user.id,
        order_number: orderNumber,
        tracking_number: trackingNumber,
        shipping_address: address,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'COD' ? 'Pending' : 'Pending',
        status: 'Pending',
        subtotal: calculatedSubtotal,
        tax_amount: Number(taxPrice),
        shipping_fee: Number(shippingPrice),
        discount_amount: Number(discountAmount),
        total_amount: serverGrandTotal
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 4. Create snapshot items in order_items
    const orderItemsPayload = validatedItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_time: item.price_at_time,
      total_price: item.total_price,
      size: item.size,
      color: item.color
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);
    if (itemsError) console.error('Order items snapshot warning:', itemsError);

    // 5. Record initial order status history
    await supabase.from('order_status_history').insert({
      order_id: order.id,
      old_status: null,
      new_status: 'Pending',
      changed_by: req.user.id,
      reason: 'Order placed by customer'
    });

    // 6. Record coupon redemption if coupon was applied
    if (couponCode && discountAmount > 0) {
      const { data: cData } = await supabase.from('coupons').select('id').ilike('code', couponCode).single();
      if (cData) {
        await supabase.from('coupon_redemptions').insert({
          coupon_id: cData.id,
          user_id: req.user.id,
          order_id: order.id,
          discount_applied: discountAmount
        });
        // Increment coupon times_used
        await supabase.rpc('increment_coupon_uses', { p_coupon_id: cData.id }).catch(() => {});
      }
    }

    // 7. Clear user server cart
    const { data: userCart } = await supabase.from('carts').select('id').eq('user_id', req.user.id).single();
    if (userCart) {
      await supabase.from('cart_items').delete().eq('cart_id', userCart.id);
    }

    res.status(201).json({
      success: true,
      order: {
        ...order,
        items: validatedItems
      }
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ORDER_CREATION_FAILED', message: error.message }
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price_at_time,
          total_price,
          size,
          color,
          product_id,
          products (id, name, images)
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(orders || []);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single order details by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price_at_time,
          total_price,
          size,
          color,
          product_id,
          products (id, name, images)
        ),
        order_status_history (
          id,
          old_status,
          new_status,
          created_at,
          reason
        )
      `)
      .eq('id', id)
      .single();

    if (error || !order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify customer owns this order or is admin
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles:user_id(full_name, email, phone),
        order_items (
          id,
          quantity,
          price_at_time,
          size,
          products (name, images)
        )
      `, { count: 'exact' });

    if (status && status !== 'All') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`order_number.ilike.%${search}%,tracking_number.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: orders, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.json({
      orders: orders || [],
      count: count || 0,
      page: Number(page),
      pages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status with state machine & stock restoration on cancellation
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const { id } = req.params;

    // Allowed status values
    const validStatuses = [
      'Pending',
      'Confirmed',
      'Packed',
      'Shipped',
      'Out for Delivery',
      'Delivered',
      'Cancelled',
      'Returned'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status: "${status}". Valid statuses: ${validStatuses.join(', ')}`
      });
    }

    // Get current order
    const { data: currentOrder, error: curErr } = await supabase
      .from('orders')
      .select('id, status, user_id')
      .eq('id', id)
      .single();

    if (curErr || !currentOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const oldStatus = currentOrder.status;

    // If cancelling, restore stock atomically
    if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
      const { data: items } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', id);

      if (items && items.length > 0) {
        for (const item of items) {
          // Restore stock via RPC or direct update
          await supabase.rpc('restore_stock', {
            p_product_id: item.product_id,
            p_qty: item.quantity,
            p_reason: 'cancellation'
          }).catch(async () => {
            const { data: p } = await supabase.from('products').select('stock_quantity').eq('id', item.product_id).single();
            if (p) {
              await supabase.from('products').update({ stock_quantity: p.stock_quantity + item.quantity }).eq('id', item.product_id);
            }
          });
        }
      }
    }

    // Update status
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Record audit trail in order_status_history
    await supabase.from('order_status_history').insert({
      order_id: id,
      old_status: oldStatus,
      new_status: status,
      changed_by: req.user.id,
      reason: reason || `Status updated to ${status} by admin`
    });

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
