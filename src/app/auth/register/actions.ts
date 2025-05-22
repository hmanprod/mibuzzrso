'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function register(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const acceptTerms = formData.get('acceptTerms') === 'on'

  if (password !== confirmPassword) {
    return { error: 'Les mots de passe ne correspondent pas' }
  }

  if (!acceptTerms) {
    return { error: 'Vous devez accepter les conditions d\'utilisation' }
  }

  const supabase = await createClient()

  // Tenter de se connecter avec l'email pour voir s'il existe
  // Cette méthode ne révèle pas si l'email existe mais nous pouvons détecter certains cas
  console.log("tentative de sign in");

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: 'test-password-that-probably-doesnt-match'
  });

  console.log("the eroor is ", signInError);
  
  // // Si l'erreur indique que l'email n'existe pas, c'est bon
  // // Si l'erreur indique un mot de passe incorrect, alors l'email existe déjà
  // if (signInError && signInError.message.includes('Invalid login credentials')) {
  //   // L'email existe probablement, mais le mot de passe est incorrect
  //   return { error: 'Un compte avec cet email existe déjà. Veuillez vous connecter ou utiliser un autre email.' }
  // }
  
  // Procéder à l'inscription
  console.log("tentative de sign up");
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });
  
  console.log("the sign up data", error)
  // Si l'inscription renvoie "Email already registered", c'est un autre moyen de détecter
  if (error && error.message.includes('Email already registered')) {
    return { error: 'Un compte avec cet email existe déjà. Veuillez vous connecter ou utiliser un autre email.' }
  }

  // Autres erreurs d'inscription
  if (error) {
    console.error(error);
    return { error: error.message }
  }

  // Vérifier si l'utilisateur a été créé mais nécessite une confirmation d'email
  console.log("data is", data);
  
  if (data?.user?.identities?.length === 0) {
    return { error: 'Un compte avec cet email existe déjà mais n\'a pas été confirmé. Veuillez vérifier votre boîte mail.' }
  }

  redirect('/auth/verify-email')
}

export async function check_email(email: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from('auth.users').select('id').eq('email', email)

  if (error) {
    console.error(error)
    return { error: error.message }
  }

  if (data.length > 0) {
    return { error: 'Un compte avec cet email existe déjà' }
  }
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { url: data.url }
}
