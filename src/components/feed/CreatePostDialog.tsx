'use client';

import { useState } from 'react';
import { X, Upload, Image as ImageIcon, Music, Video } from 'lucide-react';

interface CreatePostDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePostDialog({ isOpen, onClose }: CreatePostDialogProps) {
  const [activeTab, setActiveTab] = useState<'audio' | 'video'>('audio');
  const [dragActive, setDragActive] = useState(false);
  const [postText, setPostText] = useState('');

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    // TODO: Gérer le fichier déposé
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-[18px] w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-[#2D2D2D]">Créer un post</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Post Content */}
        <div className="p-4">
          <textarea
            className="w-full min-h-[120px] resize-none text-[15px] placeholder-gray-500 focus:outline-none"
            placeholder="Que souhaitez-vous partager ?"
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'audio'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('audio')}
          >
            Audio
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'video'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('video')}
          >
            Vidéo
          </button>
        </div>

        {/* Upload Zone - Reduced size */}
        <div 
          className={`p-4 ${dragActive ? 'bg-gray-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="border-2 border-dashed border-gray-200 rounded-[18px] p-4">
            <div className="text-center">
              {activeTab === 'audio' ? (
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                  <Music className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
              )}
              <h3 className="text-base font-medium text-[#2D2D2D] mb-2">
                Glissez-déposez votre fichier ici
              </h3>
              <input
                type="file"
                className="hidden"
                accept={activeTab === 'audio' ? "audio/*" : "video/*"}
                onChange={(e) => {
                  // TODO: Gérer le fichier sélectionné
                }}
              />
              <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-[18px] text-sm font-medium transition-colors">
                Sélectionner un fichier
              </button>
              <p className="mt-2 text-xs text-gray-500">
                {activeTab === 'audio' 
                  ? 'Formats acceptés : MP3, WAV, AAC (max 100MB)'
                  : 'Formats acceptés : MP4, MOV (max 500MB)'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-100 flex justify-end space-x-3">
          <button 
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-[18px] transition-colors"
            onClick={onClose}
          >
            Annuler
          </button>
          <button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-[18px] text-sm font-medium transition-colors"
            disabled={!postText.trim() && activeTab === 'audio'}
          >
            Publier
          </button>
        </div>
      </div>
    </div>
  );
}
