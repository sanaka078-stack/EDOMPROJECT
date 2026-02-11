import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VerifyLoginRequest {
  action: "check" | "verify" | "resend";
  email?: string;
  deviceInfo?: {
    browser: string;
    os: string;
    device: string;
    isMobile: boolean;
  };
  verificationToken?: string;
  verificationCode?: string;
  userId?: string;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate a unique token
function generateToken(): string {
  return crypto.randomUUID();
}

// Check if login is suspicious (new device/browser combo)
async function isSuspiciousLogin(
  supabase: any,
  userId: string,
  deviceInfo: any
): Promise<{ suspicious: boolean; reason: string }> {
  // Get user's trusted sessions
  const { data: sessions } = await supabase
    .from("user_sessions")
    .select("device_info, device_fingerprint, is_trusted")
    .eq("user_id", userId)
    .is("revoked_at", null);

  if (!sessions || sessions.length === 0) {
    // First login ever - not suspicious
    return { suspicious: false, reason: "" };
  }

  // Create fingerprint from device info
  const currentFingerprint = `${deviceInfo.browser}-${deviceInfo.os}-${deviceInfo.device}`;

  // Check if this device fingerprint exists in trusted sessions
  const trustedSession = sessions.find((s: any) => {
    if (s.is_trusted && s.device_info) {
      const sessionFingerprint = `${s.device_info.browser}-${s.device_info.os}-${s.device_info.device}`;
      return sessionFingerprint === currentFingerprint;
    }
    return false;
  });

  if (trustedSession) {
    return { suspicious: false, reason: "" };
  }

  // Check if we've seen this device before (even if not trusted)
  const knownSession = sessions.find((s: any) => {
    if (s.device_info) {
      const sessionFingerprint = `${s.device_info.browser}-${s.device_info.os}-${s.device_info.device}`;
      return sessionFingerprint === currentFingerprint;
    }
    return false;
  });

  if (!knownSession) {
    return {
      suspicious: true,
      reason: `New device detected: ${deviceInfo.browser} on ${deviceInfo.os}`,
    };
  }

  return { suspicious: false, reason: "" };
}

// Send verification email using Resend API
async function sendVerificationEmail(
  email: string,
  code: string,
  deviceInfo: any,
  userName: string
): Promise<boolean> {
  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return false;
    }

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
    
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Security Alert <${fromEmail}>`,
        to: [email],
        subject: "Verify Your Login - Security Alert",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626; margin-bottom: 20px;">🔒 Login Verification Required</h1>
            
            <p>Hi ${userName},</p>
            
            <p>We detected a login attempt from a new device. For your security, please verify this is you.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">Device Details:</h3>
              <p style="margin: 5px 0;"><strong>Browser:</strong> ${deviceInfo.browser}</p>
              <p style="margin: 5px 0;"><strong>Operating System:</strong> ${deviceInfo.os}</p>
              <p style="margin: 5px 0;"><strong>Device Type:</strong> ${deviceInfo.device}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px;">Your verification code:</p>
              <h2 style="margin: 0; font-size: 32px; letter-spacing: 8px; color: #92400e;">${code}</h2>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #78716c;">This code expires in 15 minutes</p>
            </div>
            
            <p style="color: #dc2626; font-weight: bold;">If you didn't try to log in, please change your password immediately!</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            
            <p style="color: #6b7280; font-size: 12px;">This is an automated security email. Please do not reply.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Resend API error:", errorData);
      return false;
    }
    
    console.log("Verification email sent successfully to:", email);
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, email, deviceInfo, verificationToken, verificationCode, userId }: VerifyLoginRequest = await req.json();

    console.log("Verify login request:", { action, email, userId });

    if (action === "check") {
      // Check if login is suspicious and create blocked attempt if needed
      if (!userId || !email || !deviceInfo) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if suspicious login detection is enabled
      const { data: emailSettings } = await supabaseAdmin
        .from("store_settings")
        .select("value")
        .eq("key", "email_notifications")
        .single();

      const suspiciousLoginEnabled = emailSettings?.value?.suspiciousLoginEnabled !== false;

      if (!suspiciousLoginEnabled) {
        // Feature disabled, allow login
        return new Response(
          JSON.stringify({ blocked: false, message: "Login allowed (feature disabled)" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { suspicious, reason } = await isSuspiciousLogin(supabaseAdmin, userId, deviceInfo);

      if (!suspicious) {
        return new Response(
          JSON.stringify({ blocked: false, message: "Login allowed" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create blocked login attempt
      const token = generateToken();
      const code = generateVerificationCode();

      const { error: insertError } = await supabaseAdmin
        .from("blocked_login_attempts")
        .insert({
          user_id: userId,
          email: email,
          device_info: deviceInfo,
          verification_token: token,
          verification_code: code,
          blocked_reason: reason,
        });

      if (insertError) {
        console.error("Failed to create blocked attempt:", insertError);
        throw insertError;
      }

      // Get user name from profiles
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .single();

      const userName = profile?.full_name || email.split("@")[0];

      // Send verification email
      const emailSent = await sendVerificationEmail(email, code, deviceInfo, userName);

      return new Response(
        JSON.stringify({
          blocked: true,
          verificationToken: token,
          reason: reason,
          emailSent: emailSent,
          message: "Please verify your login with the code sent to your email",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify") {
      // Verify the code
      if (!verificationToken || !verificationCode) {
        return new Response(
          JSON.stringify({ error: "Missing verification token or code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: attempt, error: fetchError } = await supabaseAdmin
        .from("blocked_login_attempts")
        .select("*")
        .eq("verification_token", verificationToken)
        .is("verified_at", null)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (fetchError || !attempt) {
        return new Response(
          JSON.stringify({ verified: false, error: "Invalid or expired verification token" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (attempt.verification_code !== verificationCode) {
        return new Response(
          JSON.stringify({ verified: false, error: "Invalid verification code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark as verified
      await supabaseAdmin
        .from("blocked_login_attempts")
        .update({ verified_at: new Date().toISOString() })
        .eq("id", attempt.id);

      // Create/update trusted session
      const deviceFingerprint = `${attempt.device_info.browser}-${attempt.device_info.os}-${attempt.device_info.device}`;
      
      await supabaseAdmin
        .from("user_sessions")
        .upsert({
          user_id: attempt.user_id,
          session_token: crypto.randomUUID(),
          device_info: attempt.device_info,
          device_fingerprint: deviceFingerprint,
          is_trusted: true,
          last_active_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,device_fingerprint",
          ignoreDuplicates: false,
        });

      return new Response(
        JSON.stringify({ verified: true, message: "Login verified successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "resend") {
      // Resend verification code
      if (!verificationToken) {
        return new Response(
          JSON.stringify({ error: "Missing verification token" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: attempt, error: fetchError } = await supabaseAdmin
        .from("blocked_login_attempts")
        .select("*")
        .eq("verification_token", verificationToken)
        .is("verified_at", null)
        .single();

      if (fetchError || !attempt) {
        return new Response(
          JSON.stringify({ error: "Invalid verification token" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate new code and update expiry
      const newCode = generateVerificationCode();
      
      await supabaseAdmin
        .from("blocked_login_attempts")
        .update({
          verification_code: newCode,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        })
        .eq("id", attempt.id);

      // Get user name
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("user_id", attempt.user_id)
        .single();

      const userName = profile?.full_name || attempt.email.split("@")[0];

      // Send new email
      const emailSent = await sendVerificationEmail(
        attempt.email,
        newCode,
        attempt.device_info,
        userName
      );

      return new Response(
        JSON.stringify({ success: true, emailSent: emailSent }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in verify-login:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
