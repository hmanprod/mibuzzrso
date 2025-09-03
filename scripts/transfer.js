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
    ssl: { rejectUnauthorized: false }, // Add SSL configuration for secure connections
    connectionTimeoutMillis: 30000, // 30 second timeout
    query_timeout: 60000, // 60 second query timeout
    statement_timeout: 60000 // 60 second statement timeout
  });
}

// Function to get all tables using direct PostgreSQL connection (for target)
async function getAllTables(pgClient) {
  const result = await pgClient.query(`
    SELECT tablename as name 
    FROM pg_tables 
    WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'information_schema%'
    ORDER BY tablename
  `);
  return result.rows;
}

// Function to get all tables using Supabase (for source)
async function getAllTablesSupabase(supabaseClient) {
  try {
    // Method 1: Try to get table names through the REST API introspection
    const response = await fetch(`${supabaseClient.supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseClient.supabaseKey,
        'Authorization': `Bearer ${supabaseClient.supabaseKey}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const tables = Object.keys(data.definitions || {})
        .filter(name => !name.startsWith('pg_') && !name.startsWith('information_schema'))
        .map(name => ({ name }));
      
      if (tables.length > 0) {
        console.log(`Found ${tables.length} tables via REST API introspection`);
        return tables;
      }
    }
  } catch (error) {
    console.log('Could not get tables via REST API introspection, trying alternative method...');
  }

  // Method 2: Try to discover tables by attempting to query common table names
  console.log('Attempting to discover tables by querying common names...');
  const commonTables = [
    'users', 'profiles', 'posts', 'comments', 'categories', 'tags', 
    'orders', 'products', 'customers', 'invoices', 'payments',
    'projects', 'tasks', 'teams', 'organizations', 'roles',
    'permissions', 'notifications', 'settings', 'logs', 'events',
    'sessions', 'tokens', 'files', 'uploads', 'messages'
  ];

  const existingTables = [];
  
  for (const tableName of commonTables) {
    try {
      const { data, error } = await supabaseClient
        .from(tableName)
        .select('*')
        .limit(0); // Just check if table exists
      
      if (!error) {
        existingTables.push({ name: tableName });
        console.log(`✓ Found table: ${tableName}`);
      }
    } catch (e) {
      // Table doesn't exist, continue
    }
  }

  if (existingTables.length === 0) {
    // Method 3: Manual input fallback
    console.log('\n⚠️  Could not auto-discover tables.');
    console.log('Please provide your table names manually by modifying the script.');
    console.log('Add your table names to the array below and rerun:');
    console.log('const yourTables = ["table1", "table2", "table3"];');
    
    // You can manually specify your tables here:
    const manualTables = [
      // Add your table names here, for example:
      // 'your_table_1',
      // 'your_table_2'
    ];
    
    if (manualTables.length > 0) {
      return manualTables.map(name => ({ name }));
    }
    
    throw new Error('Could not discover any tables. Please check your Supabase connection and permissions, or manually specify table names in the script.');
  }

  console.log(`Found ${existingTables.length} tables total`);
  return existingTables;
}

