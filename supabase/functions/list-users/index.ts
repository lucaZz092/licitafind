import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[LIST-USERS] ${step}${detailsStr}`);
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
    
    logStep("User authenticated", { userId: user.id });

    // Check if user is admin
    const { data: userRoles, error: rolesError } = await supabaseClient
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (rolesError) throw rolesError;

    if (!userRoles || userRoles.length === 0) {
      logStep("User is not an admin");
      return new Response(JSON.stringify({ 
        error: "Acesso negado. Apenas administradores podem listar usuários." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    logStep("Admin access confirmed, fetching users");

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) throw profilesError;

    // Get all user roles
    const { data: allRoles, error: allRolesError } = await supabaseClient
      .from("user_roles")
      .select("*");

    if (allRolesError) throw allRolesError;

    // Combine profiles with roles
    const usersWithRoles = profiles?.map(profile => {
      const userRoles = allRoles?.filter(role => role.user_id === profile.id) || [];
      return {
        ...profile,
        roles: userRoles.map(r => r.role),
        is_admin: userRoles.some(r => r.role === "admin"),
      };
    }) || [];

    logStep("Users fetched successfully", { count: usersWithRoles.length });

    return new Response(JSON.stringify({ users: usersWithRoles }), {
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
