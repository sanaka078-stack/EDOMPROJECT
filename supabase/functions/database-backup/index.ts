import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// All tables to backup
const TABLES_TO_BACKUP = [
  'products',
  'categories',
  'orders',
  'order_items',
  'order_tracking',
  'customers',
  'coupons',
  'coupon_usage',
  'contact_messages',
  'contact_message_replies',
  'live_chat_conversations',
  'live_chat_messages',
  'product_reviews',
  'product_variants',
  'product_inventory',
  'inventory_history',
  'abandoned_carts',
  'analytics_events',
  'daily_stats',
  'profiles',
  'user_roles',
  'user_sessions',
  'login_activity',
  'failed_login_attempts',
  'blocked_login_attempts',
  'account_lockouts',
  'blocked_ips',
  'geo_blocking_rules',
  'ip_rate_limits',
  'ip_rate_limit_settings',
  'notifications',
  'email_templates',
  'enabled_payment_methods',
  'payment_methods',
  'pathao_settings',
  'store_settings',
  'auto_reply_settings',
  'auto_discount_rules',
  'canned_responses',
  'conversation_tags',
  'customer_notes',
  'shipping_zones',
  'shipping_rates',
]

interface BackupRequest {
  format: 'json' | 'csv'
  backup_type: 'manual' | 'scheduled'
  tables?: string[]
}

// Convert array of objects to CSV string
function arrayToCSV(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvRows = [headers.join(',')]
  
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header]
      if (val === null || val === undefined) return ''
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return String(val)
    })
    csvRows.push(values.join(','))
  }
  
  return csvRows.join('\n')
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client for backup operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client with user token
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify user using getClaims for Lovable Cloud compatibility
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
    const { format, backup_type, tables }: BackupRequest = await req.json()
    const tablesToBackup = tables || TABLES_TO_BACKUP

    console.log(`Starting ${backup_type} backup in ${format} format for ${tablesToBackup.length} tables`)

    // Create backup record
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `backup_${backup_type}_${timestamp}.${format === 'json' ? 'json' : 'zip'}`
    
    const { data: backupRecord, error: recordError } = await supabaseAdmin
      .from('database_backups')
      .insert({
        backup_type,
        file_format: format,
        file_path: fileName,
        tables_included: tablesToBackup,
        status: 'in_progress',
        created_by: userId,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (recordError) {
      console.error('Failed to create backup record:', recordError)
      throw new Error('Failed to create backup record')
    }

    // Fetch all table data
    const backupData: Record<string, unknown[]> = {}
    const errors: string[] = []

    for (const table of tablesToBackup) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(10000) // Limit per table to prevent memory issues
        
        if (error) {
          console.warn(`Error fetching ${table}:`, error.message)
          errors.push(`${table}: ${error.message}`)
          backupData[table] = []
        } else {
          backupData[table] = data || []
          console.log(`Fetched ${data?.length || 0} rows from ${table}`)
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error'
        console.warn(`Exception fetching ${table}:`, e)
        errors.push(`${table}: ${errorMessage}`)
        backupData[table] = []
      }
    }

    // Generate backup content
    let content: string
    let contentType: string
    
    if (format === 'json') {
      content = JSON.stringify({
        backup_info: {
          created_at: new Date().toISOString(),
          type: backup_type,
          tables: tablesToBackup,
          total_records: Object.values(backupData).reduce((sum, arr) => sum + arr.length, 0)
        },
        data: backupData,
        errors: errors.length > 0 ? errors : undefined
      }, null, 2)
      contentType = 'application/json'
    } else {
      // For CSV, create a combined format with table headers
      const csvParts: string[] = []
      for (const [table, data] of Object.entries(backupData)) {
        if (data.length > 0) {
          csvParts.push(`\n### TABLE: ${table} ###\n`)
          csvParts.push(arrayToCSV(data as Record<string, unknown>[]))
        }
      }
      content = csvParts.join('\n')
      contentType = 'text/csv'
    }

    // Calculate file size
    const fileSize = new Blob([content]).size

    // Upload to storage
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('database-backups')
      .upload(fileName, content, {
        contentType,
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      
      // Update record with failure
      await supabaseAdmin
        .from('database_backups')
        .update({
          status: 'failed',
          error_message: uploadError.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', backupRecord.id)

      throw new Error(`Failed to upload backup: ${uploadError.message}`)
    }

    // Update backup record with success
    await supabaseAdmin
      .from('database_backups')
      .update({
        status: 'completed',
        file_size: fileSize,
        completed_at: new Date().toISOString(),
        error_message: errors.length > 0 ? `Partial errors: ${errors.join('; ')}` : null
      })
      .eq('id', backupRecord.id)

    console.log(`Backup completed: ${fileName} (${fileSize} bytes)`)

    return new Response(
      JSON.stringify({
        success: true,
        backup_id: backupRecord.id,
        file_name: fileName,
        file_size: fileSize,
        tables_backed_up: tablesToBackup.length,
        total_records: Object.values(backupData).reduce((sum, arr) => sum + arr.length, 0),
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Backup error:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
