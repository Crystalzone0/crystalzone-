import { useEffect, useState } from 'react';
import { PLACEHOLDER_IMAGE, getSrcSet, optimizeImage } from '../../utils/image.js';

/**
 * Lazy-loaded, resized image. Falls back to a placeholder when there is no photo or it fails to load.
 * Give the parent a fixed aspect ratio so the page does not jump while images load.
 */
export default function ProductImage({ src, alt = '', width = 600, sizes, eager = false, className, ...props }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const usePlaceholder = failed || !src;

  return (
    <img
      src={usePlaceholder ? PLACEHOLDER_IMAGE : optimizeImage(src, width)}
      srcSet={usePlaceholder ? undefined : getSrcSet(src)}
      sizes={usePlaceholder ? undefined : sizes}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
      {...props}
    />
  );
}