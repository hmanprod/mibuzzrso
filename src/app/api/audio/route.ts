import { decryptUrl } from '@/utils/encryption.utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Block direct navigation to the API endpoint.
    const secFetchDest = request.headers.get('sec-fetch-dest');
    if (secFetchDest === 'document') {
      return NextResponse.json({ error: 'Accès direct non autorisé.' }, { status: 403 });
    }

    let audioUrl = request.nextUrl.searchParams.get('url');
    console.log("audioUrl", audioUrl);

    if (!audioUrl) {
      return NextResponse.json({ error: 'URL du fichier audio manquante.' }, { status: 400 });
    }
    
    // identifier si l'url est deja encode
    const encrypted = !audioUrl.startsWith('https://res.cloudinary.com/');

    if (encrypted) {
      console.log("L'audio est encrypte");
      
      audioUrl = decryptUrl(audioUrl);
    }

    // Valider que l'URL provient d'une source de confiance (Cloudinary)
    if (!audioUrl.startsWith('https://res.cloudinary.com/')) {
        return NextResponse.json({ error: 'URL non autorisée.' }, { status: 403 });
    }

    const allowedOrigins = [
      'http://localhost:3000',
      'http://mibuzz-social.vercel.app',
      'https://social.mibuzz.mg'
    ];

    const referer = request.headers.get('referer');
    if (!referer || !allowedOrigins.some(origin => referer.startsWith(origin))) {
      return NextResponse.json({ error: 'Requête non autorisée.' }, { status: 403 });
    }

    // Fetch the audio from the provided Cloudinary URL
    // console.log(`[API/AUDIO] Tentative de récupération de l'URL : ${audioUrl}`);

    const audioResponse = await fetch(audioUrl);

    if (!audioResponse.ok) {
      console.error(`[API/AUDIO] Échec de la récupération depuis Cloudinary. Statut : ${audioResponse.status}, Message : ${audioResponse.statusText}`);
      const responseBody = await audioResponse.text();
      console.error(`[API/AUDIO] Corps de la réponse d'erreur de Cloudinary : ${responseBody}`);
      return NextResponse.json({ error: `Impossible de récupérer l'audio : ${audioResponse.statusText}` }, { status: audioResponse.status });
    }

    // Get the body as a ReadableStream
    const audioStream = audioResponse.body;

    // Set headers to suggest inline playback and prevent easy download
    const headers = new Headers();
    headers.set('Content-Type', 'application/octet-stream');
    headers.set('Content-Disposition', 'inline');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

   


    // Return a new response with the stream and appropriate headers
    return new NextResponse(audioStream, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[API/AUDIO] Erreur inattendue dans la route API :', error);
    return NextResponse.json({ error: 'Erreur interne du serveur', details: errorMessage }, { status: 500 });
  }
}
