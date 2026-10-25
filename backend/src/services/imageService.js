import cloudinary from '../config/cloudinary.js';
import { env } from '../config/env.js';
import AppError from '../utils/AppError.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

function assertConfigured() {
  if (!env.cloudinaryConfigured) {
    throw new AppError(
      'Image storage is not configured. Add your Cloudinary keys to the .env file (see README), then restart the server.',
      503
    );
  }
}

/** Checks the file's real signature: JPEG, PNG or WebP (the declared mimetype can be faked). */
function isRealImage(buffer) {
  if (!buffer || buffer.length < 12) return false;
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const png =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;
  const webp =
    buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return jpeg || png || webp;
}

function uploadBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: env.CLOUDINARY_FOLDER,
        resource_type: 'image',
        // Stored version is capped at 2000px so huge camera photos do not waste storage.
        transformation: [{ width: 2000, height: 2000, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
}

async function destroy(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
    return true;
  } catch (err) {
    // Never fail a request because a cleanup call failed; the database change already succeeded.
    console.error(`Could not delete Cloudinary image "${publicId}":`, err.message);
    return false;
  }
}

/** Only images inside our own Cloudinary folder may be deleted by the API. */
export const isManagedPublicId = (publicId) =>
  env.cloudinaryConfigured &&
  typeof publicId === 'string' &&
  publicId.startsWith(`${env.CLOUDINARY_FOLDER}/`);

/**
 * Uploads multer files to Cloudinary.
 * Returns [{ url, publicId }] in the same order as the files.
 * If any upload fails, the ones that succeeded are removed again (all or nothing).
 */
export async function uploadImageFiles(files) {
  assertConfigured();

  for (const file of files) {
    if (!isRealImage(file.buffer)) {
      const name = String(file.originalname || 'file').slice(0, 60);
      throw new AppError(`"${name}" is not a valid JPG, PNG or WebP image`, 400);
    }
  }

  const settled = await Promise.allSettled(files.map((file) => uploadBuffer(file.buffer)));
  const uploaded = settled.filter((s) => s.status === 'fulfilled').map((s) => s.value);
  const failed = settled.find((s) => s.status === 'rejected');

  if (failed) {
    await Promise.all(uploaded.map((r) => destroy(r.public_id)));
    console.error('Cloudinary upload failed:', failed.reason?.message || failed.reason);
    throw new AppError(
      'Image upload failed. Please check your Cloudinary keys in .env and try again.',
      502
    );
  }

  return uploaded.map((r) => ({ url: r.secure_url, publicId: r.public_id }));
}

/**
 * Deletes images from Cloudinary, but only those that
 *   1) live in our managed folder, and
 *   2) are no longer referenced by any product or category.
 * Call it AFTER the database change has been saved. Returns how many were deleted.
 */
export async function releaseUnusedImages(publicIds = []) {
  const ids = [...new Set(publicIds.filter(isManagedPublicId))];
  if (ids.length === 0) return 0;

  const results = await Promise.all(
    ids.map(async (publicId) => {
      const [inProduct, inCategory] = await Promise.all([
        Product.exists({ 'images.publicId': publicId }),
        Category.exists({ 'image.publicId': publicId }),
      ]);
      if (inProduct || inCategory) return false;
      return destroy(publicId);
    })
  );

  return results.filter(Boolean).length;
}