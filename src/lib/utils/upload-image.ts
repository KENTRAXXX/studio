/**
 * @fileOverview Universal utility for uploading images to Cloudinary.
 * Uses the unsigned upload API to avoid exposing secret keys on the client.
 */

/**
 * Uploads an image to Cloudinary using an unsigned upload preset.
 * @param file The image file to upload.
 * @returns The secure URL of the uploaded image.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'SomaDS';

  if (!cloudName) {
    throw new Error('Cloudinary configuration is missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in your environment.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary.');
  }

  const data = await response.json();
  return data.secure_url;
}
