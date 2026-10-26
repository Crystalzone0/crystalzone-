import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import ProductImage from './ProductImage.jsx';
import useLockBodyScroll from '../../hooks/useLockBodyScroll.js';
import { cn } from '../../utils/cn.js';

function Lightbox({ images, index, onIndex, onClose, alt }) {
  const closeRef = useRef(null);
  const count = images.length;
  useLockBodyScroll(true);

  useEffect(() => {
    closeRef.current?.focus();

    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowRight') onIndex((i) => (i + 1) % count);
      else if (event.key === 'ArrowLeft') onIndex((i) => (i - 1 + count) % count);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [count, onClose, onIndex]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/95 p-4" role="dialog" aria-modal="true" aria-label="Product images">
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close full screen view"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
      >
        <X size={22} />
      </button>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => onIndex((i) => (i - 1 + count) % count)}
            aria-label="Previous image"
            className="absolute left-3 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 sm:left-6"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            onClick={() => onIndex((i) => (i + 1) % count)}
            aria-label="Next image"
            className="absolute right-3 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 sm:right-6"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      <ProductImage
        src={images[index]}
        alt={`${alt} - image ${index + 1} of ${count}`}
        width={1600}
        eager
        className="max-h-full max-w-full rounded-xl object-contain"
      />

      {count > 1 && (
        <p className="absolute bottom-5 text-xs tracking-widest text-white/70" aria-hidden="true">
          {index + 1} / {count}
        </p>
      )}
    </div>
  );
}

/** Main image with hover zoom (mouse devices), thumbnails, and a full screen viewer. Key it by product id. */
export default function ImageGallery({ images = [], alt }) {
  const list = images.length > 0 ? images : ['']; // '' shows the placeholder
  const count = list.length;

  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 });
  const [lightbox, setLightbox] = useState(false);
  const closeLightbox = useCallback(() => setLightbox(false), []);

  const canHover = () => window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

  const moveZoom = (event) => {
    if (!canHover()) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setZoom({
      on: true,
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-cream-dark">
        <button
          type="button"
          onClick={() => setLightbox(true)}
          onMouseMove={moveZoom}
          onMouseLeave={() => setZoom((z) => ({ ...z, on: false }))}
          aria-label="Open image full screen"
          className="block h-full w-full cursor-zoom-in overflow-hidden"
        >
          <ProductImage
            src={list[index]}
            alt={alt}
            width={1000}
            eager
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="h-full w-full object-cover transition-transform duration-200 ease-out"
            style={{ transform: zoom.on ? 'scale(2)' : 'scale(1)', transformOrigin: `${zoom.x}% ${zoom.y}%` }}
          />
        </button>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + count) % count)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-charcoal shadow-soft transition hover:bg-white"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % count)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-charcoal shadow-soft transition hover:bg-white"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {list.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
              className={cn(
                'h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-20 sm:w-20',
                i === index ? 'border-gold' : 'border-transparent opacity-70 hover:opacity-100'
              )}
            >
              <ProductImage src={url} alt="" width={160} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && <Lightbox images={list} index={index} onIndex={setIndex} onClose={closeLightbox} alt={alt} />}
    </div>
  );
}