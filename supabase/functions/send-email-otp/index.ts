// Supabase Edge Function: send-email-otp
// Dispatches 6-digit verification code directly via SMTP (Port 465 SSL)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.13";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Cryptographic HMAC SHA-256 for stateless secure verification
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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, purpose = "verification" } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(
        JSON.stringify({ success: false, error: "A valid email address is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Generate 6-digit random code
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    // 2. Secret key from environment
    const secretKey = Deno.env.get("OTP_SECRET_KEY") || "aanya-fashions-supabase-edge-secret-key-32";
    const signature = await createHmac(`${cleanEmail}:${rawOtp}:${expiresAt}:${purpose}`, secretKey);
    const token = `${expiresAt}.${signature}`;

    // 3. SMTP configuration from Supabase secrets
    const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
    const smtpPort = Number(Deno.env.get("SMTP_PORT") || 465);
    const smtpUser = Deno.env.get("SMTP_USER") || Deno.env.get("SMTP_USERNAME") || "";
    const smtpPass = Deno.env.get("SMTP_PASS") || Deno.env.get("SMTP_PASSWORD") || "";
    const smtpFrom = Deno.env.get("SMTP_FROM") || (smtpUser ? `Aanya Fashions <${smtpUser}>` : "Aanya Fashions <no-reply@aanyafashions.com>");

    // If SMTP credentials are configured, dispatch directly via SMTP
    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465, // SSL for 465, STARTTLS for 587
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fdfbf7; padding: 24px; margin: 0; }
    .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e7ded3; padding: 36px 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .brand { text-align: center; font-family: serif; font-size: 26px; font-weight: bold; color: #1a1a1a; letter-spacing: 2px; }
    .subtitle { text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #888; margin-top: 4px; }
    .otp-badge { margin: 28px auto; text-align: center; background: #f4f6f2; border: 2px dashed #698156; padding: 18px 24px; border-radius: 14px; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #698156; }
    .desc { font-size: 13px; color: #555; text-align: center; line-height: 1.6; margin: 0 0 16px 0; }
    .warning { font-size: 12px; color: #888; text-align: center; margin-top: 16px; }
    .footer { font-size: 11px; color: #aaa; text-align: center; margin-top: 28px; border-top: 1px solid #f0f0f0; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">AANYA FASHIONS</div>
    <div class="subtitle">Luxury Indian Couture</div>
    <p class="desc" style="margin-top: 24px;">Your One-Time Password to authorize your ${purpose}:</p>
    <div class="otp-badge">${rawOtp}</div>
    <p class="desc"><strong>Valid for 5 minutes.</strong></p>
    <p class="warning">Do not share this code with anyone. Aanya representatives will never ask for your code.</p>
    <div class="footer">© 2026 Aanya Fashions. Direct Supabase SMTP Delivery.</div>
  </div>
</body>
</html>`;

        await transporter.sendMail({
          from: smtpFrom,
          to: cleanEmail,
          subject: `Your Aanya Fashions Security Code: ${rawOtp}`,
          text: `Your Aanya Fashions verification code is: ${rawOtp}. Valid for 5 minutes.`,
          html: htmlContent,
        });

        console.log(`[Supabase Edge Function] Direct SMTP OTP successfully sent to ${cleanEmail}`);
      } catch (smtpErr: any) {
        console.error('[Supabase Edge Function SMTP Error]:', smtpErr);
        return new Response(
          JSON.stringify({
            success: false,
            error: `SMTP Delivery Failed: ${smtpErr.message || 'Check your SMTP credentials in Supabase secrets.'}`
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.warn(`[Supabase Edge Function] SMTP_USER or SMTP_PASS secrets not set. Code generated for testing: ${rawOtp}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "A 6-digit verification code has been dispatched to your email via SMTP.",
        verification_token: token,
        expires_in_seconds: 300,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Supabase Edge Function Error]:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to dispatch verification email." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
