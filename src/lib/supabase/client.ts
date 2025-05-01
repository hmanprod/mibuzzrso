import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

let client: ReturnType<typeof createClientComponentClient> | null = null

export function createClient() {
  if (client) return client

  client = createClientComponentClient({
    cookieOptions: {
      name: 'sb-session',
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    }
  })

  return client
}
