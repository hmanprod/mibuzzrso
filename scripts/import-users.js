require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

async function importUsers() {
  // Utiliser les nouvelles credentials pour la destination
  const supabase = createClient(
    process.env.NEW_SUPABASE_URL,
    process.env.NEW_SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false
      }
    }
  );

  try {
    console.log('Début de l\'import des utilisateurs...');

    // Lire le fichier users.json
    const usersFilePath = path.join(__dirname, '../supabase/backup/users.json');
    const usersData = await fs.readFile(usersFilePath, 'utf8');
    const usersJson = JSON.parse(usersData);

    // Extraire le tableau d'utilisateurs
    const users = usersJson[0].ufn_export_users_json;

    console.log(`Nombre d'utilisateurs à importer: ${users.length}`);

    let successCount = 0;
    let errorCount = 0;

    // Importer chaque utilisateur
    for (const user of users) {
      try {
        console.log(`Import de l'utilisateur: ${user.email}`);

        // Créer l'utilisateur avec l'API admin (sans mot de passe pour l'instant)
        const { data: userData, error: createError } = await supabase.auth.admin.createUser({
          email: user.email,
          email_confirm: user.email_confirmed_at !== null,
          user_metadata: user.raw_user_meta_data,
          app_metadata: user.raw_app_meta_data,
          // Essayer de conserver l'ID original
          ...(user.id && { uid: user.id })
        });

        if (createError) {
          console.error(`Erreur lors de la création de ${user.email}:`, createError.message);
          errorCount++;
          continue;
        }

        // Mettre à jour le mot de passe hashé directement en SQL
        if (userData?.user?.id) {
          const updatePasswordSql = `
            UPDATE auth.users
            SET
              encrypted_password = '${user.encrypted_password}',
              created_at = '${user.created_at}',
              updated_at = '${user.updated_at}',
              phone = ${user.phone ? `'${user.phone}'` : 'NULL'},
              phone_confirmed_at = ${user.phone_confirmed_at ? `'${user.phone_confirmed_at}'` : 'NULL'}
            WHERE id = '${userData.user.id}';
          `;

          // Essayer d'utiliser exec_sql si disponible, sinon utiliser une approche alternative
          try {
            const { error: updateError } = await supabase.rpc('exec_sql', {
              sql_statement: updatePasswordSql
            });

            if (updateError) {
              console.warn(`⚠ Impossible de mettre à jour le mot de passe pour ${user.email} via RPC:`, updateError.message);
              console.log(`✓ Utilisateur ${user.email} créé (mot de passe devra être mis à jour manuellement)`);
            } else {
              console.log(`✓ Utilisateur ${user.email} importé avec succès (avec mot de passe)`);
            }
          } catch (rpcError) {
            console.warn(`⚠ RPC exec_sql non disponible pour ${user.email}:`, rpcError.message);
            console.log(`✓ Utilisateur ${user.email} créé (mot de passe devra être mis à jour manuellement)`);
          }
        }

        successCount++;

        // Petite pause pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (err) {
        console.error(`Erreur lors de l'import de ${user.email}:`, err.message);
        errorCount++;
      }
    }

    console.log('\nRésumé de l\'import:');
    console.log(`✓ Utilisateurs créés: ${successCount}`);
    console.log(`✗ Erreurs: ${errorCount}`);

    if (errorCount === 0) {
      console.log('Tous les utilisateurs ont été importés avec succès !');
    } else {
      console.log('Certains utilisateurs n\'ont pas pu être importés. Vérifiez les logs ci-dessus.');
      console.log('\nNote: Si les mots de passe n\'ont pas pu être mis à jour automatiquement,');
      console.log('vous devrez les mettre à jour manuellement dans la base de données.');
    }

  } catch (err) {
    console.error('Erreur lors de l\'import:', err);
    process.exit(1);
  }
}

importUsers();
