import { v2 as cloudinary } from 'cloudinary';

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log('✅ Cloudinary storage configured successfully.');
} else {
  console.log('ℹ️  Cloudinary credentials not provided in .env. Image service will use base64 data URLs / local fallback.');
}

export { cloudinary, isConfigured };
export default cloudinary;
