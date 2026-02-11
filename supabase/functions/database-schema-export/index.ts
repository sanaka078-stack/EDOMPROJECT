import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ColumnInfo {
  table_name: string
  column_name: string
  data_type: string
  udt_name: string
  is_nullable: string
  column_default: string | null
  character_maximum_length: number | null
}

interface ConstraintInfo {
  constraint_name: string
  table_name: string
  column_name: string
  constraint_type: string
  foreign_table_name: string | null
  foreign_column_name: string | null
}

interface IndexInfo {
  tablename: string
  indexname: string
  indexdef: string
}

interface PolicyInfo {
  schemaname: string
  tablename: string
  policyname: string
  permissive: string
  roles: string[]
  cmd: string
  qual: string | null
  with_check: string | null
}

interface FunctionInfo {
  routine_name: string
  routine_definition: string
  data_type: string
  routine_type: string
}

interface TriggerInfo {
  trigger_name: string
  event_manipulation: string
  event_object_table: string
  action_statement: string
  action_timing: string
}

interface EnumInfo {
  typname: string
  enumlabel: string
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

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token)
    
    if (claimsError || !claimsData?.claims) {
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

    console.log('Starting schema export...')

    // 1. Get all ENUM types
    const { data: enumData } = await supabaseAdmin.rpc('get_enum_types')
    const enums = (enumData || []) as EnumInfo[]
    console.log(`Found ${enums.length} enum values`)

    // 2. Get all table columns
    const { data: columnsData } = await supabaseAdmin.rpc('get_table_columns')
    const columns = (columnsData || []) as ColumnInfo[]
    console.log(`Found columns for ${new Set(columns.map(c => c.table_name)).size} tables`)

    // 3. Get constraints (primary keys, foreign keys, unique)
    const { data: constraintsData } = await supabaseAdmin.rpc('get_table_constraints')
    const constraints = (constraintsData || []) as ConstraintInfo[]
    console.log(`Found ${constraints.length} constraints`)

    // 4. Get indexes
    const { data: indexesData } = await supabaseAdmin.rpc('get_table_indexes')
    const indexes = (indexesData || []) as IndexInfo[]
    console.log(`Found ${indexes.length} indexes`)

    // 5. Get RLS policies
    const { data: policiesData } = await supabaseAdmin.rpc('get_rls_policies')
    const policies = (policiesData || []) as PolicyInfo[]
    console.log(`Found ${policies.length} RLS policies`)

    // 6. Get functions
    const { data: functionsData } = await supabaseAdmin.rpc('get_db_functions')
    const functions = (functionsData || []) as FunctionInfo[]
    console.log(`Found ${functions.length} functions`)

    // 7. Get triggers
    const { data: triggersData } = await supabaseAdmin.rpc('get_db_triggers')
    const triggers = (triggersData || []) as TriggerInfo[]
    console.log(`Found ${triggers.length} triggers`)

    // Generate SQL
    const sqlParts: string[] = []
    const timestamp = new Date().toISOString()

    sqlParts.push(`-- ============================================`)
    sqlParts.push(`-- Database Schema Export`)
    sqlParts.push(`-- Generated: ${timestamp}`)
    sqlParts.push(`-- ============================================\n`)

    // Generate ENUM types
    if (enums.length > 0) {
      sqlParts.push(`-- ============================================`)
      sqlParts.push(`-- ENUM TYPES`)
      sqlParts.push(`-- ============================================\n`)
      
      const enumsByType = new Map<string, string[]>()
      for (const e of enums) {
        if (!enumsByType.has(e.typname)) {
          enumsByType.set(e.typname, [])
        }
        enumsByType.get(e.typname)!.push(e.enumlabel)
      }
      
      for (const [typeName, values] of enumsByType) {
        sqlParts.push(`CREATE TYPE public.${typeName} AS ENUM (${values.map(v => `'${v}'`).join(', ')});`)
      }
      sqlParts.push('')
    }

    // Group columns by table
    const tableColumns = new Map<string, ColumnInfo[]>()
    for (const col of columns) {
      if (!tableColumns.has(col.table_name)) {
        tableColumns.set(col.table_name, [])
      }
      tableColumns.get(col.table_name)!.push(col)
    }

    // Group constraints by table
    const tableConstraints = new Map<string, ConstraintInfo[]>()
    for (const con of constraints) {
      if (!tableConstraints.has(con.table_name)) {
        tableConstraints.set(con.table_name, [])
      }
      tableConstraints.get(con.table_name)!.push(con)
    }

    // Generate CREATE TABLE statements
    sqlParts.push(`-- ============================================`)
    sqlParts.push(`-- TABLES`)
    sqlParts.push(`-- ============================================\n`)

    for (const [tableName, cols] of tableColumns) {
      sqlParts.push(`-- Table: ${tableName}`)
      sqlParts.push(`CREATE TABLE IF NOT EXISTS public.${tableName} (`)
      
      const columnDefs: string[] = []
      for (const col of cols) {
        let colDef = `  ${col.column_name} `
        
        // Data type
        if (col.data_type === 'ARRAY') {
          colDef += `${col.udt_name.replace('_', '')}[]`
        } else if (col.data_type === 'USER-DEFINED') {
          colDef += col.udt_name
        } else if (col.character_maximum_length) {
          colDef += `${col.data_type}(${col.character_maximum_length})`
        } else {
          colDef += col.data_type
        }
        
        // NOT NULL
        if (col.is_nullable === 'NO') {
          colDef += ' NOT NULL'
        }
        
        // Default value
        if (col.column_default) {
          colDef += ` DEFAULT ${col.column_default}`
        }
        
        columnDefs.push(colDef)
      }

      // Add primary key constraints inline
      const tableCons = tableConstraints.get(tableName) || []
      const pkConstraints = tableCons.filter(c => c.constraint_type === 'PRIMARY KEY')
      if (pkConstraints.length > 0) {
        const pkCols = pkConstraints.map(c => c.column_name)
        columnDefs.push(`  PRIMARY KEY (${pkCols.join(', ')})`)
      }

      sqlParts.push(columnDefs.join(',\n'))
      sqlParts.push(`);\n`)
    }

    // Generate Foreign Key constraints
    sqlParts.push(`-- ============================================`)
    sqlParts.push(`-- FOREIGN KEY CONSTRAINTS`)
    sqlParts.push(`-- ============================================\n`)

    for (const con of constraints) {
      if (con.constraint_type === 'FOREIGN KEY' && con.foreign_table_name) {
        sqlParts.push(`ALTER TABLE public.${con.table_name}`)
        sqlParts.push(`  ADD CONSTRAINT ${con.constraint_name}`)
        sqlParts.push(`  FOREIGN KEY (${con.column_name})`)
        sqlParts.push(`  REFERENCES public.${con.foreign_table_name}(${con.foreign_column_name});`)
        sqlParts.push('')
      }
    }

    // Generate unique constraints
    for (const con of constraints) {
      if (con.constraint_type === 'UNIQUE') {
        sqlParts.push(`ALTER TABLE public.${con.table_name}`)
        sqlParts.push(`  ADD CONSTRAINT ${con.constraint_name} UNIQUE (${con.column_name});`)
        sqlParts.push('')
      }
    }

    // Generate Indexes
    sqlParts.push(`-- ============================================`)
    sqlParts.push(`-- INDEXES`)
    sqlParts.push(`-- ============================================\n`)

    for (const idx of indexes) {
      // Skip primary key indexes as they're created automatically
      if (!idx.indexname.endsWith('_pkey')) {
        sqlParts.push(`${idx.indexdef};`)
      }
    }
    sqlParts.push('')

    // Generate RLS Enable statements and Policies
    sqlParts.push(`-- ============================================`)
    sqlParts.push(`-- ROW LEVEL SECURITY`)
    sqlParts.push(`-- ============================================\n`)

    const tablesWithRls = new Set(policies.map(p => p.tablename))
    for (const tableName of tablesWithRls) {
      sqlParts.push(`ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;`)
    }
    sqlParts.push('')

    for (const policy of policies) {
      const permissive = policy.permissive === 'PERMISSIVE' ? '' : 'AS RESTRICTIVE '
      sqlParts.push(`CREATE POLICY "${policy.policyname}"`)
      sqlParts.push(`  ON public.${policy.tablename}`)
      sqlParts.push(`  ${permissive}FOR ${policy.cmd}`)
      if (policy.roles && policy.roles.length > 0) {
        sqlParts.push(`  TO ${policy.roles.join(', ')}`)
      }
      if (policy.qual) {
        sqlParts.push(`  USING (${policy.qual})`)
      }
      if (policy.with_check) {
        sqlParts.push(`  WITH CHECK (${policy.with_check})`)
      }
      sqlParts.push(`;`)
      sqlParts.push('')
    }

    // Generate Functions
    if (functions.length > 0) {
      sqlParts.push(`-- ============================================`)
      sqlParts.push(`-- FUNCTIONS`)
      sqlParts.push(`-- ============================================\n`)

      for (const func of functions) {
        if (func.routine_definition) {
          sqlParts.push(`-- Function: ${func.routine_name}`)
          sqlParts.push(`CREATE OR REPLACE FUNCTION public.${func.routine_name}()`)
          sqlParts.push(`RETURNS ${func.data_type}`)
          sqlParts.push(`LANGUAGE plpgsql`)
          sqlParts.push(`AS $$`)
          sqlParts.push(func.routine_definition)
          sqlParts.push(`$$;`)
          sqlParts.push('')
        }
      }
    }

    // Generate Triggers
    if (triggers.length > 0) {
      sqlParts.push(`-- ============================================`)
      sqlParts.push(`-- TRIGGERS`)
      sqlParts.push(`-- ============================================\n`)

      for (const trig of triggers) {
        sqlParts.push(`CREATE TRIGGER ${trig.trigger_name}`)
        sqlParts.push(`  ${trig.action_timing} ${trig.event_manipulation}`)
        sqlParts.push(`  ON public.${trig.event_object_table}`)
        sqlParts.push(`  FOR EACH ROW`)
        sqlParts.push(`  ${trig.action_statement};`)
        sqlParts.push('')
      }
    }

    const schemaSQL = sqlParts.join('\n')
    const fileSize = new Blob([schemaSQL]).size

    console.log(`Schema export completed: ${fileSize} bytes`)

    return new Response(
      JSON.stringify({
        success: true,
        schema: schemaSQL,
        file_size: fileSize,
        stats: {
          tables: tableColumns.size,
          columns: columns.length,
          constraints: constraints.length,
          indexes: indexes.length,
          policies: policies.length,
          functions: functions.length,
          triggers: triggers.length,
          enums: new Set(enums.map(e => e.typname)).size
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Schema export error:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