// Function to get table columns using direct PostgreSQL connection (for target)
async function getTableColumns(pgClient, tableName) {
  const result = await pgClient.query(`
    SELECT 
      column_name,
      data_type,
      character_maximum_length,
      is_nullable,
      column_default,
      ordinal_position
    FROM information_schema.columns
    WHERE table_name = $1
    AND table_schema = 'public'
    ORDER BY ordinal_position
  `, [tableName]);
  return result.rows;
}
async function getTableColumnsSupabase(supabaseClient, tableName) {
  // First try to get a sample row to determine column structure
  try {
    const { data, error } = await supabaseClient
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      // Use the first row to determine column structure
      const sampleRow = data[0];
      const columns = Object.keys(sampleRow).map((columnName, index) => {
        const value = sampleRow[columnName];
        let dataType = 'text'; // default
        
        // Try to infer data type from the value
        if (value === null || value === undefined) {
          dataType = 'text';
        } else if (typeof value === 'boolean') {
          dataType = 'boolean';
        } else if (typeof value === 'number') {
          dataType = Number.isInteger(value) ? 'integer' : 'numeric';
        } else if (typeof value === 'string') {
          // Check if it looks like a timestamp
          if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
            dataType = 'timestamp with time zone';
          } else if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dataType = 'date';
          } else if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            dataType = 'uuid';
          } else {
            dataType = 'text';
          }
        }
        
        return {
          column_name: columnName,
          data_type: dataType,
          character_maximum_length: null,
          is_nullable: 'YES',
          column_default: null,
          ordinal_position: index + 1
        };
      });
      
      return columns;
    } else {
      // Empty table, try to get structure another way
      throw new Error('Table is empty, cannot infer structure');
    }
  } catch (error) {
    // Fallback: create basic structure
    console.warn(`Could not determine column structure for ${tableName}, using fallback approach`);
    return [
      {
        column_name: 'id',
        data_type: 'uuid',
        character_maximum_length: null,
        is_nullable: 'NO',
        column_default: null,
        ordinal_position: 1
      },
      {
        column_name: 'created_at',
        data_type: 'timestamp with time zone',
        character_maximum_length: null,
        is_nullable: 'YES',
        column_default: 'now()',
        ordinal_position: 2
      }
    ];
  }
}

