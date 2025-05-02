'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { Challenge } from '../actions/challenges';
import { getChallenges, createChallenge } from '../actions/challenges';
import { useSession } from '@/components/providers/SessionProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { Button } from '@/components/ui/button';

type ChallengeType = 'remix' | 'live_mix';

// interface FormData {
//   title: string;
//   description: string;
//   type: ChallengeType;
//   endAt: string;
//   winningPrize: string;
// }

export default function ChallengePage() {
  const { profile, user } = useSession();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [status, setStatus] = useState<'active' | 'completed' | 'all'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  // const [uploadedFiles, setUploadedFiles] = useState<Array<{
  //   url: string;
  //   publicId: string;
  //   mediaType: 'audio' | 'video';
  //   duration?: number;
  // }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'creating' | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'remix' as ChallengeType,
    endAt: '',
    winningPrize: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadToCloudinary,  progress } = useCloudinaryUpload();

  const loadChallenges = useCallback(async (isInitial: boolean = true) => {
    try {
      if (isInitial) {
        setLoading(true);
        setError(null);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      const result = await getChallenges(isInitial ? 1 : page, 10, status);
      
      if (result.error) {
        throw new Error(result.error);
      }

      const newChallenges = result.challenges || [];

      if (isInitial) {
        setChallenges(newChallenges);
      } else {
        setChallenges(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const uniqueNewChallenges = newChallenges.filter(challenge => !existingIds.has(challenge.id));
          return [...prev, ...uniqueNewChallenges];
        });
      }

      setHasMore(newChallenges.length === 10);
      if (!isInitial && newChallenges.length === 10) {
        setPage(prev => prev + 1);
      }
    } catch (err) {
      console.error('❌ Error loading challenges:', err);
      setError('Failed to load challenges. Please try again later.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, status]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  // Function to handle infinite scroll
  const handleScroll = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight - 800;

    if (scrollPosition > threshold) {
      loadChallenges(false);
    }
  }, [loading, loadingMore, hasMore, loadChallenges]);

  // Add scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleStatusChange = (newStatus: 'active' | 'completed' | 'all') => {
    setStatus(newStatus);
    setPage(1);
    setChallenges([]);
    loadChallenges(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Challenges</h1>
          {profile?.is_admin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Create Challenge</span>
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleStatusChange('all')}
            className={`px-4 py-2 rounded-lg ${
              status === 'all'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleStatusChange('active')}
            className={`px-4 py-2 rounded-lg ${
              status === 'active'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => handleStatusChange('completed')}
            className={`px-4 py-2 rounded-lg ${
              status === 'completed'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Completed
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg mt-4">
          {error}
        </div>
      )}

      {loading && !challenges.length ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse flex justify-between items-center">
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="flex gap-2">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-start">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">{challenge.title}</h2>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    challenge.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : challenge.status === 'completed'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {challenge.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2">{challenge.description || 'No description available'}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500">Type: {challenge.type || 'General'}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                    <span className="text-gray-500">Created by John Doe</span>
                  </div>
                </div>
              </div>
              <Link 
                href={`/feed/challenge/${challenge.id}`}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                View
              </Link>
            </div>
          ))}
        </div>
      )}
      
      {loadingMore && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse flex justify-between items-start">
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="flex gap-2">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      )}

      {!hasMore && challenges.length > 0 && (
        <div className="text-center text-gray-500 mt-8">
          No more challenges to load
        </div>
      )}
      {/* Modal de création de challenge */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Challenge</DialogTitle>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!user || selectedFiles.length === 0) {
              setUploadError('Please fill in all required fields and select at least one media file');
              return;
            }

            try {
              setIsSubmitting(true);
              setCurrentStep('upload');

              // Upload all media files to Cloudinary
              const mediaUploads = await Promise.all(
                selectedFiles.map(async file => {
                  const mediaType = file.type.startsWith('audio/') ? 'audio' as const : 'video' as const;
                  const upload = await uploadToCloudinary(file, mediaType);
                  return {
                    url: upload.url,
                    publicId: upload.publicId,
                    duration: upload.duration,
                    mediaType
                  };
                })
              );

              setCurrentStep('creating');

              // Create challenge with uploaded media
              const result = await createChallenge({
                title: formData.title.trim(),
                description: formData.description.trim(),
                type: formData.type,
                endAt: formData.endAt,
                winningPrize: formData.winningPrize.trim() || undefined,
                userId: user.id,
                medias: mediaUploads.map(upload => ({
                  url: upload.url,
                  publicId: upload.publicId,
                  mediaType: upload.mediaType,
                  duration: upload.duration
                }))
              });

              if (!result.success) {
                let errorMessage = result.error || 'Failed to create challenge';
                
                // Add database error details if available
                if (result.details) {
                  const details = result.details as { code?: string; hint?: string; details?: string };
                  if (details.code) errorMessage += `\nCode: ${details.code}`;
                  if (details.hint) errorMessage += `\nHint: ${details.hint}`;
                  if (details.details) errorMessage += `\nDetails: ${details.details}`;
                }
                
                setUploadError(errorMessage);
                return;
              }

              // Reset form
              setFormData({
                title: '',
                description: '',
                type: 'remix' as ChallengeType,
                endAt: '',
                winningPrize: ''
              });
              setSelectedFiles([]);
              setUploadError(null);
              
              // Close dialog and refresh list
              setIsCreateModalOpen(false);
              loadChallenges(true);
            } catch (error) {
              console.error('Error creating challenge:', error);
              setUploadError('Failed to create challenge. Please try again.');
            } finally {
              setIsSubmitting(false);
              setCurrentStep(null);
            }
          }} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  placeholder="Challenge title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  rows={3}
                  placeholder="Challenge description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ChallengeType }))}
                  required
                >
                  <option value="remix">Remix</option>
                  <option value="live_mix">Live Mix</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  value={formData.endAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, endAt: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prize</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  placeholder="Optional prize description"
                  value={formData.winningPrize}
                  onChange={(e) => setFormData(prev => ({ ...prev, winningPrize: e.target.value }))}
                />
              </div>
            </div>

            {/* Media Upload Section */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Media Files</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  
                  const files = Array.from(e.dataTransfer.files);
                  const validFiles = files.filter(file => 
                    file.type.startsWith('audio/') || file.type.startsWith('video/')
                  );
                  
                  if (validFiles.length === 0) {
                    setUploadError('Please upload only audio or video files');
                    return;
                  }
                  
                  if (validFiles.length > 0) {
                    setSelectedFiles(prev => [...prev, ...validFiles]);
                    setUploadError(null);
                  }
                }}
                className={`
                  relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer
                  ${isDragging 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300 hover:border-red-500/50'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const validFiles = files.filter(file => 
                      file.type.startsWith('audio/') || file.type.startsWith('video/')
                    );
                    
                    if (validFiles.length === 0) {
                      setUploadError('Please upload only audio or video files');
                      return;
                    }

                    setSelectedFiles(prev => [...prev, ...validFiles]);
                    setUploadError(null);
                  }}
                  accept="audio/*,video/*"
                  multiple
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                  <Upload className="w-8 h-8" />
                  <p className="text-sm font-medium">
                    Drag and drop your audio or video files here, or click to select
                  </p>
                  <p className="text-xs text-gray-400">
                    Supported formats: MP3, WAV, AAC, MP4, WebM, MOV (max 100MB)
                  </p>
                </div>
              </div>

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {file.type.startsWith('audio/') ? 'Audio' : 'Video'} • {(file.size / (1024 * 1024)).toFixed(2)}MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                          setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {uploadError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-1">Error creating challenge:</p>
                  <pre className="text-xs text-red-600 whitespace-pre-wrap font-mono">{uploadError}</pre>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedFiles.length || isSubmitting}
              >
                Create Challenge
              </Button>
            </DialogFooter>
            {isSubmitting ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-red-500/20">
                    <div 
                      className="w-16 h-16 rounded-full border-4 border-red-500 border-t-transparent animate-spin absolute top-0 left-0"
                    />
                  </div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    {currentStep === 'upload' ? (
                      <Upload className="w-6 h-6 text-red-500 animate-pulse" />
                    ) : (
                      <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                    )}
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium text-gray-900">
                    {currentStep === 'upload' ? 'Uploading your media...' : 'Creating your challenge...'}
                  </p>
                  {currentStep === 'upload' && (
                    <>
                      <p className="text-sm text-gray-500">
                        {progress}% complete
                      </p>
                      <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
