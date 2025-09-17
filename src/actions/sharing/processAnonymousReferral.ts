'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Check how many referral points a user has earned today
 */
async function getDailyReferralPoints(userId: string): Promise<number> {
  const supabase = await createClient()
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]
  
  try {
    const { count, error } = await supabase
      .from('points_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)
      .like('reason', '%Partage visité%')

    if (error) {
      console.error('Error counting daily referral points:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error in getDailyReferralPoints:', error)
    return 0
  }
}

/**
 * Process referral points when an anonymous user signs up/logs in
 * This should be called after successful authentication
 */
export async function processAnonymousReferral(userId: string, referralCode?: string) {
  if (!referralCode) return { success: false, message: 'Aucun code de parrainage' }

  const supabase = await createClient()
  
  try {
    console.log('🔍 Processing anonymous referral for new user:', userId, 'with code:', referralCode)
    
    // Find the referral record
    const { data: referral, error: referralError } = await supabase
      .from('share_referrals')
      .select('*')
      .eq('code', referralCode)
      .single()

    if (referralError || !referral) {
      console.log('❌ Referral code not found:', referralCode)
      return { success: false, message: 'Code de parrainage non trouvé' }
    }

    // Don't give points if the new user is the same as the sharer
    if (userId === referral.user_id) {
      console.log('🚫 Same user trying to use own referral')
      return { success: false, message: 'Impossible de gagner des points avec son propre lien' }
    }

    // Check if this user already got points for this referral
    const { data: existingVisit } = await supabase
      .from('share_referral_visits')
      .select('id')
      .eq('referral_code', referralCode)
      .eq('visitor_user_id', userId)
      .single()

    if (existingVisit) {
      console.log('⚠️ User already processed for this referral')
      return { success: false, message: 'Vous avez déjà été traité pour ce lien partagé' }
    }

    // Record the visit with the new user ID
    console.log('💾 Recording visit for new user...')
    const { error: visitError } = await supabase
      .from('share_referral_visits')
      .insert({
        referral_code: referralCode,
        visitor_user_id: userId,
        visitor_ip: null,
        visited_at: new Date().toISOString()
      })

    if (visitError) {
      console.error('❌ Error recording visit:', visitError)
    } else {
      console.log('✅ Visit recorded successfully')
    }

    // Check daily limit before awarding points
    const dailyPoints = await getDailyReferralPoints(referral.user_id)
    console.log('📊 Daily referral points for user:', referral.user_id, 'is:', dailyPoints)

    if (dailyPoints >= 3) {
      console.log('🚫 Daily limit reached for user:', referral.user_id)
      return { 
        success: false, 
        message: 'Limite quotidienne de 3 points de parrainage atteinte pour aujourd\'hui' 
      }
    }

    // Award points to the sharer
    console.log('💰 Adding 1 point to sharer:', referral.user_id)
    const { data: pointsResult, error: pointsError } = await supabase.rpc('add_user_points', {
      p_user_id: referral.user_id,
      p_points: 1,
      p_reason: `Partage visité par nouvel utilisateur (code: ${referralCode})`
    })

    console.log('💰 Points RPC result:', { data: pointsResult, error: pointsError })

    if (pointsError) {
      console.error('❌ Error adding points for referral:', pointsError)
      return { success: false, message: 'Erreur lors de l\'attribution des points' }
    }

    // Get sharer's profile for notification
    const { data: sharerProfile } = await supabase
      .from('profiles')
      .select('stage_name, points')
      .eq('id', referral.user_id)
      .single()

    return { 
      success: true, 
      message: `1 point attribué à ${sharerProfile?.stage_name || 'l\'utilisateur'} pour votre inscription via son lien`,
      sharerName: sharerProfile?.stage_name,
      newPoints: sharerProfile?.points
    }

  } catch (error) {
    console.error('💥 Error in processAnonymousReferral:', error)
    return { success: false, message: 'Erreur lors du traitement du code de parrainage' }
  }
}
