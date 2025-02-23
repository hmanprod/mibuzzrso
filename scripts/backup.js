require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

async function executeBackup() {
  console.log('Démarrage du backup...');
  
  try {
    console.log('Configuration de la connexion Supabase...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Test de connexion...');
    
    // Test de connexion avec timeout
    const timeout = setTimeout(() => {
      console.error('Timeout de connexion après 60 secondes');
      process.exit(1);
    }, 60000);

    try {
      // Test de connexion en utilisant une requête système
      const { data, error } = await supabase
        .rpc('version');
      
      if (error) throw error;
      
      clearTimeout(timeout);
      console.log('Connexion réussie !');
    } catch (connError) {
      clearTimeout(timeout);
      throw connError;
    }

    // Créer le dossier de backup s'il n'existe pas
    const backupDir = path.join(__dirname, '../supabase/backup');
    await fs.mkdir(backupDir, { recursive: true });

    // Obtenir la liste des tables via pg_catalog
    console.log('Récupération de la liste des tables...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_all_tables');

    if (tablesError) throw tablesError;
    
    console.log(`${tables.length} tables trouvées`);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const schemaFileName = `schema-${timestamp}.sql`;
    const dataFileName = `data-${timestamp}.sql`;
    const schemaPath = path.join(backupDir, schemaFileName);
    const dataPath = path.join(backupDir, dataFileName);
    
    let schemaContent = '';
    let dataContent = '';

    // Pour chaque table, exporter la structure et les données
    for (const table of tables) {
      console.log(`Sauvegarde de la table: ${table.name}`);
      
      try {
        // Structure de la table
        const { data: columns, error: columnsError } = await supabase
          .rpc('get_table_columns', { p_table_name: table.name });
        
        if (columnsError) throw columnsError;

        schemaContent += `-- Table: ${table.name}\n`;
        schemaContent += `CREATE TABLE ${table.name} (\n`;
        schemaContent += columns.map(col => 
          `  ${col.column_name} ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`
        ).join(',\n');
        schemaContent += '\n);\n\n';

        // Données de la table
        console.log(`Récupération des données pour ${table.name}...`);
        const { data: dataRows, error: dataError } = await supabase
          .from(table.name)
          .select('*');
        
        if (dataError) throw dataError;
        
        if (dataRows.length > 0) {
          console.log(`${dataRows.length} lignes trouvées pour ${table.name}`);
          dataContent += `-- Données pour la table: ${table.name}\n`;
          const columns = Object.keys(dataRows[0]);
          for (const row of dataRows) {
            const values = columns.map(col => {
              const val = row[col];
              return val === null ? 'NULL' : 
                typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val;
            });
            dataContent += `INSERT INTO ${table.name} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
          }
          dataContent += '\n';
        } else {
          console.log(`Aucune donnée trouvée pour ${table.name}`);
        }
      } catch (tableError) {
        console.error(`Erreur lors du traitement de la table ${table.name}:`, tableError);
      }
    }

    // Écrire les fichiers de backup
    await fs.writeFile(schemaPath, schemaContent, 'utf8');
    await fs.writeFile(dataPath, dataContent, 'utf8');
    console.log(`Backup du schéma créé avec succès: ${schemaPath}`);
    console.log(`Backup des données créé avec succès: ${dataPath}`);

  } catch (err) {
    console.error('Erreur détaillée lors du backup:');
    console.error('Type d\'erreur:', err.constructor.name);
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    console.error('Stack:', err.stack);
    
    if (err.errors) {
      console.error('Erreurs sous-jacentes:');
      err.errors.forEach((e, i) => {
        console.error(`  ${i + 1}. ${e.message} (${e.code})`);
        if (e.stack) console.error(`     Stack: ${e.stack}`);
      });
    }
    
    if (err.cause) {
      console.error('Cause:', err.cause);
    }
    
    process.exit(1);
  }
}

executeBackup();
