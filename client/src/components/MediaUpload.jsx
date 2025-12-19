import React, { useState, useRef } from 'react';
import { ImagePlus, Film, Loader2, X, Play, FileWarning } from 'lucide-react';
import imageCompression from 'browser-image-compression';

/**
 * MediaUpload Component - Redesigned
 * Matches KBÜ Sosyal design language with polished UI & UX
 *
 * @param {Function} onMediaSelect - Callback when media is selected and compressed
 * @param {Array} selectedMedia - Currently selected media files
 * @param {Function} onRemoveMedia - Callback to remove a media file
 * @param {number} maxFiles - Maximum number of files allowed (default: 4)
 */
const MediaUpload = ({ onMediaSelect, selectedMedia = [], onRemoveMedia, maxFiles = 4 }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Compress image configuration
  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 1, // Max 1MB
      maxWidthOrHeight: 1920, // FHD
      useWebWorker: true,
      onProgress: (percent) => setProgress(percent)
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Compression error:', error);
      return file; 
    }
  };

  // Video validation
  const processVideo = async (file) => {
    return new Promise((resolve) => {
      // Limit: 15MB
      if (file.size > 15 * 1024 * 1024) {
        alert('Video çok büyük! Maksimum 15MB yükleyebilirsiniz.');
        resolve(null);
      } else {
        resolve(file);
      }
    });
  };

  // Handle File Selection
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (selectedMedia.length + files.length > maxFiles) {
      alert(`En fazla ${maxFiles} adet medya yükleyebilirsiniz.`);
      return;
    }

    setUploading(true);
    setProgress(0);

    const processedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = file.type.split('/')[0];

      try {
        if (fileType === 'image') {
          const compressed = await compressImage(file);
          processedFiles.push({
            file: compressed,
            preview: URL.createObjectURL(compressed),
            type: 'image',
            name: file.name
          });
        } else if (fileType === 'video') {
          const processed = await processVideo(file);
          if (processed) {
            processedFiles.push({
              file: processed,
              preview: URL.createObjectURL(processed),
              type: 'video',
              name: file.name
            });
          }
        }
      } catch (error) {
        console.error('File process error:', error);
      }
    }

    setUploading(false);
    setProgress(0);

    if (processedFiles.length > 0) {
      onMediaSelect(processedFiles);
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const canAddMore = selectedMedia.length < maxFiles;

  return (
    <div className="space-y-3 w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {/* --- 1. MEDIA PREVIEW GRID --- */}
      {selectedMedia.length > 0 && (
        <div className={`grid ${selectedMedia.length === 1 ? 'grid-cols-2' : 'grid-cols-3'} gap-3 animate-in fade-in slide-in-from-bottom-2`}>
          {selectedMedia.map((media, index) => (
            <div 
              key={index} 
              className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm"
            >
              {media.type === 'image' ? (
                <img
                  src={media.preview}
                  alt="Preview"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                  <video
                    src={media.preview}
                    className="w-full h-full object-cover opacity-80"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/40">
                       <Play size={14} className="text-white ml-0.5" fill="currentColor" />
                     </div>
                  </div>
                </div>
              )}

              {/* Remove Button */}
              <button
                onClick={() => onRemoveMedia(index)}
                className="absolute top-1.5 right-1.5 bg-black/50 hover:bg-red-600 text-white rounded-full p-1.5 backdrop-blur-md transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110"
              >
                <X size={14} strokeWidth={2.5} />
              </button>

              {/* File Info Badge */}
              <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-md flex items-center gap-1">
                <span className="text-[10px] font-bold text-white tracking-wide uppercase">
                  {media.type === 'video' ? 'VIDEO' : 'IMG'}
                </span>
                <span className="text-[10px] text-gray-300 border-l border-white/20 pl-1">
                  {(media.file?.size / 1024 / 1024).toFixed(1)}MB
                </span>
              </div>
            </div>
          ))}
          
          {/* Add More Button (Small version inside grid) */}
          {canAddMore && !uploading && selectedMedia.length > 0 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 bg-gray-50 hover:bg-blue-50 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-600 transition-all duration-200 group"
            >
              <div className="p-2 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                <ImagePlus size={20} />
              </div>
              <span className="text-xs font-bold">Ekle</span>
            </button>
          )}
        </div>
      )}

      {/* --- 2. MAIN UPLOAD TRIGGER (If no media selected) --- */}
      {selectedMedia.length === 0 && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full relative group overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl bg-gray-50 hover:bg-blue-50/30 transition-all duration-300 p-8 flex flex-col items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {uploading ? (
            /* Uploading State */
            <div className="flex flex-col items-center gap-3 w-full max-w-[200px]">
              <Loader2 size={32} className="text-blue-600 animate-spin" />
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-medium text-blue-600 animate-pulse">
                Medya işleniyor... %{progress.toFixed(0)}
              </span>
            </div>
          ) : (
            /* Idle State */
            <>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <ImagePlus size={24} />
                </div>
                <div className="p-3 bg-red-100 text-red-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 delay-75">
                  <Film size={24} />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                  Fotoğraf veya Video Yükle
                </h3>
                <p className="text-xs text-gray-500 mt-1 group-hover:text-blue-600/70 transition-colors">
                  Bilgisayardan seçmek için tıkla
                </p>
              </div>
            </>
          )}
        </button>
      )}

      {/* --- 3. FOOTER INFO --- */}
      <div className="flex items-center justify-between px-2">
         <div className="flex items-center gap-1.5">
           <FileWarning size={12} className="text-gray-400" />
           <span className="text-[10px] text-gray-400 font-medium">
             Maksimum: 4 dosya
           </span>
         </div>
         <span className="text-[10px] text-gray-400">
           {selectedMedia.length} / {maxFiles} kullanıldı
         </span>
      </div>
    </div>
  );
};

export default MediaUpload;