import slugify from 'slugify';

export const makeSlug = (text) => slugify(String(text ?? ''), { lower: true, strict: true, trim: true });

/**
 * Returns a slug unique within the model: "gold-hoops", "gold-hoops-2", ...
 * The unique index on `slug` still protects against races.
 */
export async function uniqueSlug(Model, text, excludeId = null) {
  const root = makeSlug(text) || 'item';
  let candidate = root;
  let n = 1;

  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    n += 1;
    candidate = `${root}-${n}`;
  }
  return candidate;
}