/**
 * Validates and cleans req[source] with a Zod schema.
 * On success the parsed (trimmed, sanitised, unknown-keys-removed) data replaces the original,
 * so controllers only ever see validated fields, and cannot receive extras like "role".
 * On failure the ZodError is picked up by the global error handler (HTTP 400).
 */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  try {
    req[source] = schema.parse(req[source]);
    next();
  } catch (err) {
    next(err);
  }
};