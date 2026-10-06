// Supabase Edge Function: verify-email-otp
// Authoritatively verifies the 6-digit OTP code dispatched via SMTP
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function createHmac(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, code, verification_token, purpose = "verification" } = await req.json();

    if (!email || !code || !verification_token) {
      return new Response(
        JSON.stringify({ success: false, error: "Email, OTP code, and verification token are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();
    const [expiresAtStr, expectedSig] = verification_token.split(".");
    const expiresAt = Number(expiresAtStr);

    if (Date.now() > expiresAt) {
      return new Response(
        JSON.stringify({ success: false, error: "The verification code has expired. Please request a new code." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const secretKey = Deno.env.get("OTP_SECRET_KEY") || "aanya-fashions-supabase-edge-secret-key-32";
    const actualSig = await createHmac(`${cleanEmail}:${cleanCode}:${expiresAt}:${purpose}`, secretKey);

    if (actualSig !== expectedSig) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid verification code. Please check your code and try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Code is authoritatively verified!
    return new Response(
      JSON.stringify({
        success: true,
        message: "Email verified successfully.",
        verified: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Supabase Edge Verify Error]:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to verify code." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
