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
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-[#2D2D2D]">Créer un post</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            className={`flex-1 py-4 text-sm font-medium ${
              activeTab === 'audio'
                ? 'text-[#FA4D4D] border-b-2 border-[#FA4D4D]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('audio')}
          >
            Audio
          </button>
          <button
            className={`flex-1 py-4 text-sm font-medium ${
              activeTab === 'video'
                ? 'text-[#FA4D4D] border-b-2 border-[#FA4D4D]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('video')}
          >
            Vidéo
          </button>
        </div>

        {/* Upload Zone */}
        <div 
          className={`p-8 ${dragActive ? 'bg-gray-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="border-2 border-dashed border-gray-200 rounded-[18px] p-8">
            <div className="text-center">
              {activeTab === 'audio' ? (
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#FA4D4D] bg-opacity-10 flex items-center justify-center">
                  <Music className="text-[#FA4D4D]" size={24} />
                </div>
              ) : (
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#FA4D4D] bg-opacity-10 flex items-center justify-center">
                  <Video className="text-[#FA4D4D]" size={24} />
                </div>
              )}
              <h3 className="text-lg font-medium text-[#2D2D2D] mb-2">
                Glissez-déposez votre fichier ici
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                ou cliquez pour sélectionner un fichier
              </p>
              <input
                type="file"
                className="hidden"
                accept={activeTab === 'audio' ? "audio/*" : "video/*"}
                onChange={(e) => {
                  // TODO: Gérer le fichier sélectionné
                }}
              />
              <button className="bg-[#FA4D4D] hover:bg-[#E63F3F] text-white px-6 py-2 rounded-[18px] text-sm font-medium transition-colors">
                Sélectionner un fichier
              </button>
              <p className="mt-4 text-xs text-gray-500">
                {activeTab === 'audio' 
                  ? 'Formats acceptés : MP3, WAV, AAC (max 100MB)'
                  : 'Formats acceptés : MP4, MOV (max 500MB)'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Fields - Apparaît après sélection du fichier */}
        <div className="hidden p-6 space-y-4 border-t border-gray-100">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#2D2D2D]">
              Titre
            </label>
            <input
              type="text"
              className="w-full h-12 px-4 rounded-[18px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#FA4D4D] focus:ring-1 focus:ring-[#FA4D4D]"
              placeholder="Donnez un titre à votre création"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#2D2D2D]">
              Description (optionnelle)
            </label>
            <textarea
              className="w-full h-24 px-4 py-3 rounded-[18px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#FA4D4D] focus:ring-1 focus:ring-[#FA4D4D] resize-none"
              placeholder="Décrivez votre création..."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#2D2D2D]">
              Genre musical
            </label>
            <select className="w-full h-12 px-4 rounded-[18px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#FA4D4D] focus:ring-1 focus:ring-[#FA4D4D]">
              <option value="">Sélectionnez un genre</option>
              <option value="rock">Rock</option>
              <option value="pop">Pop</option>
              <option value="hip-hop">Hip-Hop</option>
              <option value="electronic">Electronic</option>
              {/* TODO: Ajouter plus de genres */}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#2D2D2D]">
              Tags (optionnels)
            </label>
            <input
              type="text"
              className="w-full h-12 px-4 rounded-[18px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#FA4D4D] focus:ring-1 focus:ring-[#FA4D4D]"
              placeholder="Ajoutez des tags séparés par des virgules"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <select className="h-12 px-4 rounded-[18px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#FA4D4D] focus:ring-1 focus:ring-[#FA4D4D]">
              <option value="public">Public</option>
              <option value="private">Privé</option>
              <option value="followers">Abonnés uniquement</option>
            </select>
            <button className="bg-[#FA4D4D] hover:bg-[#E63F3F] text-white px-6 py-2 rounded-[18px] text-sm font-medium transition-colors">
              Publier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
