// Shown when a product has no photo yet (or a photo fails to load). An inline SVG, so it needs no request.
const PLACEHOLDER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">' +
  '<rect width="400" height="500" fill="#EDE6D9"/>' +
  '<g fill="none" stroke="#D4AF37" stroke-width="3" stroke-linejoin="round" opacity="0.85">' +
  '<path d="M140 220 L170 185 H230 L260 220 L200 320 Z"/>' +
  '<path d="M140 220 H260 M170 185 L188 220 M230 185 L212 220 M200 185 L188 220 M200 185 L212 220 M188 220 L200 320 M212 220 L200 320"/>' +
  '</g></svg>';

export const PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(PLACEHOLDER_SVG)}`;

const isCloudinary = (url) => typeof url === 'string' && url.includes('res.cloudinary.com') && url.includes('/upload/');

/** Cloudinary images are resized and converted to WebP/AVIF on the fly. Other URLs are left untouched. */
export function optimizeImage(url, width = 600) {
  if (!url) return PLACEHOLDER_IMAGE;
  if (isCloudinary(url) && !url.includes('/upload/f_auto')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${width}/`);
  }
  return url;
}

/** srcset for responsive images (Cloudinary only). */
export function getSrcSet(url, widths = [320, 480, 640, 800, 1000]) {
  if (!isCloudinary(url)) return undefined;
  return widths.map((w) => `${optimizeImage(url, w)} ${w}w`).join(', ');
}

/** Product image URLs with the primary image first. */
export function orderedImages(product) {
  const urls = (product.images || []).map((img) => img.url).filter(Boolean);
  if (product.primaryImage && urls.includes(product.primaryImage)) {
    return [product.primaryImage, ...urls.filter((u) => u !== product.primaryImage)];
  }
  return urls;
}

export const absoluteUrl = (value) => (/^https?:\/\//i.test(value) ? value : `${window.location.origin}${value}`);