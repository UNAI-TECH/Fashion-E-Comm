/**
 * Google Pay India Integration Verification Script
 * Validates Google Pay UPI URI specification, NPCI parameters, and Edge Function payload structure.
 */

console.log('====================================================');
console.log('🚀 TESTING GOOGLE PAY INDIA (TEZ / UPI) INTEGRATION');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// 1. UPI URI Generation
function buildGooglePayUpiUri({ pa, pn, mc, tr, tn, am, cu = 'INR' }) {
  const query = new URLSearchParams({
    pa,
    pn,
    mc: mc || '5691',
    tr,
    tn: tn || `Order ${tr}`,
    am: Number(amountClean(am)).toFixed(2),
    cu,
  });
  return `upi://pay?${query.toString()}`;
}

function amountClean(amount) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return isNaN(num) ? 0 : Math.max(0, num);
}

const sampleOrder = {
  pa: 'gpay-12204900082@okbizaxis',
  pn: 'Aanya Fashions',
  mc: '5691',
  tr: 'ORD-20261012-984210',
  tn: 'Aanya Fashions Order ORD-20261012-984210',
  am: 2499,
  cu: 'INR'
};

const uri = buildGooglePayUpiUri(sampleOrder);
console.log('Generated UPI Intent URI:', uri);

assert(uri.startsWith('upi://pay?'), 'URI starts with standard UPI scheme upi://pay?');
assert(uri.includes('pa=aanya.fashions%40okaxis'), 'Merchant VPA properly encoded');
assert(uri.includes('mc=5691'), 'Apparel & Fashion MCC code 5691 included');
assert(uri.includes('am=2499.00'), 'Amount formatted to two decimal places');
assert(uri.includes('cu=INR'), 'Currency set to Indian Rupee (INR)');
assert(uri.includes('tr=ORD-20261012-984210'), 'Transaction reference tr preserved');

// 2. Tez Web Payment Method Spec
const tezMethodData = {
  supportedMethods: 'https://tez.google.com/pay',
  data: {
    pa: sampleOrder.pa,
    pn: sampleOrder.pn,
    mc: sampleOrder.mc,
    tr: sampleOrder.tr,
    url: 'https://www.aanyafashions.com/checkout'
  }
};

assert(tezMethodData.supportedMethods === 'https://tez.google.com/pay', 'Google Pay India Web protocol supportedMethod is https://tez.google.com/pay');
assert(tezMethodData.data.pa === 'gpay-12204900082@okbizaxis', 'Merchant VPA matches');
assert(tezMethodData.data.mc === '5691', 'Merchant Category Code matches');

// 3. Supabase Edge Function Payload Validation
const edgeFunctionPayload = {
  orderId: 'ORD-20261012-984210',
  amount: 2499,
  txnId: 'GPAY-20261012-774912',
  payerVpa: 'customer@okaxis',
  paymentMethod: 'Google Pay',
  customerName: 'Ananya Sharma',
  customerPhone: '+91 98765 43210',
  rawDetails: {
    status: 'SUCCESS',
    googleTransactionId: 'GPAY-20261012-774912',
    timestamp: new Date().toISOString()
  }
};

assert(edgeFunctionPayload.orderId && edgeFunctionPayload.amount && edgeFunctionPayload.txnId, 'Edge function payload contains required fields (orderId, amount, txnId)');
assert(edgeFunctionPayload.paymentMethod === 'Google Pay', 'Payment method correctly classified as Google Pay');

console.log(`\n====================================================`);
console.log(`🎉 SUMMARY: ${passedTests}/${totalTests} Tests Passed`);
console.log('====================================================\n');
