import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROMOTE-TO-ADMIN] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if there are any admins in the system
    const { data: existingAdmins, error: adminCheckError } = await supabaseClient
      .from("user_roles")
      .select("*")
      .eq("role", "admin");

    if (adminCheckError) throw adminCheckError;

    // If no admins exist, allow this user to become the first admin
    if (!existingAdmins || existingAdmins.length === 0) {
      logStep("No admins exist, creating first admin", { userId: user.id });
      
      const { error: insertError } = await supabaseClient
        .from("user_roles")
        .insert({ user_id: user.id, role: "admin" });

      if (insertError) throw insertError;

      logStep("First admin created successfully");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Você é agora o primeiro administrador do sistema!" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // If admins exist, check if the requesting user is already an admin
    const { data: userRoles, error: rolesError } = await supabaseClient
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (rolesError) throw rolesError;

    if (!userRoles || userRoles.length === 0) {
      logStep("User is not an admin and admins already exist");
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Apenas administradores podem promover outros usuários. Entre em contato com um admin existente." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // User is an admin, allow them to promote another user
    const { userId: targetUserId } = await req.json();
    if (!targetUserId) throw new Error("Target user ID is required");

    logStep("Admin promoting another user", { adminId: user.id, targetUserId });

    const { error: promoteError } = await supabaseClient
      .from("user_roles")
      .insert({ user_id: targetUserId, role: "admin" });

    if (promoteError) {
      if (promoteError.code === "23505") {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "Este usuário já é um administrador" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      throw promoteError;
    }

    logStep("User promoted to admin successfully");
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Usuário promovido a administrador com sucesso!" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
