import { NextRequest, NextResponse } from 'next/server';
import { MediaType } from '@/types/database';
import { cloudName, getUploadPreset } from '@/config/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mediaType = formData.get('mediaType') as MediaType | 'avatar';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('upload_preset', getUploadPreset(mediaType));
    uploadFormData.append('cloud_name', cloudName);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${mediaType === 'avatar' ? 'image' : mediaType}/upload`,
      {
        method: 'POST',
        body: uploadFormData,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Upload failed', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      url: data.secure_url,
      publicId: data.public_id,
      duration: data.duration,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
