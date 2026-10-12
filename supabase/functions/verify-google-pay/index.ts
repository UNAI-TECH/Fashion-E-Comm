// @ts-nocheck
// Supabase Edge Function: verify-google-pay
// Authoritatively validates Google Pay India UPI transaction against order details and logs into public.payments
// Adheres strictly to the Bank/PSP verification boundary: Orders remain "Pending Verification"
// unless an authorized bank/PSP status verification confirms settlement.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MERCHANT_VPA = Deno.env.get("GOOGLE_PAY_MERCHANT_VPA") || "aanya.fashions@okaxis";
const MERCHANT_MCC = Deno.env.get("GOOGLE_PAY_MCC") || "5691";
const PSP_STATUS_API_URL = Deno.env.get("PSP_STATUS_API_URL");
const PSP_API_KEY = Deno.env.get("PSP_API_KEY");

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      orderId,
      amount,
      txnId,
      transactionReference,
      payerVpa,
      paymentMethod = "Google Pay",
      userId,
      customerName,
      customerPhone,
      rawDetails = {},
    } = await req.json();

    if (!orderId || !amount || !txnId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "orderId, amount, and txnId are required for authoritative payment verification.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase service environment variables.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Authoritative check: verify order exists and validate payable amount
    const { data: orderData, error: orderFetchErr } = await supabase
      .from("orders")
      .select("id, total_amount, total_price, payment_status, status, user_id")
      .eq("id", String(orderId))
      .maybeSingle();

    if (orderFetchErr) {
      console.warn("Order lookup warning:", orderFetchErr);
    }

    if (orderData) {
      const expectedAmount = Number(orderData.total_amount || orderData.total_price || 0);
      if (expectedAmount > 0 && Math.abs(expectedAmount - Number(amount)) > 1.0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Authoritative verification failed: Amount mismatch. Expected ₹${expectedAmount}, received ₹${amount}.`,
            status: "Failed",
            requiresPspReconciliation: true,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // 2. Bank/PSP authoritative status check boundary
    let isBankVerified = false;
    let bankVerificationNotes = "Awaiting Bank/PSP payment-status API integration.";

    if (PSP_STATUS_API_URL && PSP_API_KEY) {
      try {
        const pspRes = await fetch(PSP_STATUS_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${PSP_API_KEY}`,
          },
          body: JSON.stringify({
            merchantVpa: MERCHANT_VPA,
            mcc: MERCHANT_MCC,
            transactionReference: transactionReference || txnId,
            orderId: String(orderId),
            amount: Number(amount),
            currency: "INR",
          }),
        });

        if (pspRes.ok) {
          const pspData = await pspRes.json();
          if (pspData.status === "SUCCESS" || pspData.status === "PAID") {
            isBankVerified = true;
            bankVerificationNotes = `Verified via bank/PSP: ${pspData.rrn || pspData.utr || "Confirmed"}`;
          } else {
            bankVerificationNotes = `Bank reported status: ${pspData.status || "Pending"}`;
          }
        }
      } catch (pspErr) {
        console.warn("PSP API inquiry warning:", pspErr);
      }
    }

    const determinedPaymentStatus = isBankVerified ? "Completed" : "Pending Verification";
    const determinedOrderStatus = isBankVerified ? "Confirmed" : "Pending";

    // 3. Record transaction in public.payments table (idempotent on gateway_txn_id)
    const { data: paymentRecord, error: paymentError } = await supabase
      .from("payments")
      .insert({
        order_id: String(orderId),
        user_id: userId || null,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        amount: Number(amount),
        currency: "INR",
        payment_method: paymentMethod,
        gateway_txn_id: String(txnId),
        payer_vpa: payerVpa || null,
        status: determinedPaymentStatus,
        metadata: {
          ...rawDetails,
          transactionReference: transactionReference || null,
          merchantVpa: MERCHANT_VPA,
          mcc: MERCHANT_MCC,
          bankVerificationNotes,
          isBankVerified,
          submittedAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (paymentError) {
      // If already recorded (idempotent), fetch existing record
      if (paymentError.code === "23505") {
        const { data: existing } = await supabase
          .from("payments")
          .select()
          .eq("gateway_txn_id", String(txnId))
          .single();

        return new Response(
          JSON.stringify({
            success: true,
            status: existing?.status || determinedPaymentStatus,
            message: "Payment transaction already recorded.",
            payment: existing,
            requiresPspReconciliation: !isBankVerified,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      console.error("Error inserting into payments table:", paymentError);
      throw paymentError;
    }

    // 4. Update orders table with exact payment status
    try {
      await supabase
        .from("orders")
        .update({
          payment_status: determinedPaymentStatus,
          status: determinedOrderStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", String(orderId));
    } catch (orderUpdateErr) {
      console.warn("Could not update order record:", orderUpdateErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: determinedPaymentStatus,
        message: isBankVerified
          ? "Payment verified by acquiring bank. Order confirmed."
          : "Payment details received from Google Pay sheet. Order is Pending Verification awaiting merchant bank/PSP reconciliation.",
        payment: paymentRecord,
        requiresPspReconciliation: !isBankVerified,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Verification function error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Internal verification error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
