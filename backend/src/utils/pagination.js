export const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.max(1, Math.ceil(total / limit)),
  hasMore: page * limit < total,
});