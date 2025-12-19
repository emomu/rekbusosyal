const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

/**
 * Upload media (image/video) to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} fileType - 'image' or 'video'
 * @returns {Promise<{url: string, publicId: string, type: string}>}
 */
async function uploadMediaToCloudinary(fileBuffer, fileType) {
  return new Promise((resolve, reject) => {
    const resourceType = fileType === 'video' ? 'video' : 'image';

    const uploadOptions = {
      resource_type: resourceType,
      folder: 'kbu-sosyal/media',
      transformation: resourceType === 'image' ? [
        { width: 1920, height: 1920, crop: 'limit' }, // Max dimensions
        { quality: 'auto:good' }, // Auto quality optimization
        { fetch_format: 'auto' } // Auto format (WebP if supported)
      ] : [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            type: fileType
          });
        }
      }
    );

    // Convert buffer to stream and upload
    const bufferStream = Readable.from(fileBuffer);
    bufferStream.pipe(uploadStream);
  });
}

/**
 * Delete media from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - 'image' or 'video'
 */
async function deleteMediaFromCloudinary(publicId, resourceType = 'image') {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log(`✅ Media deleted from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error(`⚠️ Failed to delete media from Cloudinary: ${publicId}`, error);
  }
}

module.exports = {
  uploadMediaToCloudinary,
  deleteMediaFromCloudinary
};
