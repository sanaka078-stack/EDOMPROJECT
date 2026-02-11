import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DemoUser {
  email: string;
  password: string;
  fullName: string;
  role: "user" | "admin" | "manager" | "support";
}

const demoUsers: DemoUser[] = [
  {
    email: "admin@gmail.com",
    password: "admin@gmail.com",
    fullName: "Demo Admin",
    role: "admin",
  },
  {
    email: "manager@gmail.com",
    password: "manager@gmail.com",
    fullName: "Demo Manager",
    role: "manager",
  },
  {
    email: "support@gmail.com",
    password: "support@gmail.com",
    fullName: "Demo Support",
    role: "support",
  },
  {
    email: "user@gmail.com",
    password: "user@gmail.com",
    fullName: "Demo User",
    role: "user",
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const results: { email: string; status: string; error?: string }[] = [];

    for (const user of demoUsers) {
      try {
        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find((u) => u.email === user.email);

        if (existingUser) {
          // Update the role if user exists
          const { error: roleError } = await supabaseAdmin
            .from("user_roles")
            .upsert(
              { user_id: existingUser.id, role: user.role },
              { onConflict: "user_id" }
            );

          if (roleError) {
            results.push({ email: user.email, status: "role_update_failed", error: roleError.message });
          } else {
            results.push({ email: user.email, status: "exists_role_updated" });
          }
          continue;
        }

        // Create user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.fullName,
          },
        });

        if (createError) {
          results.push({ email: user.email, status: "create_failed", error: createError.message });
          continue;
        }

        if (newUser?.user) {
          // Update role to the specified one (trigger creates 'user' by default)
          if (user.role !== "user") {
            const { error: roleError } = await supabaseAdmin
              .from("user_roles")
              .update({ role: user.role })
              .eq("user_id", newUser.user.id);

            if (roleError) {
              results.push({ email: user.email, status: "created_role_update_failed", error: roleError.message });
              continue;
            }
          }

          results.push({ email: user.email, status: "created" });
        }
      } catch (err) {
        results.push({ email: user.email, status: "error", error: String(err) });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
