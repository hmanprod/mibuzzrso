import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decryptUrl } from '@/utils/encryption.utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { mediaId } = await params;
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get media information
    const { data: media, error: mediaError } = await supabase
      .from('medias')
      .select('media_url, title, media_type')
      .eq('id', mediaId)
      .single();

    if (mediaError || !media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    // Process media URL (decrypt if encrypted)
    let mediaUrl = media.media_url;
    const encrypted = !mediaUrl.startsWith('https://res.cloudinary.com/');
    if (encrypted) {
      console.log("[API/DOWNLOAD] Encrypted URL detected, decrypting...");
      mediaUrl = decryptUrl(mediaUrl);
    }

    // Apply Cloudinary transformation for download
    const cloudinaryBase = 'https://res.cloudinary.com/';
    if (mediaUrl.startsWith(cloudinaryBase)) {
      const uploadIndex = mediaUrl.indexOf('/upload/');
      if (uploadIndex !== -1) {
        const prefix = mediaUrl.substring(0, uploadIndex + 8); // jusqu'à "/upload/"
        const suffix = mediaUrl.substring(uploadIndex + 8);    // après "/upload/"

        // Forcer l'extension appropriée et ajouter transformation
        const parts = suffix.split('/');
        const file = parts[parts.length - 1];
        const fileParts = file.split('.');
        const extension = media.media_type === 'audio' ? 'mp3' : 'mp4';
        fileParts[fileParts.length - 1] = extension;
        parts[parts.length - 1] = fileParts.join('.');
        const newSuffix = parts.join('/');

        // Finaliser l'URL avec transformation pour téléchargement
        if (media.media_type === 'audio') {
          mediaUrl = `${prefix}f_mp3,br_64k,fl_attachment/${newSuffix}`;
        } else {
          mediaUrl = `${prefix}fl_attachment/${newSuffix}`;
        }
        console.log("[API/DOWNLOAD] Cloudinary URL transformed:", mediaUrl);
      }
    }

    // Fetch the media file
    const response = await fetch(mediaUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch media file' },
        { status: 500 }
      );
    }

    // Check if download interaction already exists
    const { data: existingInteraction } = await supabase
      .from('interactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('media_id', mediaId)
      .eq('type', 'download')
      .single();

    // Insert download interaction only if it doesn't exist
    if (!existingInteraction) {
      const { error: interactionError } = await supabase
        .from('interactions')
        .insert({
          type: 'download',
          user_id: user.id,
          post_id: postId,
          media_id: mediaId
        });

      if (interactionError) {
        console.error('Error inserting download interaction:', interactionError);
        // Continue with download even if interaction fails
      }
    } else {
      console.log('Download interaction already exists, skipping insertion');
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');

    // Get filename from title or use default
    const filename = media.title
      ? `${media.title}.${media.media_type === 'audio' ? 'mp3' : 'mp4'}`
      : `download.${media.media_type === 'audio' ? 'mp3' : 'mp4'}`;

    // Return the file with appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Error in download API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
