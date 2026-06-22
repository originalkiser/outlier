// Supabase Edge Function — outlier-create-auth-user
// Uses service role key to create/update auth users server-side.
// Deploy with: supabase functions deploy outlier-create-auth-user
// Set secret: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<key>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, profile_id } = await req.json()

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'email and password are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Create or update auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      // If user already exists, update password
      if (authError.message?.includes('already')) {
        const { data: list } = await adminClient.auth.admin.listUsers()
        const existing = list?.users?.find(u => u.email === email)
        if (existing) {
          await adminClient.auth.admin.updateUserById(existing.id, { password })
          // Update profile link
          if (profile_id) {
            await adminClient
              .from('outlier_user_profiles')
              .update({ auth_user_id: existing.id })
              .eq('id', profile_id)
          }
          return new Response(JSON.stringify({ user_id: existing.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }
      throw authError
    }

    const userId = authData.user.id

    // Link to profile
    if (profile_id) {
      await adminClient
        .from('outlier_user_profiles')
        .update({ auth_user_id: userId })
        .eq('id', profile_id)
    }

    return new Response(JSON.stringify({ user_id: userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
