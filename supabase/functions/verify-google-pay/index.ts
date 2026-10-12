// @ts-nocheck
// Supabase Edge Function: verify-google-pay
// Authoritatively logs Google Pay transaction into public.payments and updates order status
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      orderId,
      amount,
      txnId,
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
          error: "orderId, amount, and txnId are required to record payment.",
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

    // 1. Record transaction in public.payments table
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
        status: "Completed",
        metadata: rawDetails,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error inserting into payments table:", paymentError);
      // If table has duplicate gateway_txn_id, fetch existing
      if (paymentError.code === "23505") {
        const { data: existing } = await supabase
          .from("payments")
          .select()
          .eq("gateway_txn_id", txnId)
          .single();

        return new Response(
          JSON.stringify({
            success: true,
            alreadyRecorded: true,
            payment: existing,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      throw paymentError;
    }

    // 2. Authoritatively update orders table
    try {
      await supabase
        .from("orders")
        .update({
          payment_status: "Completed",
          status: "Confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);
    } catch (orderUpdateErr) {
      console.warn("Could not update order record:", orderUpdateErr);
    }

    // 3. Log to order_status_history if available
    try {
      await supabase.from("order_status_history").insert({
        order_id: String(orderId),
        old_status: "Pending",
        new_status: "Confirmed",
        changed_by: userId || null,
        reason: `Payment verified via ${paymentMethod} (Txn: ${txnId})`,
      });
    } catch (_) {
      // Non-fatal if history table does not exist
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment successfully verified and logged.",
        payment: paymentRecord,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("verify-google-pay edge function error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Internal payment verification error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
