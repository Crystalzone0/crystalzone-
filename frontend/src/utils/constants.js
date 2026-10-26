export const BRAND = {
  name: import.meta.env.VITE_APP_NAME || 'Crystal Zone',
  tagline: 'Artificial Jewellery & Fashion Accessories',
  phone: import.meta.env.VITE_STORE_PHONE || '03305255596',
  whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER || '923305255596',
  email: import.meta.env.VITE_STORE_EMAIL || 'alizeesh619@gmail.com',
  currency: import.meta.env.VITE_CURRENCY || 'PKR',
};

export const STORAGE_KEYS = {
  cart: 'cz_cart', // guest cart: [{ productId, quantity }]
  wishlist: 'cz_wishlist', // guest wishlist: [{ id, slug }]
  recent: 'cz_recent', // recently viewed product slugs
};

export const MAX_LINE_QUANTITY = 20; // same limit the backend enforces

export const ROUTES = {
  home: '/',
  shop: '/shop',
  category: (slug) => `/category/${slug}`,
  product: (slug) => `/product/${slug}`,
  cart: '/cart',
  checkout: '/checkout',
  orderSuccess: '/order-success',
  login: '/login',
  register: '/register',
  account: '/account',
  accountOrders: '/account?tab=orders',
  wishlist: '/wishlist',
  trackOrder: '/track-order',
  about: '/about',
  contact: '/contact',
  faq: '/faq',
  privacy: '/privacy-policy',
  terms: '/terms',
  shipping: '/shipping-returns',
  unauthorized: '/unauthorized',
  admin: {
    login: '/admin/login',
    dashboard: '/admin',
    products: '/admin/products',
    newProduct: '/admin/products/new',
    editProduct: (id) => `/admin/products/${id}/edit`,
    inventory: '/admin/inventory',
    orders: '/admin/orders',
    order: (id) => `/admin/orders/${id}`,
    customers: '/admin/customers',
    customer: (id) => `/admin/customers/${id}`,
    reviews: '/admin/reviews',
    messages: '/admin/messages',
    subscribers: '/admin/subscribers',
    categories: '/admin/categories',
    settings: '/admin/settings',
  },
};