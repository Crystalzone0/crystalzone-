import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Seo from '../../components/common/Seo.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import ListSkeleton from '../../components/admin/ListSkeleton.jsx';
import PageHeader from '../../components/admin/PageHeader.jsx';
import ProductImage from '../../components/product/ProductImage.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import TextField from '../../components/ui/TextField.jsx';
import * as adminApi from '../../services/adminApi.js';
import { fieldErrors, getErrorMessage } from '../../services/api.js';
import { focusFirstInvalid } from '../../utils/address.js';
import { invalidateProductCaches } from '../../utils/admin.js';
import { ROUTES } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

function CategoryForm({ category, onDone }) {
  const isEdit = Boolean(category);
  const queryClient = useQueryClient();
  const inputRef = useRef(null);
  const uploadedRef = useRef(new Set()); // Cloudinary ids uploaded during this session
  const savedRef = useRef(false);

  const [values, setValues] = useState({
    name: category?.name ?? '',
    description: category?.description ?? '',
    isActive: category ? category.isActive : true,
  });
  const [image, setImage] = useState(
    category?.image?.url ? { url: category.image.url, publicId: category.image.publicId || '' } : null
  );
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // If the dialog closes without saving, uploads made in this session are no longer needed.
  useEffect(
    () => () => {
      if (savedRef.current) return;
      for (const publicId of uploadedRef.current) adminApi.deleteUploadedImage(publicId).catch(() => {});
    },
    []
  );

  const discardSessionUpload = (img) => {
    if (img?.publicId && uploadedRef.current.has(img.publicId)) {
      uploadedRef.current.delete(img.publicId);
      adminApi.deleteUploadedImage(img.publicId).catch(() => {});
    }
  };

  const pickFile = async (fileList) => {
    const file = fileList?.[0];
    if (!file) return;
    setUploadError('');

    if (!ALLOWED.includes(file.type)) {
      setUploadError('Please choose a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError('The image must be 5 MB or smaller.');
      return;
    }

    setUploading(true);
    try {
      const data = await adminApi.uploadImages([file]);
      const uploaded = data.images[0];
      uploadedRef.current.add(uploaded.publicId);
      discardSessionUpload(image); // replaced an earlier unsaved upload
      setImage(uploaded);
    } catch (err) {
      setUploadError(getErrorMessage(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onText = (event) => {
    const { name, value } = event.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (saving || uploading) return;

    const found = {};
    const name = values.name.trim();
    if (name.length < 2) found.name = 'Category name must be at least 2 characters';
    else if (name.length > 60) found.name = 'Category name must be at most 60 characters';
    if (values.description.length > 500) found.description = 'Description must be at most 500 characters';
    setErrors(found);
    setSubmitError('');
    if (Object.keys(found).length > 0) {
      focusFirstInvalid();
      return;
    }

    const payload = {
      name,
      description: values.description.trim(),
      image: image ? { url: image.url, publicId: image.publicId } : null,
      isActive: values.isActive,
    };

    setSaving(true);
    try {
      if (isEdit) await adminApi.updateCategory(category.id, payload);
      else await adminApi.createCategory(payload);

      savedRef.current = true;
      uploadedRef.current.clear();
      invalidateProductCaches(queryClient);
      toast.success(isEdit ? 'Category updated' : 'Category created');
      onDone();
    } catch (err) {
      setSaving(false);
      const mapped = fieldErrors(err);
      if (err.status === 409) mapped.name = err.message;
      setErrors(mapped);
      setSubmitError(getErrorMessage(err));
      focusFirstInvalid();
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 p-6 sm:p-8">
      <h2 className="pr-8 font-serif text-2xl">{isEdit ? 'Edit category' : 'New category'}</h2>
      {submitError && <Alert>{submitError}</Alert>}

      <TextField label="Name" name="name" value={values.name} onChange={onText} error={errors.name} maxLength={60} required autoFocus />
      <TextField
        as="textarea"
        rows={3}
        label="Description (optional)"
        name="description"
        value={values.description}
        onChange={onText}
        error={errors.description}
        maxLength={500}
        hint="Shown at the top of the category page."
      />

      <div>
        <p className="field-label">Image (optional)</p>
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-dark">
            {image ? (
              <ProductImage src={image.url} alt="Category image preview" width={200} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-charcoal/30">
                <ImagePlus size={24} aria-hidden="true" />
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-gold-dark">
                <Spinner className="h-6 w-6" label="Uploading" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
              {image ? 'Replace image' : 'Upload image'}
            </Button>
            {image && (
              <Button
                variant="ghost"
                size="sm"
                disabled={uploading}
                onClick={() => {
                  discardSessionUpload(image);
                  setImage(null);
                }}
              >
                Remove
              </Button>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-label="Choose category image" onChange={(e) => pickFile(e.target.files)} />
        </div>
        <p className="mt-2 text-xs text-charcoal/60">Shown on the home page category tiles. Portrait photos work best (JPG, PNG or WebP, up to 5 MB).</p>
        {uploadError && <Alert className="mt-3">{uploadError}</Alert>}
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(e) => setValues((v) => ({ ...v, isActive: e.target.checked }))}
          className="mt-0.5 h-4 w-4 accent-gold"
        />
        <span>
          <span className="font-medium">Visible in store</span>
          <span className="block text-xs text-charcoal/60">Untick to hide this category and all its products from customers.</span>
        </span>
      </label>

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} disabled={uploading}>
          {isEdit ? 'Save changes' : 'Create category'}
        </Button>
      </div>
    </form>
  );
}

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // null | 'new' | category
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [reordering, setReordering] = useState(false);

  const query = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminApi.listCategories().then((res) => res.categories),
  });
  const categories = query.data ?? [];

  const toggleVisible = async (category) => {
    setBusyId(category.id);
    try {
      await adminApi.updateCategory(category.id, { isActive: !category.isActive });
      toast.success(category.isActive ? 'Category hidden from the store' : 'Category is now visible');
      invalidateProductCaches(queryClient);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  /** Swaps a category with its neighbour, then renumbers only the ones whose position changed. */
  const move = async (index, direction) => {
    const target = index + direction;
    if (reordering || target < 0 || target >= categories.length) return;

    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    const changes = next.map((c, i) => ({ c, i })).filter(({ c, i }) => c.sortOrder !== i);

    setReordering(true);
    try {
      await Promise.all(changes.map(({ c, i }) => adminApi.updateCategory(c.id, { sortOrder: i })));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      invalidateProductCaches(queryClient);
      setReordering(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteCategory(toDelete.id);
      toast.success('Category deleted');
      invalidateProductCaches(queryClient);
      setToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err)); // e.g. "This category still has products..."
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  let body;
  if (query.isPending) {
    body = <ListSkeleton rows={4} />;
  } else if (query.isError) {
    body = <ErrorState error={query.error} onRetry={() => query.refetch()} className="py-16" />;
  } else if (categories.length === 0) {
    body = (
      <EmptyState
        icon={Tags}
        title="No categories yet"
        message="Create categories like Earrings, Rings or Bracelets, then add products to them."
        action={<Button icon={Plus} onClick={() => setEditing('new')}>New category</Button>}
        className="py-16"
      />
    );
  } else {
    body = (
      <ul className="space-y-3">
        {categories.map((c, i) => (
          <li key={c.id} className={cn('flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-soft', !c.isActive && 'opacity-80')}>
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0 || reordering}
                aria-label={`Move ${c.name} up`}
                className="rounded-full p-1.5 transition hover:bg-charcoal/5 disabled:opacity-30"
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === categories.length - 1 || reordering}
                aria-label={`Move ${c.name} down`}
                className="rounded-full p-1.5 transition hover:bg-charcoal/5 disabled:opacity-30"
              >
                <ArrowDown size={16} />
              </button>
            </div>

            <div className="h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-cream-dark">
              <ProductImage src={c.image?.url} alt="" width={160} className="h-full w-full object-cover" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-medium">
                {c.name}
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                    c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-charcoal/10 text-charcoal/70'
                  )}
                >
                  {c.isActive ? 'Visible' : 'Hidden'}
                </span>
              </p>
              <p className="text-xs text-charcoal/60">
                /{c.slug} ·{' '}
                <Link to={`${ROUTES.admin.products}?category=${c.id}`} className="underline underline-offset-2 hover:text-gold-dark">
                  {c.productCount} {c.productCount === 1 ? 'product' : 'products'}
                </Link>
              </p>
              {c.description && <p className="mt-1 line-clamp-1 text-xs text-charcoal/60">{c.description}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setEditing(c)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition hover:bg-charcoal/5"
              >
                <Pencil size={14} aria-hidden="true" /> Edit
              </button>
              <button
                type="button"
                onClick={() => toggleVisible(c)}
                disabled={busyId === c.id}
                className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition hover:bg-charcoal/5 disabled:opacity-50"
              >
                {c.isActive ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
                {c.isActive ? 'Hide' : 'Show'}
              </button>
              <button
                type="button"
                onClick={() => setToDelete(c)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-red-700 transition hover:bg-red-50"
              >
                <Trash2 size={14} aria-hidden="true" /> Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <Seo title="Categories" noindex />
      <PageHeader
        title="Categories"
        description="Organise your store. The order here is the order in the store menu."
        actions={
          <Button icon={Plus} onClick={() => setEditing('new')}>
            New category
          </Button>
        }
      />

      {body}

      {/* key: opening a different category always starts with fresh form state */}
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} label={editing === 'new' ? 'New category' : 'Edit category'} size="md">
        {editing && <CategoryForm key={editing === 'new' ? 'new' : editing.id} category={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this category?"
        message={
          toDelete?.productCount > 0 ? (
            <p>
              <strong>{toDelete.name}</strong> still has {toDelete.productCount} {toDelete.productCount === 1 ? 'product' : 'products'}, so it cannot be
              deleted. Move or delete those products first, or hide the category instead.
            </p>
          ) : (
            <p>
              <strong>{toDelete?.name}</strong> will be removed permanently.
            </p>
          )
        }
        confirmLabel="Delete category"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}