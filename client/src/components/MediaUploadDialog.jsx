import React, { useState, useRef } from 'react';
import { ImagePlus, Film, FileImage, X, Loader2, AlertCircle, Check, UploadCloud } from 'lucide-react';
import imageCompression from 'browser-image-compression';

/**
 * MediaUploadDialog - Redesigned
 * Matches KBÜ Sosyal design language (Blue/Red/Gray palette)
 * * @param {boolean} isOpen - Dialog visibility
 * @param {function} onClose - Close handler
 * @param {string} type - 'image' | 'gif' | 'video'
 * @param {function} onMediaSelect - Data return handler
 */
const MediaUploadDialog = ({ isOpen, onClose, type, onMediaSelect }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewFiles, setPreviewFiles] = useState([]);

  if (!isOpen) return null;

  // Configuration based on media type
  const getConfig = () => {
    switch (type) {
      case 'image':
        return {
          title: 'Fotoğraf Yükle',
          subtitle: 'Anılarını paylaş',
          accept: 'image/jpeg,image/jpg,image/png,image/webp',
          maxFiles: 4,
          maxSize: 5 * 1024 * 1024,
          icon: ImagePlus,
          description: 'PNG, JPG veya WEBP (Maks. 4 adet)'
        };
      case 'gif':
        return {
          title: 'GIF Yükle',
          subtitle: 'Hareketli görsel ekle',
          accept: 'image/gif',
          maxFiles: 1,
          maxSize: 10 * 1024 * 1024,
          icon: FileImage,
          description: 'GIF (Maks. 10MB)'
        };
      case 'video':
        return {
          title: 'Video Yükle',
          subtitle: 'Kısa video paylaş',
          accept: 'video/mp4,video/webm',
          maxFiles: 1,
          maxSize: 15 * 1024 * 1024,
          icon: Film,
          description: 'MP4 veya WebM (Maks. 15MB)'
        };
      default:
        return {};
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  // Compression Logic
  const compressImage = async (file) => {
    if (type === 'gif') return file;
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      onProgress: (p) => setProgress(p)
    };
    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error(error);
      return file;
    }
  };

  // Handle File Selection
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (previewFiles.length + files.length > config.maxFiles) {
      // Simple visual alert logic could replace this standard alert
      alert(`Maksimum ${config.maxFiles} adet dosya yükleyebilirsiniz.`);
      return;
    }

    setUploading(true);
    setProgress(0);

    const processedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > config.maxSize) {
        alert(`${file.name} çok büyük!`);
        continue;
      }

      try {
        let finalFile = file;
        if (type === 'image') {
          finalFile = await compressImage(file);
        }

        processedFiles.push({
          file: finalFile,
          preview: URL.createObjectURL(finalFile),
          type: type,
          name: file.name
        });
      } catch (error) {
        console.error(error);
      }
    }

    setUploading(false);
    setProgress(0);
    setPreviewFiles([...previewFiles, ...processedFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = (index) => {
    setPreviewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    onMediaSelect(previewFiles);
    setPreviewFiles([]);
    onClose();
  };

  const handleCancel = () => {
    setPreviewFiles([]);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-blue-900/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col animate-in slide-in-from-bottom-4 zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 text-blue-900">
                <Icon size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-none">{config.title}</h2>
                <span className="text-xs text-gray-500 font-medium">{config.subtitle}</span>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* 2. Content Area */}
          <div className="p-6 overflow-y-auto">
            
            {/* Warning / Info Banner */}
            <div className="flex items-start gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl mb-5 text-sm">
               <AlertCircle size={16} className="text-blue-600 mt-0.5 shrink-0" />
               <div className="text-blue-900/80 font-medium">
                  {config.description}
                  {type === 'image' && <div className="text-xs text-blue-600/70 mt-0.5">Otomatik optimizasyon aktif.</div>}
               </div>
            </div>

            {/* Preview Grid */}
            {previewFiles.length > 0 && (
              <div className={`grid gap-3 mb-5 animate-in fade-in slide-in-from-bottom-2 ${type === 'image' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {previewFiles.map((media, index) => (
                  <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm aspect-video">
                    {type === 'video' ? (
                      <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                        <video src={media.preview} className="w-full h-full object-cover opacity-80" />
                        <Film className="absolute text-white/50" size={32} />
                      </div>
                    ) : (
                      <img
                        src={media.preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemove(index)}
                      className="absolute top-2 right-2 bg-black/50 hover:bg-red-600 text-white rounded-full p-1.5 backdrop-blur-md transition-all hover:scale-110"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                    
                    {/* Size Badge */}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-md text-[10px] text-white font-medium">
                       {(media.file.size / 1024 / 1024).toFixed(1)} MB
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Trigger */}
            {previewFiles.length < config.maxFiles && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={config.accept}
                  multiple={type === 'image'}
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={`w-full group relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
                    uploading 
                      ? 'border-blue-200 bg-blue-50/50 cursor-wait' 
                      : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50/30 cursor-pointer'
                  }`}
                >
                   {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                         <Loader2 className="animate-spin text-blue-600" size={32} />
                         <span className="text-sm font-bold text-blue-900">İşleniyor... %{progress.toFixed(0)}</span>
                         <div className="w-32 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-blue-600 transition-all duration-200" style={{ width: `${progress}%` }}></div>
                         </div>
                      </div>
                   ) : (
                      <>
                        <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300 text-gray-400 group-hover:text-blue-600">
                           <UploadCloud size={28} />
                        </div>
                        <div className="text-center">
                           <span className="block text-sm font-bold text-gray-900 group-hover:text-blue-700">Dosya Seçmek İçin Tıkla</span>
                           <span className="block text-xs text-gray-500 mt-1">
                              {previewFiles.length > 0 ? 'Daha fazla ekle' : 'Henüz dosya seçilmedi'}
                           </span>
                        </div>
                      </>
                   )}
                </button>
              </>
            )}
          </div>

          {/* 3. Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-white hover:text-gray-900 hover:border-gray-300 transition-all text-sm"
            >
              Vazgeç
            </button>
            <button
              onClick={handleConfirm}
              disabled={previewFiles.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-900 text-white font-bold hover:bg-blue-800 transition-all text-sm shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <Check size={16} strokeWidth={3} />
              Onayla ve Ekle
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MediaUploadDialog;