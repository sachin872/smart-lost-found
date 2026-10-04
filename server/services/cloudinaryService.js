import { cloudinary, isConfigured } from '../config/cloudinary.js';

/**
 * Upload single image buffer or base64 string
 */
export async function uploadImage(fileBuffer, mimetype = 'image/jpeg', originalName = 'item') {
  if (isConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'smart_lost_found',
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  // Graceful fallback for local development without Cloudinary credentials:
  // Convert buffer directly into optimized base64 data URL
  const base64Data = fileBuffer.toString('base64');
  return `data:${mimetype};base64,${base64Data}`;
}

/**
 * Upload multiple files to Cloudinary/storage
 */
export async function uploadMultipleImages(files = []) {
  if (!files || files.length === 0) return [];

  const uploadPromises = files.map((file) =>
    uploadImage(file.buffer, file.mimetype, file.originalname)
  );

  return await Promise.all(uploadPromises);
}
