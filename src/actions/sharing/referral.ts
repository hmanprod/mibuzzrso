'use server'

import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

/**
 * Generate a unique referral code for sharing
 */
export async function generateReferralCode(userId: string, postId: string): Promise<string> {
  const supabase = await createClient()
  
  // Generate a short unique code
  const code = nanoid(8)
  
  try {
    // Store the referral code in database
    const { error } = await supabase
      .from('share_referrals')
      .insert({
        code,
        user_id: userId,
        post_id: postId,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error storing referral code:', error)
      // Return a simple code even if storage fails
      return code
    }

    return code
  } catch (error) {
    console.error('Error in generateReferralCode:', error)
    return nanoid(8) // Fallback
  }
}

/**
 * Process a referral code when someone visits a shared link
 */
export async function processReferralVisit(code: string, visitorUserId?: string) {
  const supabase = await createClient()
  
  try {
    console.log('🔍 Looking for referral code:', code)
    
    // Find the referral record
    const { data: referral, error: referralError } = await supabase
      .from('share_referrals')
      .select('*')
      .eq('code', code)
      .single()

    console.log('📋 Referral query result:', { referral, error: referralError })

    if (referralError || !referral) {
      console.log('❌ Referral code not found:', code)
      return { success: false, message: 'Code de parrainage non trouvé' }
    }

    console.log('👥 Sharer ID:', referral.user_id, 'Visitor ID:', visitorUserId)

    // Don't give points if the visitor is the same as the sharer
    if (visitorUserId && visitorUserId === referral.user_id) {
      console.log('🚫 Same user trying to use own referral')
      return { success: false, message: 'Impossible de gagner des points avec son propre lien' }
    }

    // Check if this code has already been used by this visitor (only for logged-in users)
    if (visitorUserId) {
      const { data: existingVisit } = await supabase
        .from('share_referral_visits')
        .select('id')
        .eq('referral_code', code)
        .eq('visitor_user_id', visitorUserId)
        .single()

      console.log('🔄 Existing visit check:', existingVisit)

      if (existingVisit) {
        console.log('⚠️ User already visited this referral')
        return { success: false, message: 'Vous avez déjà visité ce lien partagé' }
      }
    } else {
      console.log('👤 Anonymous visitor - checking by IP would be needed for duplicate prevention')
    }

    console.log('💾 Recording visit...')
    // Record the visit (works for both logged-in and anonymous users)
    const { error: visitError } = await supabase
      .from('share_referral_visits')
      .insert({
        referral_code: code,
        visitor_user_id: visitorUserId, // null for anonymous users
        visitor_ip: null, // Could add IP tracking for anonymous users
        visited_at: new Date().toISOString()
      })

    if (visitError) {
      console.error('❌ Error recording visit:', visitError)
    } else {
      console.log('✅ Visit recorded successfully')
    }

    console.log('💰 Adding points to user:', referral.user_id)
    // Award points to the sharer using the correct function
    const { data: pointsResult, error: pointsError } = await supabase.rpc('add_user_points', {
      p_user_id: referral.user_id,
      p_points: 5,
      p_reason: `Partage visité (code: ${code})`
    })

    console.log('💰 Points RPC result:', { data: pointsResult, error: pointsError })

    if (pointsError) {
      console.error('❌ Error adding points for referral:', pointsError)
      return { success: false, message: 'Erreur lors de l\'attribution des points' }
    }

    console.log('👤 Getting sharer profile...')
    // Get sharer's profile for notification
    const { data: sharerProfile } = await supabase
      .from('profiles')
      .select('stage_name, points')
      .eq('id', referral.user_id)
      .single()

    console.log('👤 Sharer profile:', sharerProfile)

    return { 
      success: true, 
      message: `5 points attribués à ${sharerProfile?.stage_name || 'l\'utilisateur'} pour le partage`,
      sharerName: sharerProfile?.stage_name,
      newPoints: sharerProfile?.points
    }

  } catch (error) {
    console.error('💥 Error in processReferralVisit:', error)
    return { success: false, message: 'Erreur lors du traitement du code de parrainage' }
  }
}

/**
 * Get referral statistics for a user
 */
export async function getReferralStats(userId: string) {
  const supabase = await createClient()
  
  try {
    // Count total referrals created
    const { count: totalReferrals } = await supabase
      .from('share_referrals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Count total visits from referrals
    const { count: totalVisits } = await supabase
      .from('share_referral_visits')
      .select('referral_code, share_referrals!inner(user_id)', { count: 'exact', head: true })
      .eq('share_referrals.user_id', userId)

    // Calculate points earned from referrals
    const pointsEarned = (totalVisits || 0) * 5

    return {
      totalReferrals: totalReferrals || 0,
      totalVisits: totalVisits || 0,
      pointsEarned
    }
  } catch (error) {
    console.error('Error getting referral stats:', error)
    return {
      totalReferrals: 0,
      totalVisits: 0,
      pointsEarned: 0
    }
  }
}
