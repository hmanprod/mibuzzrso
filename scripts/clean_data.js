/**
 * Script de nettoyage des données pour MiBuzz
 * 
 * Ce script nettoie toutes les tables dans le bon ordre pour respecter les contraintes FK :
 * 1. interactions
 * 2. daily_comments
 * 3. comments
 * 4. unique_likes
 * 5. daily_media_uploads
 * 6. post_medias
 * 7. posts
 * 8. medias
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// Initialiser le client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or service role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Nettoie toutes les tables dans le bon ordre
 */
async function cleanExistingData() {
  console.log('Nettoyage des données existantes...');
  
  try {
    // 1. Supprimer les interactions (likes, comments, etc.)
    await supabase.rpc('delete_all_interactions');
    console.log('✓ Table interactions nettoyée');
    
    // 2. Supprimer les daily_comments
    await supabase.rpc('delete_all_daily_comments');
    console.log('✓ Table daily_comments nettoyée');
    
    // 3. Supprimer les commentaires
    await supabase.rpc('delete_all_comments');
    console.log('✓ Table comments nettoyée');
    
    // 4. Supprimer les unique_likes
    await supabase.rpc('delete_all_unique_likes');
    console.log('✓ Table unique_likes nettoyée');
    
    // 5. Supprimer les daily_media_uploads
    await supabase.rpc('delete_all_daily_media_uploads');
    console.log('✓ Table daily_media_uploads nettoyée');
    
    // 6. Supprimer les liens posts-médias
    await supabase.rpc('delete_all_post_medias');
    console.log('✓ Table post_medias nettoyée');
    
    // 7. Supprimer les posts
    await supabase.rpc('delete_all_posts');
    console.log('✓ Table posts nettoyée');
    
    // 8. Supprimer les médias
    await supabase.rpc('delete_all_medias');
    console.log('✓ Table medias nettoyée');
    
    // 9. Rafraîchir les classements
    await supabase.rpc('refresh_weekly_rankings');
    
    console.log('✓ Toutes les tables ont été nettoyées');
  } catch (error) {
    console.error('Erreur pendant le nettoyage:', error);
    throw error;
  }
}

// Exécuter le script
cleanExistingData()
  .then(() => {
    console.log('Nettoyage terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur non gérée:', error);
    process.exit(1);
  });
