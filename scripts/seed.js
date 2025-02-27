/**
 * Seed script to create posts and media from challenge participations
 * 
 * This script:
 * 1. Cleans existing data from posts and related tables
 * 2. Fetches all challenge participations that have audio_url
 * 3. Creates a post for each participation
 * 4. Creates a media entry for each participation's audio with duration from Cloudinary
 * 5. Links the post and media together
 */

// CommonJS imports
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const cloudinary = require('cloudinary').v2;

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or service role key');
  process.exit(1);
}

// Initialize Cloudinary
const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const cloudinaryApiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
const cloudinaryApiSecret = process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET;

if (!cloudinaryCloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
  console.error('Missing Cloudinary configuration. Make sure the following environment variables are set:');
  console.error('- NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME');
  console.error('- NEXT_PUBLIC_CLOUDINARY_API_KEY');
  console.error('- NEXT_PUBLIC_CLOUDINARY_API_SECRET');
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudinaryCloudName,
  api_key: cloudinaryApiKey,
  api_secret: cloudinaryApiSecret,
  secure: true
});

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanExistingData() {
  console.log('Cleaning existing data from posts and related tables...');
  
  try {
    // Delete from interactions table first (references posts, comments, and medias)
    const { error: interactionsError } = await supabase
      .from('interactions')
      .delete()
      .neq('id', null); // Ensure we are deleting records with a valid ID

    if (interactionsError) {
      console.error('Error deleting from interactions:', interactionsError.message);
      throw interactionsError;
    }
    console.log('Successfully cleaned interactions table');
    
    // Delete from comments table (references medias)
    const { error: commentsError } = await supabase
      .from('comments')
      .delete()
      .neq('id', null); // Ensure we are deleting records with a valid ID

    if (commentsError) {
      console.error('Error deleting from comments:', commentsError.message);
      throw commentsError;
    }
    console.log('Successfully cleaned comments table');
    
    // Delete from posts_medias junction table (references posts and medias)
    const { error: postsMediasError } = await supabase
      .from('posts_medias')
      .delete()
      .neq('id', null); // Ensure we are deleting records with a valid ID

    if (postsMediasError) {
      console.error('Error deleting from posts_medias:', postsMediasError.message);
      throw postsMediasError;
    }
    console.log('Successfully cleaned posts_medias table');
    
    // Delete from posts table
    const { error: postsError } = await supabase
      .from('posts')
      .delete()
      .neq('id', null); // Ensure we are deleting records with a valid ID

    if (postsError) {
      console.error('Error deleting from posts:', postsError.message);
      throw postsError;
    }
    console.log('Successfully cleaned posts table');
    
    // Delete from medias table
    const { error: mediasError } = await supabase
      .from('medias')
      .delete()
      .neq('id', null); // Ensure we are deleting records with a valid ID

    if (mediasError) {
      console.error('Error deleting from medias:', mediasError.message);
      throw mediasError;
    }
    console.log('Successfully cleaned medias table');
    
    console.log('All tables cleaned successfully');
  } catch (error) {
    console.error('Error during data cleaning:', error);
    throw error;
  }
}

/**
 * Check if a URL is a valid Cloudinary URL
 * @param {string} url - URL to check
 * @returns {boolean} - True if valid Cloudinary URL
 */
function isValidCloudinaryUrl(url) {
  if (!url) return false;
  
  try {
    // Check if URL is from Cloudinary
    return url.includes('cloudinary.com') && 
           (url.includes('/video/upload/') || url.includes('/audio/upload/') || url.includes('/image/upload/'));
  } catch (error) {
    return false;
  }
}

/**
 * Extract Cloudinary public ID from URL
 * @param {string} url - Cloudinary URL
 * @returns {string} - Public ID
 */

function extractCloudinaryPublicId(url) {
    console.log('Extracting public ID from:', url);
    if (!isValidCloudinaryUrl(url)) {
        console.error('Not a valid Cloudinary URL:', url);
        return '';
    }

    try {
        // Parse the URL to extract the public ID
        const urlParts = url.split('/');
        const fileNameWithExtension = urlParts[urlParts.length - 1];
        
        // Split by dot and remove the last part (extension)
        const fileNameParts = fileNameWithExtension.split('.');
        const publicId = fileNameParts.slice(0, fileNameParts.length - 1).join('.');

        return publicId;
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return '';
    }
}

