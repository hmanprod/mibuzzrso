'use client';

import { useState } from 'react';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';

export default function TestPage() {
  const { uploadToCloudinary, isUploading, progress } = useCloudinaryUpload();
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setUploadedUrl(null);
      
      const result = await uploadToCloudinary(file, 'audio');
      setUploadedUrl(result.url);
      console.log('Upload result:', result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      console.error('Upload error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Cloudinary Upload Test</h1>
          <p className="mt-2 text-sm text-gray-600">Test direct upload to Cloudinary</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Choose a file to upload
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept="video/*,audio/*,image/*"
                      disabled={isUploading}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">Video, Audio, or Image</p>
              </div>
            </div>
          </div>

          {isUploading && (
            <div className="mt-4">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                      Uploading
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-indigo-600">
                      {progress}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                  <div
                    style={{ width: `${progress}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {uploadedUrl && (
            <div className="mt-4 space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
                Upload successful!
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Uploaded URL:
                </label>
                <input
                  type="text"
                  readOnly
                  value={uploadedUrl}
                  className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none bg-gray-50"
                />
              </div>
              {uploadedUrl.includes('video') && (
                <video
                  controls
                  className="w-full rounded-lg shadow-lg"
                  src={uploadedUrl}
                />
              )}
              {uploadedUrl.includes('audio') && (
                <audio
                  controls
                  className="w-full"
                  src={uploadedUrl}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
