/**
 * Script to delete a user by ID from both auth.users and public.profiles
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or service role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Deletes a user by ID, ensuring all related data is removed in the correct order.
 * @param {string} userId - The ID of the user to delete
 */
async function deleteUser(userId) {
  console.log(`Starting deletion for user ID: ${userId}`);

  try {
    // Based on the schema, we must delete from tables with restrictive foreign keys first.
    // The order is critical to avoid constraint violations.

    console.log('Step 1: Deleting user data from tables with RESTRICT constraints...');

    // Delete from points_history
    const { error: pointsHistoryError } = await supabase.from('points_history').delete().eq('user_id', userId);
    if (pointsHistoryError) throw new Error(`Failed to delete from points_history: ${pointsHistoryError.message}`);
    console.log('  ✓ points_history');

    // Delete from posts (will cascade to posts_medias)
    const { error: postsError } = await supabase.from('posts').delete().eq('user_id', userId);
    if (postsError) throw new Error(`Failed to delete from posts: ${postsError.message}`);
    console.log('  ✓ posts');

    // Delete from challenges
    const { error: challengesError } = await supabase.from('challenges').delete().eq('user_id', userId);
    if (challengesError) throw new Error(`Failed to delete from challenges: ${challengesError.message}`);
    console.log('  ✓ challenges');

    // Delete from daily_comments
    const { error: dailyCommentsError } = await supabase.from('daily_comments').delete().eq('user_id', userId);
    if (dailyCommentsError) throw new Error(`Failed to delete from daily_comments: ${dailyCommentsError.message}`);
    console.log('  ✓ daily_comments');

    // Delete from daily_media_uploads
    const { error: dailyMediaUploadsError } = await supabase.from('daily_media_uploads').delete().eq('user_id', userId);
    if (dailyMediaUploadsError) throw new Error(`Failed to delete from daily_media_uploads: ${dailyMediaUploadsError.message}`);
    console.log('  ✓ daily_media_uploads');

    // Delete from unique_likes
    const { error: uniqueLikesError } = await supabase.from('unique_likes').delete().eq('user_id', userId);
    if (uniqueLikesError) throw new Error(`Failed to delete from unique_likes: ${uniqueLikesError.message}`);
    console.log('  ✓ unique_likes');

    // Delete from profiles_beatmakers (explicitly, though it should cascade)
    const { error: beatmakerError } = await supabase.from('profiles_beatmakers').delete().eq('id', userId);
    if (beatmakerError) throw new Error(`Failed to delete from profiles_beatmakers: ${beatmakerError.message}`);
    console.log('  ✓ profiles_beatmakers');

    console.log('Step 2: Deleting user from auth.users, triggering final cascades...');
    
    // Finally, delete the user from auth.users. This will cascade to `profiles`
    // and all other tables with `ON DELETE CASCADE` constraints.
    const { data: deletionData, error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      throw new Error(`Failed to delete from auth.users: ${authError.message}`);
    }
    
    console.log('  ✓ auth.users and cascading deletes completed.');
    console.log('Deletion response:', deletionData);

    console.log(`\nSuccessfully deleted all data for user ${userId}`);
  } catch (error) {
    console.error('\nAn error occurred during user deletion:');
    console.error(error.message);
    throw error;
  }
}

// Get user ID from command line arguments
const userId = process.argv[2];

if (!userId) {
  console.error('Please provide a user ID.');
  console.log('Usage: node scripts/delete_user.js <user_id>');
  process.exit(1);
}

// Execute the script
deleteUser(userId)
  .then(() => {
    console.log('Script finished successfully.');
    process.exit(0);
  })
  .catch(() => {
    console.error('Script finished with errors.');
    process.exit(1);
  });
