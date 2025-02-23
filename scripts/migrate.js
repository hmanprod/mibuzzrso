require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

async function executeMigration() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false
      }
    }
  );
  
  try {
    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../supabase/migrations');
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files.filter(f => f.endsWith('.sql')).sort();

    // Get already executed migrations
    const { data: result, error } = await supabase
      .from('_migrations')
      .select('name');
      
    if (error) throw error;
    
    const executedMigrations = new Set(result.map(r => r.name));

    // Execute each migration file that hasn't been run yet
    for (const file of migrationFiles) {
      const migrationName = path.basename(file, '.sql');
      
      if (executedMigrations.has(migrationName)) {
        console.log(`Migration ${migrationName} déjà exécutée, on passe`);
        continue;
      }

      console.log(`Exécution de la migration: ${migrationName}`);
      const migrationPath = path.join(migrationsDir, file);
      const sqlContent = await fs.readFile(migrationPath, 'utf8');
      
      // Split the SQL content into individual statements
      const statements = sqlContent.split(';').filter(stmt => stmt.trim());
      
      // Execute each statement
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabase.rpc('exec_sql', {
            sql_statement: statement
          });
          
          if (stmtError) throw stmtError;
        }
      }
      
      // Record the migration
      const { error: insertError } = await supabase
        .from('_migrations')
        .insert([
          { name: migrationName, executed_at: new Date().toISOString() }
        ]);
        
      if (insertError) throw insertError;
      
      console.log(`Migration ${migrationName} exécutée avec succès`);
    }
    
    console.log('Toutes les migrations sont terminées');
  } catch (err) {
    console.error('La migration a échoué:', err);
    process.exit(1);
  }
}

executeMigration();
