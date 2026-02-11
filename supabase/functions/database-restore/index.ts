import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tables that can be restored (in order of dependencies)
const RESTORABLE_TABLES = [
  'categories',
  'products',
  'product_variants',
  'product_inventory',
  'customers',
  'coupons',
  'orders',
  'order_items',
  'order_tracking',
  'coupon_usage',
  'contact_messages',
  'contact_message_replies',
  'live_chat_conversations',
  'live_chat_messages',
  'product_reviews',
  'inventory_history',
  'abandoned_carts',
  'conversation_tags',
  'customer_notes',
  'shipping_zones',
  'shipping_rates',
  'store_settings',
  'email_templates',
  'enabled_payment_methods',
  'payment_methods',
  'pathao_settings',
  'auto_reply_settings',
  'auto_discount_rules',
  'canned_responses',
]

interface RestoreRequest {
  backup_data: string
  format: 'json' | 'csv'
  tables?: string[]
  mode: 'merge' | 'replace'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token)
    
    if (claimsError || !claimsData?.claims) {
      console.error('Auth claims error:', claimsError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claimsData.claims.sub as string

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'manager'])
      .single()

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request
    const { backup_data, format, tables, mode }: RestoreRequest = await req.json()
    
    if (!backup_data) {
      return new Response(
        JSON.stringify({ error: 'No backup data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Starting restore in ${mode} mode for format ${format}`)

    // Parse backup data
    let parsedData: Record<string, unknown[]>
    
    if (format === 'json') {
      const jsonData = JSON.parse(backup_data)
      parsedData = jsonData.data || jsonData
    } else {
      return new Response(
        JSON.stringify({ error: 'CSV restore not yet supported. Please use JSON format.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const tablesToRestore = tables || Object.keys(parsedData).filter(t => RESTORABLE_TABLES.includes(t))
    const results: Record<string, { success: boolean; count: number; error?: string }> = {}
    
    // Restore each table
    for (const table of RESTORABLE_TABLES) {
      if (!tablesToRestore.includes(table) || !parsedData[table]) {
        continue
      }

      const tableData = parsedData[table] as Record<string, unknown>[]
      
      if (!tableData || tableData.length === 0) {
        results[table] = { success: true, count: 0 }
        continue
      }

      try {
        if (mode === 'replace') {
          // Delete existing data first
          const { error: deleteError } = await supabaseAdmin
            .from(table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows
          
          if (deleteError) {
            console.warn(`Error clearing ${table}:`, deleteError.message)
          }
        }

        // Insert data in batches
        const batchSize = 100
        let insertedCount = 0
        
        for (let i = 0; i < tableData.length; i += batchSize) {
          const batch = tableData.slice(i, i + batchSize)
          
          // Remove system columns that might cause conflicts
          const cleanedBatch = batch.map(row => {
            const cleaned = { ...row }
            delete cleaned.created_at
            delete cleaned.updated_at
            return cleaned
          })

          const { error: insertError } = await supabaseAdmin
            .from(table)
            .upsert(cleanedBatch, { onConflict: 'id', ignoreDuplicates: mode === 'merge' })
          
          if (insertError) {
            console.error(`Error inserting into ${table}:`, insertError.message)
            results[table] = { success: false, count: insertedCount, error: insertError.message }
            break
          }
          
          insertedCount += batch.length
        }

        if (!results[table]) {
          results[table] = { success: true, count: insertedCount }
        }
        
        console.log(`Restored ${insertedCount} rows to ${table}`)
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error'
        console.error(`Exception restoring ${table}:`, e)
        results[table] = { success: false, count: 0, error: errorMessage }
      }
    }

    const totalRestored = Object.values(results).reduce((sum, r) => sum + r.count, 0)
    const failedTables = Object.entries(results).filter(([, r]) => !r.success).map(([t]) => t)

    return new Response(
      JSON.stringify({
        success: failedTables.length === 0,
        total_restored: totalRestored,
        tables_restored: Object.keys(results).length,
        results,
        failed_tables: failedTables.length > 0 ? failedTables : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Restore error:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
