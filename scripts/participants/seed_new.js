/**
 * Script de seed amélioré pour MiBuzz
 * 
 * Ce script:
 * 1. Nettoie toutes les tables existantes dans le bon ordre (respect des contraintes FK)
 * 2. Récupère les participations au challenge
 * 3. Crée les posts de type 'challenge_participation' avec challenge_id
 * 4. Crée les médias avec durée depuis Cloudinary
 * 5. Lie les posts et médias
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;

// Charger les variables d'environnement
dotenv.config();

// Initialiser le client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or service role key');
  process.exit(1);
}

// Initialiser Cloudinary
const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const cloudinaryApiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
const cloudinaryApiSecret = process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET;

if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
  console.error('Missing Cloudinary configuration');
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudinaryCloudName,
  api_key: cloudinaryApiKey,
  api_secret: cloudinaryApiSecret,
  secure: true
});

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Nettoie toutes les tables dans le bon ordre
 */
async function cleanExistingData() {
  console.log('Nettoyage des données existantes...');
  
  try {
    // 1. Supprimer les interactions (likes, comments, etc.)
    await supabase.from('interactions').delete().neq('id', null);
    console.log('✓ Table interactions nettoyée');
    
    // 2. Supprimer les daily_comments
    await supabase.from('daily_comments').delete().neq('id', null);
    console.log('✓ Table daily_comments nettoyée');
    
    // 3. Supprimer les commentaires
    await supabase.from('comments').delete().neq('id', null);
    console.log('✓ Table comments nettoyée');
    
    // 4. Supprimer les unique_likes
    await supabase.from('unique_likes').delete().neq('id', null);
    console.log('✓ Table unique_likes nettoyée');
    
    // 5. Supprimer les daily_media_uploads
    await supabase.from('daily_media_uploads').delete().neq('id', null);
    console.log('✓ Table daily_media_uploads nettoyée');
    
    // 6. Supprimer les liens posts-médias
    await supabase.from('post_medias').delete().neq('id', null);
    console.log('✓ Table post_medias nettoyée');
    
    // 7. Supprimer les posts
    await supabase.from('posts').delete().neq('id', null);
    console.log('✓ Table posts nettoyée');
    
    // 8. Supprimer les médias
    await supabase.from('medias').delete().neq('id', null);
    console.log('✓ Table medias nettoyée');
    
    console.log('✓ Toutes les tables ont été nettoyées');
  } catch (error) {
    console.error('Erreur pendant le nettoyage:', error);
    throw error;
  }
}

/**
 * Vérifie si une URL est une URL Cloudinary valide
 */
function isValidCloudinaryUrl(url) {
  if (!url) return false;
  return url.includes('cloudinary.com') && 
         (url.includes('/video/upload/') || url.includes('/audio/upload/'));
}

/**
 * Extrait l'ID public Cloudinary d'une URL
 */
function extractCloudinaryPublicId(url) {
  if (!isValidCloudinaryUrl(url)) return '';
  
  try {
    const urlParts = url.split('/');
    const fileNameWithExtension = urlParts[urlParts.length - 1];
    const fileNameParts = fileNameWithExtension.split('.');
    return fileNameParts.slice(0, fileNameParts.length - 1).join('.');
  } catch (error) {
    console.error('Erreur extraction ID public:', error);
    return '';
  }
}

/**
 * Récupère la durée d'un média depuis Cloudinary
 */
async function getMediaDuration(url) {
  try {
    const publicId = extractCloudinaryPublicId(url);
    if (!publicId) return 0;
    
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'video',
      type: 'upload',
      media_metadata: true
    });
    
    return result.duration || 0;
  } catch (error) {
    console.error('Erreur récupération durée:', error);
    return 0;
  }
}

/**
 * Fonction principale de seeding
 */
async function seedPostsAndMedias() {
  try {
    console.log('Début du seeding...');
    
    // 1. Nettoyer les données existantes
    await cleanExistingData();
    
    // 2. Récupérer toutes les participations avec audio
    const { data: participations, error: fetchError } = await supabase
      .from('challenge_participations')
      .select('id, challenge_id, user_id, created_at, updated_at, audio_url, media_id, submission_url, challenges:challenge_id(id,title), profiles:user_id(stage_name)')
      .not('audio_url', 'is', null);

    if (fetchError) throw fetchError;
    
    console.log(`Trouvé ${participations.length} participations avec audio`);
    
    // 3. Traiter chaque participation
    for (const participation of participations) {
      try {
        if (!participation.audio_url || !isValidCloudinaryUrl(participation.audio_url)) {
          continue;
        }

        const stageName = participation.profiles?.stage_name || 'Unknown Artist';
        const mediaPublicId = extractCloudinaryPublicId(participation.audio_url);
        if (!mediaPublicId) continue;
        
        // Récupérer la durée depuis Cloudinary
        const duration = await getMediaDuration(participation.audio_url);
        
        // Créer le média
        const { data: media, error: mediaError } = await supabase
          .from('medias')
          .insert({
            media_type: (/\.mp4$/i.test(participation.audio_url)) ? 'video' : 'audio',
            media_url: participation.audio_url,
            media_public_id: mediaPublicId,
            duration: duration,
            title: `TSY NAMAN I MIHEMOTRA - TONGUE NAT & BAMBS FEAT SUGAR MOZIKA REMIX BY ${stageName}`,
            description: '#tnmremixchallenge Ndao hizara mozika',
            user_id: participation.user_id,
            created_at: participation.created_at,
            updated_at: participation.updated_at
          })
          .select()
          .single();

        if (mediaError) {
          console.error(`Erreur création média pour ${participation.id}:`, mediaError);
          continue;
        }

        // Créer le post
        const { data: post, error: postError } = await supabase
          .from('posts')
          .insert({
            content: participation.submission_url + '\n#tnmremixchallenge #mibuzz\nNdao hizara mozika',
            type: 'challenge_participation',
            challenge_id: participation.challenge_id,
            title: participation.challenges?.title,
            description: 'Participation au challenge',
            user_id: participation.user_id,
            created_at: participation.created_at,
            updated_at: participation.updated_at
          })
          .select()
          .single();

        if (postError) {
          console.error(`Erreur création post pour ${participation.id}:`, postError);
          continue;
        }

        // Lier le post et le média
        const { error: linkError } = await supabase
          .from('post_medias')
          .insert({
            post_id: post.id,
            media_id: media.id,
            position: 1,
            created_at: participation.created_at,
            updated_at: participation.updated_at
          });

        if (linkError) {
          console.error(`Erreur liaison post-média pour ${participation.id}:`, linkError);
          continue;
        }

        console.log(`✓ Post et média créés pour participation ${participation.id}`);
      } catch (error) {
        console.error(`Erreur traitement participation ${participation.id}:`, error);
      }
    }

    // 4. Rafraîchir les classements
    await supabase.rpc('refresh_weekly_rankings');
    
    console.log('✓ Seeding terminé avec succès!');
  } catch (error) {
    console.error('Erreur pendant le seeding:', error);
  }
}

// Exécuter le script
seedPostsAndMedias()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erreur non gérée:', error);
    process.exit(1);
  });
