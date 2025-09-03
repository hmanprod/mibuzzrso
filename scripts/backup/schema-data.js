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

    // Obtenir la liste des tables via helper function
    console.log('Récupération de la liste des tables...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_all_tables');

    if (tablesError) {
      console.error('Erreur RPC get_all_tables:', tablesError.message);
      console.error('Assurez-vous que les fonctions helper sont créées dans Supabase');
      throw new Error('Impossible de récupérer la liste des tables. Les fonctions helper doivent être créées.');
    }

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
        let columns;
        const { data: rpcColumns, error: columnsError } = await supabase
          .rpc('get_table_structure', { table_name: table.name });

        if (columnsError) {
          console.error(`Erreur RPC get_table_structure pour ${table.name}:`, columnsError.message);
          console.error('Assurez-vous que les fonctions helper sont créées dans Supabase');
          continue;
        } else {
          columns = rpcColumns;
        }

        schemaContent += `DROP TABLE IF EXISTS ${table.name} CASCADE;\n`;
        schemaContent += `-- Table: ${table.name}\n`;
        schemaContent += `CREATE TABLE ${table.name} (\n`;
        schemaContent += columns.map(col => {
          let type = col.data_type;
          // Fix USER-DEFINED types
          if (type === 'USER-DEFINED') {
            // Try to get the actual type from the column name or use a default
            if (col.column_name.includes('type') || col.column_name.includes('status')) {
              type = 'text';
            } else {
              type = 'text';
            }
          }
          return `  ${col.column_name} ${type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`;
        }).join(',\n');
        schemaContent += '\n);\n\n';

        // Données de la table
        console.log(`Récupération des données pour ${table.name}...`);
        const { data: dataRows, error: dataError } = await supabase
          .from(table.name)
          .select('*');

        if (dataError) {
          console.error(`Erreur lors de la récupération des données pour ${table.name}:`, dataError);
          continue;
        }

        if (dataRows && dataRows.length > 0) {
          console.log(`${dataRows.length} lignes trouvées pour ${table.name}`);
          dataContent += `-- Données pour la table: ${table.name}\n`;

          // Get column information to handle data types properly
          let columnInfo;
          const { data: rpcColInfo, error: colError } = await supabase
            .rpc('get_table_structure', { table_name: table.name });

          if (colError) {
            // Use the columns we already have from schema export
            columnInfo = columns;
          } else {
            columnInfo = rpcColInfo;
          }

          const dataColumns = Object.keys(dataRows[0]);
          const columnTypes = {};
          if (columnInfo) {
            columnInfo.forEach(col => {
              columnTypes[col.column_name] = col.data_type;
            });
          }

          for (const row of dataRows) {
            const values = dataColumns.map(col => {
              const val = row[col];
              const colType = columnTypes[col];

              if (val === null) return 'NULL';

              // Handle different data types
              if (colType && colType.includes('json')) {
                return val ? `'${JSON.stringify(val).replace(/'/g, "''")}'` : 'NULL';
              }

              if (typeof val === 'string') {
                // Handle empty strings and escape single quotes
                return val === '' ? "''" : `'${val.replace(/'/g, "''")}'`;
              }

              if (typeof val === 'boolean') {
                return val ? 'true' : 'false';
              }

              if (typeof val === 'object' && val instanceof Date) {
                return `'${val.toISOString()}'`;
              }

              if (typeof val === 'object') {
                // Handle arrays and other objects
                return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
              }

              // Numbers and other types
              return val;
            });

            dataContent += `INSERT INTO ${table.name} (${dataColumns.join(', ')}) VALUES (${values.join(', ')});\n`;
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
