import { decryptUrl } from '@/utils/encryption.utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Block direct navigation to the API endpoint.
    const secFetchDest = request.headers.get('sec-fetch-dest');
    if (secFetchDest === 'document') {
      return NextResponse.json({ error: 'Accès direct non autorisé.' }, { status: 403 });
    }

    let videoUrl = request.nextUrl.searchParams.get('url');
    console.log("videoUrl", videoUrl);

    if (!videoUrl) {
      return NextResponse.json({ error: 'URL du fichier video manquante.' }, { status: 400 });
    }
    
    // identifier si l'url est deja encode
    const encrypted = !videoUrl.startsWith('https://res.cloudinary.com/');

    if (encrypted) {
      console.log("La video est encrypte");
      
      videoUrl = decryptUrl(videoUrl);
    }

    // Valider que l'URL provient d'une source de confiance (Cloudinary)
    if (!videoUrl.startsWith('https://res.cloudinary.com/')) {
        return NextResponse.json({ error: 'URL non autorisée.' }, { status: 403 });
    }
    

    const allowedOrigins = [
      'http://localhost:3000',
      'https://mibuzz-social.vercel.app',
      'https://social.mibuzz.mg'
    ];

    const referer = request.headers.get('referer');
    if (!referer || !allowedOrigins.some(origin => referer.startsWith(origin))) {
      return NextResponse.json({ error: 'Requête non autorisée.' }, { status: 403 });
    }

    // Fetch the audio from the provided Cloudinary URL
    // console.log(`[API/AUDIO] Tentative de récupération de l'URL : ${videoUrl}`);

    const videoResponse = await fetch(videoUrl);

    if (!videoResponse.ok) {
      console.error(`[API/VIDEO] Échec de la récupération depuis Cloudinary. Statut : ${videoResponse.status}, Message : ${videoResponse.statusText}`);
      const responseBody = await videoResponse.text();
      console.error(`[API/VIDEO] Corps de la réponse d'erreur de Cloudinary : ${responseBody}`);
      return NextResponse.json({ error: `Impossible de récupérer la video : ${videoResponse.statusText}` }, { status: videoResponse.status });
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
