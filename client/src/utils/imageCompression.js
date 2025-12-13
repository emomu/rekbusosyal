/**
 * Resmi sıkıştırır ve optimize eder
 * @param {File} file - Sıkıştırılacak resim dosyası
 * @param {Object} options - Sıkıştırma seçenekleri
 * @returns {Promise<File>} - Sıkıştırılmış resim dosyası
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    outputType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Canvas oluştur
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Orijinal boyutları al
        let width = img.width;
        let height = img.height;

        // Boyut sınırlaması uygula (en-boy oranını koru)
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        // Canvas boyutlarını ayarla
        canvas.width = width;
        canvas.height = height;

        // Resmi canvas'a çiz
        ctx.drawImage(img, 0, 0, width, height);

        // Canvas'ı blob'a dönüştür
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Resim sıkıştırılamadı'));
              return;
            }

            // Blob'u File'a dönüştür
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '.jpg'), // Uzantıyı .jpg yap
              {
                type: outputType,
                lastModified: Date.now()
              }
            );

            resolve(compressedFile);
          },
          outputType,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Resim yüklenemedi'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Dosya okunamadı'));
    };

    reader.readAsDataURL(file);
  });
};
