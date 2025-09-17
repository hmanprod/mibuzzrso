import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const referralCode = searchParams.get('ref')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/feed'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  
  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Process referral if present
      if (referralCode) {
        try {
          const { processAnonymousReferral } = await import('@/actions/sharing/processAnonymousReferral')
          const result = await processAnonymousReferral(data.user.id, referralCode)
          console.log('Referral processing result:', result)
        } catch (error) {
          console.error('Error processing referral:', error)
        }
      }
      
      return NextResponse.redirect(`${appUrl}${next}`)
    } else {
      console.error('Auth code exchange error:', error?.message)
      return NextResponse.redirect(`${appUrl}/auth/login?error=auth_error`)
    }
  }
  
  // return the user to an error page with instructions
  return NextResponse.redirect(`${appUrl}/auth/auth-code-error`)
}
