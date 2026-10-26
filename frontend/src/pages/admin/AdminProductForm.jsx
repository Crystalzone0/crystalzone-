import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Seo from '../../components/common/Seo.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import PageHeader from '../../components/admin/PageHeader.jsx';
import ImageManager from '../../components/admin/products/ImageManager.jsx';
import SpecsEditor, { newSpec } from '../../components/admin/products/SpecsEditor.jsx';
import TagInput from '../../components/admin/products/TagInput.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import TextField from '../../components/ui/TextField.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import * as adminApi from '../../services/adminApi.js';
import { fieldErrors, getErrorMessage } from '../../services/api.js';
import { focusFirstInvalid } from '../../utils/address.js';
import { invalidateProductCaches, refId } from '../../utils/admin.js';
import { ROUTES } from '../../utils/constants.js';

const MAX_PRICE = 10_000_000;
const MAX_STOCK = 1_000_000;

function toFormValues(product) {
  return {
    name: product?.name ?? '',
    category: refId(product?.category),
    description: product?.description ?? '',
    price: product ? String(product.price) : '',
    salePrice: product?.salePrice != null ? String(product.salePrice) : '',
    sku: product?.sku ?? '',
    stock: product ? String(product.stock) : '0',
    featured: Boolean(product?.featured),
    bestSeller: Boolean(product?.bestSeller),
    newArrival: Boolean(product?.newArrival),
    isActive: product ? Boolean(product.isActive) : true,
  };
}

function toMedia(product) {
  const images = (product?.images ?? []).map(({ url, publicId }) => ({ url, publicId: publicId || '' }));
  const primary = images.some((i) => i.url === product?.primaryImage) ? product.primaryImage : images[0]?.url || '';
  return { images, primary };
}

/** Same rules the server applies (the server still checks everything again). */
function validate(values, specs, media) {
  const e = {};

  const name = values.name.trim();
  if (name.length < 2) e.name = 'Product name must be at least 2 characters';
  else if (name.length > 150) e.name = 'Product name must be at most 150 characters';

  if (!values.category) e.category = 'Please choose a category';

  const description = values.description.trim();
  if (description.length < 10) e.description = 'Description must be at least 10 characters';
  else if (description.length > 4000) e.description = 'Description must be at most 4000 characters';

  const price = Number(values.price);
  if (values.price === '') e.price = 'Price is required';
  else if (!Number.isInteger(price) || price < 1) e.price = 'Price must be at least 1';
  else if (price > MAX_PRICE) e.price = 'Price is too high';

  if (values.salePrice !== '') {
    const sale = Number(values.salePrice);
    if (!Number.isInteger(sale) || sale < 1) e.salePrice = 'Sale price must be at least 1';
    else if (!e.price && sale >= price) e.salePrice = 'Sale price must be lower than the regular price';
  }

  const sku = values.sku.trim();
  if (sku.length < 2) e.sku = 'SKU must be at least 2 characters';
  else if (sku.length > 40) e.sku = 'SKU must be at most 40 characters';
  else if (!/^[A-Za-z0-9._-]+$/.test(sku)) e.sku = 'SKU can only contain letters, numbers, dots, dashes and underscores';

  const stock = Number(values.stock);
  if (values.stock === '') e.stock = 'Stock is required (use 0 if none)';
  else if (!Number.isInteger(stock) || stock < 0) e.stock = 'Stock must be a whole number';
  else if (stock > MAX_STOCK) e.stock = 'Stock is too high';

  if (specs.some((s) => Boolean(s.key.trim()) !== Boolean(s.value.trim()))) {
    e.specs = 'Each specification needs both a name and a value. Fill in or remove the incomplete rows.';
  }
  if (media.images.length > 10) e.images = 'A product can have at most 10 images';

  return e;
}

