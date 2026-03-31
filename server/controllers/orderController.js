import { supabase } from '../config/supabase.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      address,
      paymentMethod,
      taxPrice,
      shippingPrice,
      totalAmount,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // 1. Stock validation before placement
    for (const item of orderItems) {
      const { data: product } = await supabase
        .from('products')
        .select('name, stock_quantity')
        .eq('id', item.product)
        .single();

      if (!product) {
         return res.status(404).json({ message: `Product not found: ${item.name}` });
      }
      if (product.stock_quantity < item.qty) {
         return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
      }
    }

    // Insert the actual order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: req.user.id,
        shipping_address: address,
        payment_method: paymentMethod,
        tax_amount: taxPrice,
        shipping_fee: shippingPrice,
        total_amount: totalAmount,
        status: 'Pending',
        payment_status: 'Pending'
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items and deduct stock
    const orderItemsData = [];
    for (const item of orderItems) {
      orderItemsData.push({
        order_id: order.id,
        product_id: item.product,
        quantity: item.qty,
        price_at_time: item.price,
        total_price: item.price * item.qty
      });

      // Deduct stock (Not atomic. In prod, use an Postgres RPC!)
      const { data: p } = await supabase.from('products').select('stock_quantity').eq('id', item.product).single();
      await supabase.from('products').update({ stock_quantity: p.stock_quantity - item.qty }).eq('id', item.product);
    }

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);
    if (itemsError) throw itemsError;
    
    // Clear user cart
    const { data: cart } = await supabase.from('carts').select('id').eq('user_id', req.user.id).single();
    if(cart) await supabase.from('cart_items').delete().eq('cart_id', cart.id);

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`*, profiles:user_id(full_name, email)`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updates = { status };

    if (status === 'Delivered') {
       // Just marking it status Delivered. No separate field needed if relying on status.
       // Although order.isDelivered is requested, our Supabase Schema used 'status'.
    }

    if (status === 'Cancelled') {
         // Restore stock
         const { data: items } = await supabase.from('order_items').select('product_id, quantity').eq('order_id', req.params.id);
         for (const item of items) {
           const { data: p } = await supabase.from('products').select('stock_quantity').eq('id', item.product_id).single();
           if (p) {
             await supabase.from('products').update({ stock_quantity: p.stock_quantity + item.quantity }).eq('id', item.product_id);
           }
         }
    }

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify mock payment and update status
// @route   POST /api/payment/verify
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { orderId, transactionId, status, email_address } = req.body;

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({
         payment_status: 'Success',
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
