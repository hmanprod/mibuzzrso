require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

async function executeBackup() {
  console.log('Backup des fonctions, contraintes et types...');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const backupDir = path.join(__dirname, '../supabase/backup');
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `schema-backup-${timestamp}.sql`);
    
    let backupContent = '';
    backupContent += `-- Schema Backup: Functions, Constraints, Types\n`;
    backupContent += `-- Generated: ${new Date().toISOString()}\n\n`;

    // 1. Backup Functions using proper helper function
    console.log('Sauvegarde des fonctions...');
    try {
      const { data: functions, error: funcError } = await supabase.rpc('get_functions');
      
      if (funcError) throw funcError;
      
      if (functions?.length > 0) {
        console.log(`${functions.length} fonctions trouvées`);
        backupContent += `-- Functions\n`;
        for (const func of functions) {
          backupContent += `-- Schema: ${func.schema_name}, Function: ${func.function_name}\n`;
          backupContent += `${func.function_definition}\n\n`;
        }
      } else {
        console.log('Aucune fonction personnalisée trouvée');
        backupContent += `-- No custom functions found\n\n`;
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération des fonctions:', error.message);
      backupContent += `-- Functions: Error - ${error.message}\n\n`;
    }

    // 2. Backup Constraints
    console.log('Sauvegarde des contraintes...');
    try {
      const { data: constraints } = await supabase.rpc('get_constraints');
      
      if (constraints?.length > 0) {
        console.log(`${constraints.length} contraintes trouvées`);
        backupContent += `-- Constraints\n`;
        for (const constraint of constraints) {
          backupContent += `ALTER TABLE ${constraint.table_name} ADD ${constraint.constraint_definition};\n`;
        }
        backupContent += '\n';
      }
    } catch (error) {
      console.warn('Contraintes non disponibles:', error.message);
      backupContent += `-- Constraints: Error - ${error.message}\n\n`;
    }

    // 3. Backup Types (ENUMs)
    console.log('Sauvegarde des types...');
    try {
      // Simple query to get enum types
      const { data: types } = await supabase
        .from('pg_type')
        .select('typname')
        .eq('typcategory', 'E')
        .not('typname', 'like', '_%');
      
      if (types?.length > 0) {
        console.log(`${types.length} types trouvés`);
        backupContent += `-- Custom Types (ENUMs)\n`;
        for (const type of types) {
          try {
            const { data: enumValues } = await supabase.rpc('get_enum_values', { 
              enum_name: type.typname 
            });
            if (enumValues) {
              backupContent += `CREATE TYPE ${type.typname} AS ENUM (${enumValues.map(v => `'${v}'`).join(', ')});\n`;
            }
          } catch (enumError) {
            backupContent += `-- Type ${type.typname}: Error getting values\n`;
          }
        }
        backupContent += '\n';
      }
    } catch (error) {
      console.warn('Types non disponibles:', error.message);
      backupContent += `-- Types: Error - ${error.message}\n\n`;
    }

    // Write backup file
    await fs.writeFile(backupPath, backupContent, 'utf8');
    
    const stats = await fs.stat(backupPath);
    console.log(`✅ Backup créé: ${backupPath}`);
    console.log(`📊 Taille: ${(stats.size / 1024).toFixed(2)} KB`);

  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  }
}

executeBackup();