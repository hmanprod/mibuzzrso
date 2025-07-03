import { decryptUrl } from '@/utils/encryption.utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Empêcher l'accès direct via un navigateur
    const secFetchDest = request.headers.get('sec-fetch-dest');
    if (secFetchDest === 'document') {
      return NextResponse.json({ error: 'Accès direct non autorisé.' }, { status: 403 });
    }

    let audioUrl = request.nextUrl.searchParams.get('url');
    console.log("[API/AUDIO] audioUrl reçue :", audioUrl);

    if (!audioUrl) {
      return NextResponse.json({ error: 'URL du fichier audio manquante.' }, { status: 400 });
    }

    // Vérifier si l'URL est cryptée
    const encrypted = !audioUrl.startsWith('https://res.cloudinary.com/');
    if (encrypted) {
      console.log("[API/AUDIO] URL cryptée détectée, déchiffrement en cours...");
      audioUrl = decryptUrl(audioUrl);
    }

    // Validation : source autorisée
    const cloudinaryBase = 'https://res.cloudinary.com/';
    if (!audioUrl.startsWith(cloudinaryBase)) {
      return NextResponse.json({ error: 'URL non autorisée.' }, { status: 403 });
    }

    // Vérifier que la requête vient d’un domaine autorisé
    const allowedOrigins = [
      'http://localhost:3000',
      'https://mibuzz-social.vercel.app',
      'https://social.mibuzz.mg'
    ];
    const referer = request.headers.get('referer');
    if (!referer || !allowedOrigins.some(origin => referer.startsWith(origin))) {
      return NextResponse.json({ error: 'Requête non autorisée.' }, { status: 403 });
    }

    // ---- Construction de l'URL optimisée Cloudinary ----
    const uploadIndex = audioUrl.indexOf('/upload/');
    if (uploadIndex === -1) {
      return NextResponse.json({ error: 'URL Cloudinary invalide.' }, { status: 400 });
    }

    const prefix = audioUrl.substring(0, uploadIndex + 8); // jusqu’à "/upload/"
    const suffix = audioUrl.substring(uploadIndex + 8);    // après "/upload/"

    // Forcer l’extension .mp3
    const parts = suffix.split('/');
    const file = parts[parts.length - 1];
    const fileParts = file.split('.');
    fileParts[fileParts.length - 1] = 'mp3';
    parts[parts.length - 1] = fileParts.join('.');
    const newSuffix = parts.join('/');

    // Finaliser l’URL avec transformation (f_mp3, 64k, attachement)
    const modifiedAudioUrl = `${prefix}f_mp3,br_64k,fl_attachment/${newSuffix}`;
    console.log("[API/AUDIO] URL Cloudinary transformée :", modifiedAudioUrl);

    // Récupérer le fichier audio transformé
    const audioResponse = await fetch(modifiedAudioUrl);
    if (!audioResponse.ok) {
      const body = await audioResponse.text();
      console.error(`[API/AUDIO] Erreur Cloudinary ${audioResponse.status} : ${body}`);
      return NextResponse.json({ error: `Erreur Cloudinary : ${audioResponse.statusText}` }, { status: audioResponse.status });
    }

    // Stream audio en réponse
    const audioStream = audioResponse.body;

    const headers = new Headers();
    headers.set('Content-Type', 'text');
    headers.set('Content-Disposition', 'inline');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return new NextResponse(audioStream, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[API/AUDIO] Erreur serveur :', error);
    return NextResponse.json({ error: 'Erreur interne du serveur', details: errorMessage }, { status: 500 });
  }
}