/**
 * Get audio duration from Cloudinary
 * @param {string} audioUrl - Cloudinary audio URL
 * @returns {Promise<number>} - Duration in seconds
 */
async function getAudioDuration(audioUrl) {
  try {
    // Extract public ID from URL
    const publicId = extractCloudinaryPublicId(audioUrl);
    
    if (!publicId) {
      console.error('Could not extract public ID from URL:', audioUrl);
      return 0;
    }
    
    console.log(`Extracted public ID: ${publicId}`);
    
    // Get resource information from Cloudinary
    const result = await cloudinary.api.resource(publicId, { 
      resource_type: 'video',
      type: 'upload',
      media_metadata: true // Demander les métadonnées complètes
    });
    
    // Return duration in seconds
    return result.duration || 0;
  } catch (error) {
    console.error('Error getting audio duration from Cloudinary:', error);
    return 0; // Default to 0 if there's an error
  }
}

async function seedPostsAndMedias() {
  try {
    console.log('Starting to seed posts and media from challenge participations...');
    
    // Clean existing data first
    // await cleanExistingData();

    // Fetch all challenge participations that have audio_url
    const { data: participations, error: fetchError } = await supabase
      .from('challenge_participations')
      .select(`
        id, 
        challenge_id, 
        user_id, 
        created_at, 
        audio_url, 
        submission_url,
        profiles (
            stage_name
        )
      `)
      .not('audio_url', 'is', null);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${participations.length} challenge participations with audio`);

    // Process each participation
    for (const participation of participations) {
      try {
        // Skip if no audio_url
        if (!participation.audio_url) {
          console.log(`Skipping participation ${participation.id} - no audio URL`);
          continue;
        }

        // Validate audio URL
        if (!isValidCloudinaryUrl(participation.audio_url)) {
          console.log(`Skipping participation ${participation.id} - invalid Cloudinary URL: ${participation.audio_url}`);
          continue;
        }

        // Extract stage name from profile
        const stageName = participation.profiles?.stage_name || 'Unknown Artist';
        
        // Extract media public ID from audio_url
        const mediaPublicId = extractCloudinaryPublicId(participation.audio_url);
        if (!mediaPublicId) {
          console.log(`Skipping participation ${participation.id} - could not extract public ID from URL: ${participation.audio_url}`);
          continue;
        }
        
        // Get audio duration from Cloudinary
        let duration = 0;
        try {
          duration = await getAudioDuration(participation.audio_url);
          console.log(`Audio duration for ${mediaPublicId}: ${duration} seconds`);
        } catch (durationError) {
          console.error(`Error getting duration for ${mediaPublicId}:`, durationError);
          // Continue with duration = 0
        }
        
        // 1. Create media entry
        const { data: media, error: mediaError } = await supabase
          .from('medias')
          .insert({
            media_type: (/\.mp4$/i.test(participation.audio_url)) ? 'video' : 'audio',
            media_url: participation.audio_url,
            media_public_id: mediaPublicId,
            duration: duration, // Add duration from Cloudinary
            title: `TSY NAMAN I MIHEMOTRA - TONGUE NAT & BAMBS FEAT SUGAR MOZIKA REMIX BY ${stageName}`,
            description: '#tnmremixchallenge Ndao hizara mozika',
            user_id: participation.user_id,
            created_at: participation.created_at
          })
          .select()
          .single();

        if (mediaError) {
          console.error(`Error creating media for participation ${participation.id}:`, mediaError);
          continue;
        }

        // 2. Create post
        const { data: post, error: postError } = await supabase
          .from('posts')
          .insert({
            content: `${participation.submission_url}\n#tnmremixchallenge #mibuzz\nNdao hizara mozika`,
            user_id: participation.user_id,
            created_at: participation.created_at
          })
          .select()
          .single();

        if (postError) {
          console.error(`Error creating post for participation ${participation.id}:`, postError);
          continue;
        }

        // 3. Link post and media
        const { error: linkError } = await supabase
          .from('posts_medias')
          .insert({
            post_id: post.id,
            media_id: media.id,
            position: 1 // First position
          });

        if (linkError) {
          console.error(`Error linking post and media for participation ${participation.id}:`, linkError);
          continue;
        }

        console.log(`Created post and media for participation ${participation.id}`);
      } catch (participationError) {
        console.error(`Error processing participation ${participation.id}:`, participationError);
        // Continue with next participation
      }
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding posts and media:', error);
  }
}

// Run the seed function
seedPostsAndMedias()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });