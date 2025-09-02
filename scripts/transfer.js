require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

// Simplified function to create a pg client using direct URI
function createPgClient(postgresUri) {
  if (!postgresUri) {
    throw new Error('PostgreSQL URI is required');
  }

  return new Client({ 
    connectionString: postgresUri,
    ssl: { rejectUnauthorized: false } // Add SSL configuration for secure connections
  });
}

// Function to get all tables using Supabase client
async function getAllTablesSupabase(supabaseClient) {
  const { data, error } = await supabaseClient
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_type', 'BASE TABLE')
    .not('table_name', 'like', 'pg_%');

  if (error) throw error;
  return data.map(row => ({ name: row.table_name }));
}

// Enhanced schema migration using Supabase client for source
async function migrateSchema(supabaseOld, pgNew) {
  try {
    const tables = await getAllTablesSupabase(supabaseOld);
    console.log(`${tables.length} tables to migrate`);

    for (const table of tables) {
      console.log(`Migrating table: ${table.name}`);

      try {
        // Get table structure using Supabase
        const { data: columns, error: columnsError } = await supabaseOld
          .from('information_schema.columns')
          .select(`
            column_name,
            data_type,
            character_maximum_length,
            is_nullable,
            column_default,
            ordinal_position
          `)
          .eq('table_name', table.name)
          .eq('table_schema', 'public')
          .order('ordinal_position');

        if (columnsError) throw columnsError;

        if (columns.length === 0) {
          console.log(`No columns found for table ${table.name}, skipping...`);
          continue;
        }

        // Build CREATE TABLE statement
        let createTableSQL = `CREATE TABLE IF NOT EXISTS "${table.name}" (\n`;
        const columnDefs = columns.map(col => {
          let colDef = `  "${col.column_name}" ${col.data_type}`;
          
          if (col.character_maximum_length && col.data_type === 'character varying') {
            colDef += `(${col.character_maximum_length})`;
          }
          
          if (col.is_nullable === 'NO') {
            colDef += ' NOT NULL';
          }
          
          if (col.column_default && col.column_default !== 'NULL') {
            colDef += ` DEFAULT ${col.column_default}`;
          }
          
          return colDef;
        });

        createTableSQL += columnDefs.join(',\n');
        createTableSQL += '\n);';

        // Execute table creation on target
        await pgNew.query(createTableSQL);
        console.log(`✓ Table ${table.name} created successfully`);

      } catch (tableError) {
        console.error(`Error migrating table ${table.name}:`, tableError.message);
        // Continue with next table instead of stopping
      }
    }

  } catch (error) {
    console.error('Error during schema migration:', error);
    throw error;
  }
}