// Enhanced schema migration using Supabase for source and PostgreSQL for target
async function migrateSchema(supabaseOld, pgNew) {
  try {
    const tables = await getAllTablesSupabase(supabaseOld);
    console.log(`Found ${tables.length} tables to migrate`);

    for (const table of tables) {
      console.log(`Migrating table schema: ${table.name}`);

      try {
        // Get table structure from Supabase
        const columns = await getTableColumnsSupabase(supabaseOld, table.name);

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

// Enhanced data migration using Supabase for source and PostgreSQL for target
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

        if (countError) {
          console.error(`Could not get count for ${table.name}:`, countError.message);
          continue;
        }

        const totalRows = count || 0;

        if (totalRows === 0) {
          console.log(`No data to migrate for ${table.name}`);
          continue;
        }

        console.log(`${totalRows} rows to migrate for ${table.name}`);

        // Get column structure
        const columns = await getTableColumnsSupabase(supabaseOld, table.name);
        const columnNames = columns.map(col => `"${col.column_name}"`);
        const selectColumns = columnNames.join(', ');
        const placeholders = columnNames.map((_, index) => `${index + 1}`).join(', ');

        // Disable triggers and constraints temporarily for faster insertion
        try {
          await pgNew.query(`ALTER TABLE "${table.name}" DISABLE TRIGGER ALL`);
        } catch (triggerError) {
          console.warn(`Could not disable triggers for ${table.name}:`, triggerError.message);
        }

        // Migrate in batches using Supabase pagination
        let from = 0;
        
        while (from < totalRows) {
          const { data: rows, error: dataError } = await supabaseOld
            .from(table.name)
            .select('*')
            .range(from, from + batchSize - 1);

          if (dataError) {
            console.error(`Error fetching data for ${table.name}:`, dataError.message);
            break;
          }
          
          if (!rows || rows.length === 0) break;

          // Prepare batch insert
          const values = [];
          const insertValues = [];
          let paramCount = 0;

          for (const row of rows) {
            const rowValues = columnNames.map(col => {
              paramCount++;
              const value = row[col.replace(/"/g, '')];
              insertValues.push(value);
              return `${paramCount}`;
            });
            values.push(`(${rowValues.join(', ')})`);
          }

          try {
            // Use a single INSERT statement for the entire batch
            await pgNew.query(`
              INSERT INTO "${table.name}" (${selectColumns}) 
              VALUES ${values.join(', ')}
              ON CONFLICT DO NOTHING
            `, insertValues);
          } catch (insertError) {
            console.error(`Error inserting batch for ${table.name}:`, insertError.message);
            
            // Fallback: insert rows one by one to identify problematic rows
            for (let i = 0; i < rows.length; i++) {
              try {
                const row = rows[i];
                const rowValues = columnNames.map(col => row[col.replace(/"/g, '')]);
                await pgNew.query(`
                  INSERT INTO "${table.name}" (${selectColumns}) 
                  VALUES (${placeholders})
                  ON CONFLICT DO NOTHING
                `, rowValues);
              } catch (singleInsertError) {
                console.error(`Error inserting single row in ${table.name} at position ${i}:`, singleInsertError.message);
              }
            }
          }

          from += batchSize;
          console.log(`Migrated ${Math.min(from, totalRows)}/${totalRows} rows for ${table.name}`);
        }

        // Re-enable triggers and constraints
        try {
          await pgNew.query(`ALTER TABLE "${table.name}" ENABLE TRIGGER ALL`);
        } catch (enableError) {
          console.warn(`Could not re-enable triggers for ${table.name}:`, enableError.message);
        }

        console.log(`✓ Data migration completed for ${table.name}`);

      } catch (tableError) {
        console.error(`Error migrating data for table ${table.name}:`, tableError.message);
        // Re-enable triggers in case of error
        try {
          await pgNew.query(`ALTER TABLE "${table.name}" ENABLE TRIGGER ALL`);
        } catch (enableError) {
          console.error(`Could not re-enable triggers for ${table.name}:`, enableError.message);
        }
      }
    }
  } catch (error) {
    console.error('Error during data migration:', error);
    throw error;
  }
}

// Note: Functions, views, triggers, and policies migration is only available with direct PostgreSQL access
// Since we're using Supabase client for source, this step will be skipped
async function migrateFunctionsViewsTriggersPolicies(supabaseOld, pgNew) {
  console.log('⚠️  Functions, views, triggers, and policies migration skipped.');
  console.log('   This requires direct PostgreSQL access to the source database.');
  console.log('   If needed, please migrate these manually or provide a direct PostgreSQL connection.');
  return;

async function runMigration() {
  console.log('🚀 Starting Supabase migration...');

  let pgNew;

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
    
    // Create Supabase client for source
    const supabaseOld = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Create direct PostgreSQL connection for target
    pgNew = createPgClient(process.env.NEW_POSTGRES_URI);

    console.log('🔌 Connecting to target database...');
    await pgNew.connect();

    // Test connections
    console.log('🧪 Testing connections...');
    
    // Test Supabase connection with a simple operation
    try {
      // Try to call a simple function or get service info
      const { data: authData, error: authError } = await supabaseOld.auth.getSession();
      console.log('✓ Source Supabase client configured');
    } catch (supabaseError) {
      console.log('⚠️  Could not test auth, but Supabase client is configured');
    }
    
    const testQueryNew = await pgNew.query('SELECT version()');
    console.log('✓ Target database connected');

    // Step 1: Migrate schema
    console.log('\n📋 Step 1: Migrating schema...');
    await migrateSchema(supabaseOld, pgNew);

    // Step 2: Migrate data
    console.log('\n📦 Step 2: Migrating data...');
    await migrateData(supabaseOld, pgNew);

    // Step 3: Note about functions, views, triggers, policies
    console.log('\n🔧 Step 3: Functions, views, triggers, and policies...');
    await migrateFunctionsViewsTriggersPolicies(supabaseOld, pgNew);



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
    // Close connections
    if (pgNew) {
      try {
        await pgNew.end();
        console.log('✓ Target database connection closed');
      } catch (e) {
        console.error('Error closing target connection:', e.message);
      }
    }
    
    // Note: Supabase client doesn't need explicit closing
    console.log('✓ Supabase client connection completed');
  }
}

// Run the migration
runMigration();

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
    // Close connections
    if (pgNew) {
      try {
        await pgNew.end();
        console.log('✓ Target database connection closed');
      } catch (e) {
        console.error('Error closing target connection:', e.message);
      }
    }
    
    // Note: Supabase client doesn't need explicit closing
    console.log('✓ Supabase client connection completed');
  }
}

// Run the migration
runMigration();