import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Alert from '../../ui/Alert.jsx';
import Spinner from '../../ui/Spinner.jsx';
import ProductImage from '../../product/ProductImage.jsx';
import * as adminApi from '../../../services/adminApi.js';
import { getErrorMessage } from '../../../services/api.js';
import { cn } from '../../../utils/cn.js';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // same limits as the server
const MAX_IMAGES = 10;
const BATCH = 8; // the server accepts up to 8 files per request

const tileButton =
  'flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-charcoal shadow-soft transition hover:bg-white hover:text-gold-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-charcoal';

/**
 * Upload, preview, reorder, set primary and delete product images.
 * `media` is { images: [{ url, publicId }], primary: url }. `uploadedRef` is a Set of the Cloudinary ids
 * uploaded during this editing session (so removed or abandoned uploads can be cleaned up).
 */
export default function ImageManager({ media, onChange, uploadedRef, error }) {
  const { images, primary } = media;
  const inputRef = useRef(null);
  const mediaRef = useRef(media);
  mediaRef.current = media;

  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [dragIndex, setDragIndex] = useState(null);
  const [fileDrag, setFileDrag] = useState(false);

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setUploadError('');

    const room = MAX_IMAGES - mediaRef.current.images.length;
    if (room <= 0) {
      setUploadError(`A product can have at most ${MAX_IMAGES} images.`);
      return;
    }

    const problems = [];
    const valid = [];
    for (const file of files) {
      if (!ALLOWED.includes(file.type)) problems.push(`"${file.name}" is not a JPG, PNG or WebP image`);
      else if (file.size > MAX_BYTES) problems.push(`"${file.name}" is larger than 5 MB`);
      else valid.push(file);
    }
    if (valid.length > room) problems.push(`Only ${room} more image${room === 1 ? '' : 's'} can be added (limit ${MAX_IMAGES})`);
    if (problems.length > 0) setUploadError(`${problems.join('. ')}.`);

    const chosen = valid.slice(0, room);
    if (chosen.length === 0) return;

    setUploading(chosen.length);
    let added = 0;
    try {
      for (let i = 0; i < chosen.length; i += BATCH) {
        // eslint-disable-next-line no-await-in-loop
        const data = await adminApi.uploadImages(chosen.slice(i, i + BATCH));
        data.images.forEach((img) => uploadedRef.current.add(img.publicId));

        const current = mediaRef.current;
        const next = { images: [...current.images, ...data.images], primary: current.primary };
        if (!next.primary) next.primary = next.images[0]?.url || '';
        mediaRef.current = next; // the next batch must build on this one before React re-renders
        onChange(next);
        added += data.images.length;
      }
      toast.success(added === 1 ? 'Image uploaded' : `${added} images uploaded`);
    } catch (err) {
      setUploadError(getErrorMessage(err));
      if (added > 0) toast.success(added === 1 ? 'Image uploaded' : `${added} images uploaded`);
    } finally {
      setUploading(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const move = (from, to) => {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange({ images: next, primary });
  };

  const remove = (index) => {
    const removed = images[index];
    const next = images.filter((_, i) => i !== index);
    onChange({ images: next, primary: removed.url === primary ? next[0]?.url || '' : primary });

    // An image uploaded in this session and never saved can be deleted from storage right away.
    if (removed.publicId && uploadedRef.current.has(removed.publicId)) {
      uploadedRef.current.delete(removed.publicId);
      adminApi.deleteUploadedImage(removed.publicId).catch(() => {});
    }
  };

  const busy = uploading > 0;

  return (
    <div>
      <div
        onDragOver={(e) => {
          if (e.dataTransfer?.types?.includes('Files')) {
            e.preventDefault();
            setFileDrag(true);
          }
        }}
        onDragLeave={() => setFileDrag(false)}
        onDrop={(e) => {
          setFileDrag(false);
          if (e.dataTransfer?.files?.length) {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }
        }}
        className={cn(
          'rounded-2xl border-2 border-dashed p-4 transition',
          fileDrag ? 'border-gold bg-gold/10' : 'border-charcoal/20',
          error && 'border-red-400'
        )}
      >
        {images.length === 0 && !busy ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 py-8 text-center text-sm text-charcoal/70 transition hover:text-gold-dark"
          >
            <ImagePlus size={30} aria-hidden="true" />
            <span className="font-medium">Click to upload, or drop images here</span>
            <span className="text-xs text-charcoal/50">JPG, PNG or WebP, up to 5 MB each</span>
          </button>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((image, i) => {
              const isPrimary = image.url === primary;
              return (
                <li
                  key={image.url}
                  draggable
                  onDragStart={(e) => {
                    setDragIndex(i);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', String(i)); // Firefox needs data to start a drag
                  }}
                  onDragOver={(e) => {
                    if (dragIndex !== null) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    if (dragIndex === null) return; // a file drop: the container handles it
                    e.preventDefault();
                    e.stopPropagation();
                    move(dragIndex, i);
                    setDragIndex(null);
                  }}
                  onDragEnd={() => setDragIndex(null)}
                  className={cn(
                    'group relative aspect-square cursor-grab overflow-hidden rounded-xl border-2 bg-cream-dark',
                    isPrimary ? 'border-gold' : 'border-transparent',
                    dragIndex === i && 'opacity-40'
                  )}
                >
                  <ProductImage src={image.url} alt={`Product image ${i + 1}`} width={300} className="h-full w-full object-cover" draggable={false} />

                  {isPrimary && (
                    <span className="absolute left-2 top-2 rounded-full bg-gold px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink">
                      Primary
                    </span>
                  )}

                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-ink/70 to-transparent p-2 pt-6">
                    <button
                      type="button"
                      className={tileButton}
                      onClick={() => onChange({ images, primary: image.url })}
                      disabled={isPrimary}
                      aria-label={isPrimary ? `Image ${i + 1} is the primary image` : `Set image ${i + 1} as primary`}
                    >
                      <Star size={15} className={isPrimary ? 'fill-gold text-gold' : undefined} />
                    </button>
                    <button type="button" className={tileButton} onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move image ${i + 1} earlier`}>
                      <ArrowLeft size={15} />
                    </button>
                    <button
                      type="button"
                      className={tileButton}
                      onClick={() => move(i, i + 1)}
                      disabled={i === images.length - 1}
                      aria-label={`Move image ${i + 1} later`}
                    >
                      <ArrowRight size={15} />
                    </button>
                    <button type="button" className={cn(tileButton, 'hover:text-red-700')} onClick={() => remove(i)} aria-label={`Delete image ${i + 1}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              );
            })}

            {Array.from({ length: uploading }, (_, i) => (
              <li key={`uploading-${i}`} className="skeleton flex aspect-square items-center justify-center text-gold-dark" aria-label="Uploading image">
                <Spinner className="h-6 w-6" label="Uploading" />
              </li>
            ))}

            {images.length + uploading < MAX_IMAGES && (
              <li>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={busy}
                  className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-charcoal/20 text-xs text-charcoal/60 transition hover:border-gold hover:text-gold-dark disabled:opacity-50"
                >
                  <ImagePlus size={22} aria-hidden="true" />
                  Add images
                </button>
              </li>
            )}
          </ul>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-label="Choose product images"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <p className="mt-2 text-xs text-charcoal/60">
        The primary image (gold border) is shown first in the store and on product cards. Drag images or use the arrows to reorder
        them. {images.length}/{MAX_IMAGES} images.
      </p>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {uploadError && (
        <Alert className="mt-3">
          <p>{uploadError}</p>
        </Alert>
      )}
    </div>
  );
}