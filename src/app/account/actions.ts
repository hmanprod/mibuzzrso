'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Updates the user's password
 * @param password The new password
 * @returns Object containing success status and message
 */
export async function updatePassword(password: string) {
  try {
    // Validate password
    if (!password || password.length < 6) {
      return {
        success: false,
        message: 'Password must be at least 6 characters long'
      }
    }

    // Get supabase client - properly await the Promise
    const supabase = await createClient()

    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return {
        success: false,
        message: 'You must be logged in to update your password'
      }
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      console.error('Error updating password:', error.message)
      return {
        success: false,
        message: error.message
      }
    }

    return {
      success: true,
      message: 'Password updated successfully'
    }
  } catch (error) {
    console.error('Error updating password:', error)
    return {
      success: false,
      message: 'An unexpected error occurred'
    }
  }
}
