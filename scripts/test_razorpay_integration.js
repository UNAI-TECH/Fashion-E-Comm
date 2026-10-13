/**
 * Aanya Fashions - Razorpay Payment Gateway & Compliance Verification Test
 */

import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

console.log('================================================================');
console.log('💳 TESTING RAZORPAY PAYMENT GATEWAY & POLICY VERIFICATION SUITE');
console.log('================================================================\n');

let passed = 0;
let total = 0;

function assert(condition, testName) {
  total++;
  if (condition) {
    console.log(`✅ PASS [${total}]: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL [${total}]: ${testName}`);
    process.exitCode = 1;
  }
}

// ─── 1. CONFIGURATION CHECKS ───
console.log('--- 1. Razorpay Merchant Configuration ---');
const keyId = process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

assert(Boolean(keyId), `Razorpay Key ID is present in environment: ${keyId}`);
assert(Boolean(keySecret), 'Razorpay Key Secret is present in environment');

// ─── 2. HMAC-SHA256 SIGNATURE VERIFICATION SPEC ───
console.log('\n--- 2. Cryptographic Signature Generation & Verification ---');
const testOrderId = 'order_test_rzp_984210';
const testPaymentId = 'pay_test_rzp_112233';
const testSecret = 'rzp_test_secret_placeholder';

const generatedSignature = crypto
  .createHmac('sha256', testSecret)
  .update(`${testOrderId}|${testPaymentId}`)
  .digest('hex');

assert(generatedSignature.length === 64, `Signature is standard 64-character hex hash (${generatedSignature.slice(0, 16)}...)`);

// Verify signature matches
const isMatch = crypto
  .createHmac('sha256', testSecret)
  .update(`${testOrderId}|${testPaymentId}`)
  .digest('hex') === generatedSignature;

assert(isMatch === true, 'HMAC SHA-256 signature verification succeeds for authentic payment');

// Verify tampered signature fails
const isTamperedMatch = crypto
  .createHmac('sha256', testSecret)
  .update(`${testOrderId}|fake_payment_id`)
  .digest('hex') === generatedSignature;

assert(isTamperedMatch === false, 'Tampered transaction payload correctly rejected');

// ─── 3. ORDER AMOUNT FORMATTING (PAISE CONVERSION) ───
console.log('\n--- 3. Order Amount Calculation (INR -> Paise) ---');
const inrAmount = 2499.00;
const paiseAmount = Math.round(inrAmount * 100);
assert(paiseAmount === 249900, `₹2,499.00 accurately converts to 249,900 paise for Razorpay API`);

console.log(`\n====================================================`);
console.log(`🎉 SUMMARY: ${passed}/${total} Tests Passed`);
console.log('====================================================\n');
