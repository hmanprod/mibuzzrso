/**
 * Script de migration des participations pour MiBuzz
 * 
 * Ce script:
 * 1. Récupère les participations au challenge
 * 2. Crée les posts de type 'challenge_participation' avec challenge_id
 * 3. Crée les médias avec durée depuis Cloudinary
 * 4. Lie les posts et médias
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;

// Charger les variables d'environnement
dotenv.config();

// Initialiser le client Supabase
const supabaseUrl = 'https://jocbyjlmdcptqdqjsycz.supabase.co/'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvY2J5amxtZGNwdHFkcWpzeWN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjEwMDM1OSwiZXhwIjoyMDUxNjc2MzU5fQ.7WJhWhuYtW-HXqPeSQqn6yF60JOrP7dGKoQf-VllwwI'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or service role key');
  process.exit(1);
}

// Initialiser Cloudinary
const cloudinaryCloudName = 'dzqqbqsiw';
const cloudinaryApiKey = '697727939938564';
const cloudinaryApiSecret = '1GatAZsrR00SJikW3OEF9nbgbdw';

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
 * Fonction principale de migration
 */
async function migrateParticipations() {
  try {
    console.log('Début de la migration des participations...');
    
    // Récupérer toutes les participations avec audio
    const { data: participations, error: fetchError } = await supabase
      .from('challenge_participations')
      .select('id, challenge_id, user_id, created_at, audio_url, submission_url, challenges:challenge_id(id,title), profiles:user_id(stage_name)')
      .not('audio_url', 'is', null);

    if (fetchError) throw fetchError;
    
    console.log('Trouvé ' + participations.length + ' participations avec audio');
    
    // Traiter chaque participation
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
            title: 'TSY NAMAN I MIHEMOTRA - TONGUE NAT & BAMBS FEAT SUGAR MOZIKA REMIX BY ' + stageName,
            description: '#tnmremixchallenge Ndao hizara mozika',
            user_id: participation.user_id,
            created_at: participation.created_at,
            updated_at: participation.created_at
          })
          .select()
          .single();

        if (mediaError) {
          console.error('Erreur création média pour ' + participation.id + ':', mediaError);
          continue;
        }

        // Créer le post
        const { data: post, error: postError } = await supabase
          .from('posts')
          .insert({
            content: participation.submission_url + '\n#tnmremixchallenge #mibuzz\nNdao hizara mozika',
            post_type: 'challenge_participation',
            challenge_id: participation.challenge_id,
            user_id: participation.user_id,
            created_at: participation.created_at,
            updated_at: participation.created_at
          })
          .select()
          .single();

        if (postError) {
          console.error('Erreur création post pour ' + participation.id + ':', postError);
          continue;
        }

        // Lier le post et le média
        const { error: linkError } = await supabase
          .from('posts_medias')
          .insert({
            post_id: post.id,
            media_id: media.id,
            position: 1,
            created_at: participation.created_at
          });

        if (linkError) {
          console.error('Erreur liaison post-média pour ' + participation.id + ':', linkError);
          continue;
        }

        console.log('✓ Post et média créés pour participation ' + participation.id);
      } catch (error) {
        console.error('Erreur traitement participation ' + participation.id + ':', error);
      }
    }

    // Rafraîchir les classements
    await supabase.rpc('refresh_weekly_rankings');
    
    console.log('✓ Migration terminée avec succès!');
  } catch (error) {
    console.error('Erreur pendant la migration:', error);
  }
}

// Exécuter le script
migrateParticipations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erreur non gérée:', error);
    process.exit(1);
  });