// Enhanced data migration using Supabase client for source
async function migrateData(supabaseOld, pgNew, batchSize = 1000) {
  try {
    const tables = await getAllTablesSupabase(supabaseOld);

    for (const table of tables) {
      console.log(`Migrating data for table: ${table.name}`);

      try {
        // Get total count using Supabase
        const { count, error: countError } = await supabaseOld
          .from(table.name)
          .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        const totalRows = count || 0;

        if (totalRows === 0) {
          console.log(`No data to migrate for ${table.name}`);
          continue;
        }

        console.log(`${totalRows} rows to migrate for ${table.name}`);

        // Get column names using Supabase
        const { data: columnsData, error: columnsError } = await supabaseOld
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', table.name)
          .eq('table_schema', 'public')
          .order('ordinal_position');

        if (columnsError) throw columnsError;

        const columnNames = columnsData.map(col => `"${col.column_name}"`);
        const selectColumns = columnNames.join(', ');
        const placeholders = columnNames.map((_, index) => `${index + 1}`).join(', ');

        // Migrate in batches using Supabase pagination
        let from = 0;
        
        while (from < totalRows) {
          const { data: rows, error: dataError } = await supabaseOld
            .from(table.name)
            .select('*')
            .range(from, from + batchSize - 1);

          if (dataError) throw dataError;
          if (!rows || rows.length === 0) break;

          // Insert batch into target database
          for (const row of rows) {
            const values = columnNames.map(col => row[col.replace(/"/g, '')]);
            try {
              await pgNew.query(`
                INSERT INTO "${table.name}" (${selectColumns}) 
                VALUES (${placeholders})
                ON CONFLICT DO NOTHING
              `, values);
            } catch (insertError) {
              console.error(`Error inserting row in ${table.name}:`, insertError.message);
              console.error('Row data:', values.slice(0, 3)); // Show first 3 values only
            }
          }

          from += batchSize;
          console.log(`Migrated ${Math.min(from, totalRows)}/${totalRows} rows for ${table.name}`);
        }

        console.log(`✓ Data migration completed for ${table.name}`);

      } catch (tableError) {
        console.error(`Error migrating data for table ${table.name}:`, tableError.message);
      }
    }
  } catch (error) {
    console.error('Error during data migration:', error);
    throw error;
  }
}

// Enhanced functions, triggers, and policies migration
async function migrateFunctionsViewsTriggersPolicies(pgOld, pgNew) {
  try {
    // Migrate functions
    console.log('Migrating functions...');
    const functionsResult = await pgOld.query(`
      SELECT 
        proname,
        pg_get_function_identity_arguments(oid) as args,
        pg_get_functiondef(oid) as definition
      FROM pg_proc 
      WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND prokind = 'f'
    `);

    for (const func of functionsResult.rows) {
      try {
        await pgNew.query(func.definition);
        console.log(`✓ Function ${func.proname} created successfully`);
      } catch (error) {
        console.error(`Error creating function ${func.proname}:`, error.message);
      }
    }

    // Migrate triggers
    console.log('Migrating triggers...');
    const triggersResult = await pgOld.query(`
      SELECT 
        tgname,
        pg_get_triggerdef(oid) as definition
      FROM pg_trigger 
      WHERE tgisinternal = false
      AND tgrelid IN (
        SELECT oid FROM pg_class 
        WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      )
    `);

    for (const trigger of triggersResult.rows) {
      try {
        await pgNew.query(trigger.definition);
        console.log(`✓ Trigger ${trigger.tgname} created successfully`);
      } catch (error) {
        console.error(`Error creating trigger ${trigger.tgname}:`, error.message);
      }
    }

    // Enable RLS on tables first
    const tables = await getAllTables(pgNew);
    for (const table of tables) {
      try {
        await pgNew.query(`ALTER TABLE "${table.name}" ENABLE ROW LEVEL SECURITY`);
      } catch (error) {
        // RLS might already be enabled
      }
    }

    // Migrate RLS policies
    console.log('Migrating RLS policies...');
    const policiesResult = await pgOld.query(`
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
    `);

    for (const policy of policiesResult.rows) {
      try {
        let policySQL = `CREATE POLICY "${policy.policyname}" ON "${policy.tablename}"`;
        
        if (policy.permissive === 'RESTRICTIVE') {
          policySQL = policySQL.replace('CREATE POLICY', 'CREATE POLICY');
          policySQL += ' AS RESTRICTIVE';
        }
        
        if (policy.cmd && policy.cmd !== 'ALL') {
          policySQL += ` FOR ${policy.cmd}`;
        }
        
        if (policy.roles && policy.roles.length > 0) {
          policySQL += ` TO ${policy.roles.join(', ')}`;
        }
        
        if (policy.qual) {
          policySQL += ` USING (${policy.qual})`;
        }
        
        if (policy.with_check) {
          policySQL += ` WITH CHECK (${policy.with_check})`;
        }

        await pgNew.query(policySQL);
        console.log(`✓ Policy ${policy.policyname} created successfully`);
      } catch (error) {
        console.error(`Error creating policy ${policy.policyname}:`, error.message);
      }
    }

  } catch (error) {
    console.error('Error migrating functions, views, triggers, policies:', error);
    throw error;
  }
}

async function runMigration() {
  console.log('🚀 Starting Supabase migration...');

  let pgOld, pgNew;

  try {
    // Validate environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY', 
      'NEW_POSTGRES_URI'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    console.log('📝 Configuring connections...');
    
    // Create Supabase client for source (self-hosted)
    const supabaseOld = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Create pg client for target using direct URI
    pgNew = createPgClient(process.env.NEW_POSTGRES_URI);

    console.log('🔌 Connecting to target database...');
    await pgNew.connect();

    // Test connections
    console.log('🧪 Testing connections...');
    
    // Test Supabase connection
    const { data: testOld, error: errorOld } = await supabaseOld
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    if (errorOld) {
      console.error('Supabase connection test failed:', errorOld);
      throw errorOld;
    }
    console.log('✓ Source Supabase connected');
    
    const testQueryNew = await pgNew.query('SELECT version()');
    console.log('✓ Target database connected');

    // Step 1: Migrate schema
    console.log('\n📋 Step 1: Migrating schema...');
    await migrateSchema(supabaseOld, pgNew);

    // Step 2: Migrate data
    console.log('\n📦 Step 2: Migrating data...');
    await migrateData(supabaseOld, pgNew);

    console.log('\n🎉 Migration completed successfully!');

  } catch (err) {
    console.error('\n❌ Migration failed:');
    console.error('Error type:', err.constructor.name);
    console.error('Message:', err.message);
    
    if (err.code) {
      console.error('Code:', err.code);
    }
    
    if (err.stack) {
      console.error('Stack trace:', err.stack);
    }

    process.exit(1);
  } finally {
    // Close pg connection
    if (pgNew) {
      try {
        await pgNew.end();
        console.log('✓ Target database connection closed');
      } catch (e) {
        console.error('Error closing target connection:', e.message);
      }
    }
  }
}

// Run the migration
runMigration();