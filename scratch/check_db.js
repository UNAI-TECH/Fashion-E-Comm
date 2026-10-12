import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing with ANON key (as regular browser visitor)...');
const supabase = createClient(url, anonKey);

async function testAnonCheckout() {
  const testOrderId = 'ord_anon_' + Date.now();
  console.log('Testing Anon Order ID:', testOrderId);

  // 1. Insert order as unauthenticated guest
  const { data: orderData, error: orderErr } = await supabase.from('orders').insert({
    id: testOrderId,
    total_amount: 999.00,
    total_price: 999.00,
    status: 'Confirmed',
    payment_method: 'UPI',
    payment_status: 'Completed',
    shipping_address: { full_name: 'Guest Customer', phone: '9123456780' }
  }).select();

  console.log('Anon Order insert:', { orderData, orderErr });

  if (orderErr) return;

  // 2. Insert payment as unauthenticated guest
  const { data: payData, error: payErr } = await supabase.from('payments').insert({
    order_id: testOrderId,
    amount: 999.00,
    currency: 'INR',
    payment_method: 'Google Pay',
    gateway_txn_id: 'GPAY_ANON_' + Date.now(),
    payer_vpa: 'guest@okhdfcbank',
    customer_name: 'Guest Customer',
    customer_phone: '9123456780',
    status: 'Completed'
  }).select();

  console.log('Anon Payment insert:', { payData, payErr });

  // 3. Clean up using service key
  const adminClient = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);
  await adminClient.from('payments').delete().eq('order_id', testOrderId);
  await adminClient.from('orders').delete().eq('id', testOrderId);
  console.log('Anon test cleanup finished.');
}

testAnonCheckout();