function Card({ title, description, children }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft sm:p-7">
      <h2 className="font-serif text-xl sm:text-2xl">{title}</h2>
      {description && <p className="mt-1 text-sm text-charcoal/60">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function Flag({ name, checked, onChange, title, hint }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="mt-0.5 h-4 w-4 accent-gold" />
      <span>
        <span className="font-medium">{title}</span>
        <span className="block text-xs text-charcoal/60">{hint}</span>
      </span>
    </label>
  );
}

function ProductFormBody({ product }) {
  const isEdit = Boolean(product);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { money } = useSettings();

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminApi.listCategories().then((res) => res.categories),
  });
  const categories = categoriesQuery.data ?? [];

  const [values, setValues] = useState(() => toFormValues(product));
  const [media, setMedia] = useState(() => toMedia(product));
  const [tags, setTags] = useState(() => product?.tags ?? []);
  const [specs, setSpecs] = useState(() => (product?.specifications ?? []).map((s) => newSpec(s.key, s.value)));

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitDetails, setSubmitDetails] = useState([]);
  const [saving, setSaving] = useState(false);

  const [newCategory, setNewCategory] = useState(null); // null = closed, string = the name being typed
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const uploadedRef = useRef(new Set()); // Cloudinary ids uploaded during this session
  const savedRef = useRef(false);

  // Unsaved-changes tracking
  const snapshot = JSON.stringify([values, media, tags, specs.map((s) => [s.key, s.value])]);
  const initialRef = useRef(snapshot);
  const dirty = snapshot !== initialRef.current;

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => {
      if (savedRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const clearError = (name) => errors[name] && setErrors((e) => ({ ...e, [name]: '' }));

  const onText = (event) => {
    const { name, value } = event.target;
    setValues((v) => ({ ...v, [name]: value }));
    clearError(name);
  };

  const onNumber = (event) => {
    const { name } = event.target;
    const value = event.target.value.replace(/\D/g, '').slice(0, 8);
    setValues((v) => ({ ...v, [name]: value }));
    clearError(name);
  };

  const onFlag = (event) => {
    const { name, checked } = event.target;
    setValues((v) => ({ ...v, [name]: checked }));
  };

  const priceNum = Number(values.price);
  const saleNum = Number(values.salePrice);
  const showDiscount = values.price !== '' && values.salePrice !== '' && saleNum >= 1 && saleNum < priceNum;
  const discountPct = showDiscount ? Math.round(((priceNum - saleNum) / priceNum) * 100) : 0;

  const createCategory = async () => {
    const name = (newCategory || '').trim();
    if (name.length < 2) {
      toast.error('Category name must be at least 2 characters');
      return;
    }
    setCreatingCategory(true);
    try {
      const data = await adminApi.createCategory({ name });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['filters'] });
      setValues((v) => ({ ...v, category: data.category.id }));
      clearError('category');
      setNewCategory(null);
      toast.success('Category created');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreatingCategory(false);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const found = validate(values, specs, media);
    setErrors(found);
    setSubmitError('');
    setSubmitDetails([]);
    if (Object.keys(found).length > 0) {
      setSubmitError('Please fix the highlighted fields.');
      focusFirstInvalid();
      return;
    }

    const payload = {
      name: values.name.trim(),
      category: values.category,
      description: values.description.trim(),
      price: Number(values.price),
      salePrice: values.salePrice === '' ? null : Number(values.salePrice),
      sku: values.sku.trim().toUpperCase(),
      stock: Number(values.stock),
      images: media.images.map(({ url, publicId }) => ({ url, publicId: publicId || '' })),
      primaryImage: media.primary || '',
      tags,
      specifications: specs
        .filter((s) => s.key.trim() && s.value.trim())
        .map((s) => ({ key: s.key.trim(), value: s.value.trim() })),
      featured: values.featured,
      bestSeller: values.bestSeller,
      newArrival: values.newArrival,
      isActive: values.isActive,
    };

    setSaving(true);
    try {
      if (isEdit) await adminApi.updateProduct(product.id, payload);
      else await adminApi.createProduct(payload);

      savedRef.current = true;
      uploadedRef.current.clear();
      invalidateProductCaches(queryClient);
      toast.success(isEdit ? 'Product updated' : 'Product created');
      navigate(ROUTES.admin.products);
    } catch (err) {
      setSaving(false);
      const mapped = fieldErrors(err);
      if (err.status === 409 && /sku/i.test(err.message)) mapped.sku = err.message;
      setErrors(mapped);
      setSubmitError(getErrorMessage(err));
      setSubmitDetails(
        [...new Set((err.errors || []).map((i) => (i.field ? `${i.field}: ${i.message}` : i.message)))].slice(0, 6)
      );
      focusFirstInvalid();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const cancel = () => {
    if (dirty && !window.confirm('Discard your changes?')) return;
    // Images uploaded in this session but never saved are no longer needed.
    for (const publicId of uploadedRef.current) adminApi.deleteUploadedImage(publicId).catch(() => {});
    uploadedRef.current.clear();
    navigate(ROUTES.admin.products);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteProduct(product.id);
      savedRef.current = true;
      invalidateProductCaches(queryClient);
      toast.success('Product deleted');
      navigate(ROUTES.admin.products);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <>
      <Seo title={isEdit ? 'Edit product' : 'Add product'} noindex />
      <PageHeader
        title={isEdit ? 'Edit product' : 'Add product'}
        description={isEdit ? product.name : 'Fill in the details, add photos, then save.'}
        backTo={ROUTES.admin.products}
        backLabel="Products"
        actions={
          isEdit && product.isActive ? (
            <Button href={ROUTES.product(product.slug)} variant="outline" size="sm" icon={ExternalLink}>
              View in store
            </Button>
          ) : null
        }
      />

      <form onSubmit={onSubmit} noValidate>
        {submitError && (
          <Alert className="mb-6">
            <p>{submitError}</p>
            {submitDetails.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {submitDetails.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </Alert>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_22rem] xl:items-start">
          <div className="space-y-6">
            <Card title="Basic information">
              <TextField label="Product name" name="name" value={values.name} onChange={onText} error={errors.name} maxLength={150} required />
              <div>
                <TextField
                  as="textarea"
                  rows={6}
                  label="Description"
                  name="description"
                  value={values.description}
                  onChange={onText}
                  error={errors.description}
                  maxLength={4000}
                  required
                />
                <p className="mt-1 text-right text-xs text-charcoal/50">{values.description.length}/4000</p>
              </div>
            </Card>

            <Card title="Pricing" description="Prices are whole numbers. Set a sale price to show a discount on the store.">
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label="Regular price"
                  name="price"
                  inputMode="numeric"
                  autoComplete="off"
                  value={values.price}
                  onChange={onNumber}
                  error={errors.price}
                  required
                />
                <TextField
                  label="Sale price (optional)"
                  name="salePrice"
                  inputMode="numeric"
                  autoComplete="off"
                  value={values.salePrice}
                  onChange={onNumber}
                  error={errors.salePrice}
                  hint="Leave empty for no sale."
                />
              </div>
              {showDiscount && (
                <p className="rounded-xl bg-gold/10 px-4 py-3 text-sm">
                  Customers will pay <strong>{money(saleNum)}</strong> instead of <s>{money(priceNum)}</s>, a{' '}
                  <strong>{discountPct}% discount</strong>.
                </p>
              )}
            </Card>

            <Card title="Images" description="Upload photos of the product. Uploads are stored securely on Cloudinary.">
              <ImageManager media={media} onChange={setMedia} uploadedRef={uploadedRef} error={errors.images} />
            </Card>

            <Card title="Specifications" description="Shown as a table on the product page.">
              <SpecsEditor
                specs={specs}
                onChange={(next) => {
                  setSpecs(next);
                  clearError('specs');
                }}
                error={errors.specs}
              />
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Visibility">
              <Flag name="isActive" checked={values.isActive} onChange={onFlag} title="Visible in store" hint="Untick to hide this product from customers." />
              <Flag name="featured" checked={values.featured} onChange={onFlag} title="Featured" hint="Shown in the home page featured collection." />
              <Flag name="bestSeller" checked={values.bestSeller} onChange={onFlag} title="Best seller" hint="Shown first in the best sellers section." />
              <Flag name="newArrival" checked={values.newArrival} onChange={onFlag} title="New arrival" hint="Shown first in the new arrivals section." />
            </Card>

            <Card title="Organisation">
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="category" className="field-label !mb-0">
                    Category <span className="text-gold-dark">*</span>
                  </label>
                  {newCategory === null && (
                    <button type="button" onClick={() => setNewCategory('')} className="text-xs text-gold-dark underline underline-offset-4 hover:text-ink">
                      New category
                    </button>
                  )}
                </div>
                <select
                  id="category"
                  name="category"
                  value={values.category}
                  onChange={onText}
                  aria-invalid={errors.category ? true : undefined}
                  className={`input mt-1.5 ${errors.category ? 'border-red-400' : ''}`}
                >
                  <option value="">{categoriesQuery.isPending ? 'Loading...' : 'Choose a category'}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.isActive === false ? ' (hidden)' : ''}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="field-error" role="alert">
                    {errors.category}
                  </p>
                )}
                {categoriesQuery.isSuccess && categories.length === 0 && newCategory === null && (
                  <p className="mt-2 text-xs text-charcoal/60">You have no categories yet. Use &quot;New category&quot; to add your first one.</p>
                )}

                {newCategory !== null && (
                  <div className="mt-3 flex gap-2">
                    <input
                      autoFocus
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault(); // must not submit the product form
                          createCategory();
                        } else if (e.key === 'Escape') setNewCategory(null);
                      }}
                      maxLength={60}
                      placeholder="e.g. Earrings"
                      aria-label="New category name"
                      className="input py-2.5"
                    />
                    <Button size="sm" loading={creatingCategory} onClick={createCategory}>
                      Add
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setNewCategory(null)} disabled={creatingCategory}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <TagInput tags={tags} onChange={setTags} hint="Press Enter after each tag. Tags help customers find this product in search." />
            </Card>

            <Card title="Inventory">
              <TextField
                label="SKU"
                name="sku"
                autoComplete="off"
                value={values.sku}
                onChange={onText}
                error={errors.sku}
                maxLength={40}
                inputClassName="uppercase"
                hint="A unique code, e.g. ER-001."
                required
              />
              <div>
                <TextField
                  label="Stock quantity"
                  name="stock"
                  inputMode="numeric"
                  autoComplete="off"
                  value={values.stock}
                  onChange={onNumber}
                  error={errors.stock}
                  required
                />
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-charcoal/60">
                  <span>{Number(values.stock) === 0 && values.stock !== '' ? 'Customers will see OUT OF STOCK.' : 'Reduces automatically when orders are placed.'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setValues((v) => ({ ...v, stock: '0' }));
                      clearError('stock');
                    }}
                    className="shrink-0 text-gold-dark underline underline-offset-4 hover:text-ink"
                  >
                    Mark out of stock
                  </button>
                </div>
              </div>
            </Card>

            {isEdit && (
              <Button variant="outline" icon={Trash2} onClick={() => setConfirmDelete(true)} className="w-full border-red-200 text-red-700 hover:border-red-400 hover:text-red-800">
                Delete product
              </Button>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 z-10 -mx-4 mt-8 border-t border-charcoal/10 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-charcoal/60" aria-live="polite">
              {dirty ? 'You have unsaved changes' : '\u00A0'}
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={cancel} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {isEdit ? 'Save changes' : 'Create product'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this product?"
        message="It will be removed permanently, including from carts, wishlists and reviews. Past orders keep their own copy of the details. To stop selling it for now, untick 'Visible in store' instead."
        confirmLabel="Delete product"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}

function FormSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="mb-8 h-10 w-64" />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    </div>
  );
}

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);

  const query = useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => adminApi.getProduct(id).then((res) => res.product),
    enabled: isEdit,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  if (isEdit) {
    if (query.isPending) return <FormSkeleton />;
    if (query.error?.status === 404) {
      return (
        <EmptyState
          icon={Trash2}
          title="Product not found"
          message="It may have been deleted."
          action={<Button to={ROUTES.admin.products}>Back to products</Button>}
          className="py-24"
        />
      );
    }
    if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} className="py-24" />;
  }

  // key: switching between products (or create -> edit) always starts with fresh form state
  return <ProductFormBody key={id || 'new'} product={isEdit ? query.data : null} />;
}