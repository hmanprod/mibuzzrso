import { decryptUrl } from '@/utils/encryption.utils';
import { NextRequest, NextResponse } from 'next/server';
export async function GET(request: NextRequest) {
  try {
    // Bloquer l’accès direct via navigateur
    const secFetchDest = request.headers.get('sec-fetch-dest');
    if (secFetchDest === 'document') {
      return NextResponse.json({ error: 'Accès direct non autorisé.' }, { status: 403 });
    }

    let videoUrl = request.nextUrl.searchParams.get('url');
    console.log("videoUrl reçue :", videoUrl);

    if (!videoUrl) {
      return NextResponse.json({ error: 'URL du fichier video manquante.' }, { status: 400 });
    }

    // Vérifie si l’URL est cryptée
    const encrypted = !videoUrl.startsWith('https://res.cloudinary.com/');
    if (encrypted) {
      console.log("La vidéo est cryptée, déchiffrement en cours...");
      videoUrl = decryptUrl(videoUrl);
    }

    // Vérifie que l’URL Cloudinary est valide
    if (!videoUrl.startsWith('https://res.cloudinary.com/')) {
      return NextResponse.json({ error: 'URL non autorisée.' }, { status: 403 });
    }

    // Vérifie la source (referer)
    const allowedOrigins = [
      'http://localhost:3000',
      'https://mibuzz-social.vercel.app',
      'https://social.mibuzz.mg'
    ];
    const referer = request.headers.get('referer');
    if (!referer || !allowedOrigins.some(origin => referer.startsWith(origin))) {
      return NextResponse.json({ error: 'Requête non autorisée.' }, { status: 403 });
    }

    // Injecter les transformations Cloudinary : MP4, SD (640x360), qualité auto
    const uploadIndex = videoUrl.indexOf('/upload/');
    if (uploadIndex === -1) {
      return NextResponse.json({ error: 'URL Cloudinary invalide.' }, { status: 400 });
    }

    const prefix = videoUrl.substring(0, uploadIndex + 8); // jusqu’à "/upload/"
    const suffix = videoUrl.substring(uploadIndex + 8);    // après "/upload/"

    // Remplacer extension finale par .mp4 si nécessaire
    const parts = suffix.split('/');
    const file = parts[parts.length - 1];
    const fileParts = file.split('.');
    fileParts[fileParts.length - 1] = 'mp4';
    parts[parts.length - 1] = fileParts.join('.');
    const newSuffix = parts.join('/');

    // Construction de l’URL avec transformation vidéo SD optimisée
    const transformedVideoUrl = `${prefix}f_mp4,q_auto,w_640,h_360/${newSuffix}`;
    console.log("[API/VIDEO] URL transformée :", transformedVideoUrl);

    // Récupération depuis Cloudinary
    const videoResponse = await fetch(transformedVideoUrl);

    if (!videoResponse.ok) {
      console.error(`[API/VIDEO] Échec Cloudinary (${videoResponse.status}) : ${videoResponse.statusText}`);
      const responseBody = await videoResponse.text();
      console.error(`[API/VIDEO] Réponse Cloudinary : ${responseBody}`);
      return NextResponse.json({ error: `Impossible de récupérer la vidéo : ${videoResponse.statusText}` }, { status: videoResponse.status });
    }

    // Get the body as a ReadableStream
    const videoStream = videoResponse.body;

    // Set headers to suggest inline playback and prevent easy download
    const headers = new Headers();
    headers.set('Content-Type', 'application/octet-stream');
    headers.set('Content-Disposition', 'inline');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

   


    // Return a new response with the stream and appropriate headers
    return new NextResponse(videoStream, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[API/VIDEO] Erreur inattendue dans la route API :', error);
    return NextResponse.json({ error: 'Erreur interne du serveur', details: errorMessage }, { status: 500 });
  }
}
