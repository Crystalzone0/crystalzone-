import axios from 'axios';

export const SESSION_EXPIRED_EVENT = 'cz:session-expired';

/** Every failed request becomes an ApiError with a message that is safe to show to customers. */
export class ApiError extends Error {
  constructor(message, { status = 0, errors = null, isNetwork = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors; // [{ field, message }] from server-side validation
    this.isNetwork = isNetwork;
  }
}

// A 401 from these endpoints is a normal answer (wrong password...), not an expired session.
const NO_EXPIRY_PATHS = ['/auth/login', '/auth/register', '/auth/admin-login', '/auth/logout', '/auth/me'];

export const api = axios.create({
  baseURL: '/api', // Vite proxies /api to the backend in development; same origin in production
  withCredentials: true, // sends the httpOnly session cookie
  timeout: 20000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);

    if (error.response) {
      const { status, data } = error.response;

      let message = data && typeof data.message === 'string' ? data.message : '';
      if (!message) {
        message =
          status === 429
            ? 'Too many requests. Please wait a moment and try again.'
            : status >= 500
              ? 'Something went wrong on our side. Please try again.'
              : 'Something went wrong. Please try again.';
      }

      if (status === 401 && !NO_EXPIRY_PATHS.includes(error.config?.url)) {
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      }

      return Promise.reject(
        new ApiError(message, { status, errors: Array.isArray(data?.errors) ? data.errors : null })
      );
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(
        new ApiError('The request took too long. Please check your connection and try again.', {
          isNetwork: true,
        })
      );
    }

    return Promise.reject(
      new ApiError('Cannot reach the server. Please check your internet connection and try again.', {
        isNetwork: true,
      })
    );
  }
);

const unwrap = (promise) => promise.then((response) => response.data);

/** Small wrappers that return the response body directly. */
export const http = {
  get: (url, params, config) => unwrap(api.get(url, { params, ...config })),
  post: (url, body, config) => unwrap(api.post(url, body, config)),
  put: (url, body, config) => unwrap(api.put(url, body, config)),
  patch: (url, body, config) => unwrap(api.patch(url, body, config)),
  delete: (url, body) => unwrap(api.delete(url, body ? { data: body } : undefined)),
};

export const getErrorMessage = (error) => error?.message || 'Something went wrong. Please try again.';

/** Server validation errors as { fieldName: message } for showing under form inputs. */
export function fieldErrors(error) {
  const result = {};
  if (Array.isArray(error?.errors)) {
    for (const item of error.errors) {
      if (item?.field && !result[item.field]) result[item.field] = item.message;
    }
  }
  return result;
}