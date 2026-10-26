import { Suspense } from 'react';
import lazy from './utils/lazyWithRetry.js';
import { Route, Routes, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import ScrollToTop from './components/common/ScrollToTop.jsx';
import AdminRoute from './components/guards/AdminRoute.jsx';
import ProtectedRoute from './components/guards/ProtectedRoute.jsx';
import PageLoader from "./components/ui/PageLoader.jsx";
import StoreLayout from './layouts/StoreLayout.jsx';
// Each page is its own chunk, downloaded only when a visitor opens it (code splitting).
const Home = lazy(() => import('./pages/public/Home.jsx'));
const Shop = lazy(() => import('./pages/public/Shop.jsx'));
const ProductDetails = lazy(() => import('./pages/public/ProductDetails.jsx'));
const Cart = lazy(() => import('./pages/public/Cart.jsx'));
const Wishlist = lazy(() => import('./pages/public/Wishlist.jsx'));
const Checkout = lazy(() => import('./pages/public/Checkout.jsx'));
const OrderSuccess = lazy(() => import('./pages/public/OrderSuccess.jsx'));
const TrackOrder = lazy(() => import('./pages/public/TrackOrder.jsx'));
const About = lazy(() => import('./pages/public/About.jsx'));
const Contact = lazy(() => import('./pages/public/Contact.jsx'));
const Faq = lazy(() => import('./pages/public/Faq.jsx'));
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy.jsx'));
const Terms = lazy(() => import('./pages/public/Terms.jsx'));
const ShippingReturns = lazy(() => import('./pages/public/ShippingReturns.jsx'));
const Account = lazy(() => import('./pages/account/Account.jsx'));
const Login = lazy(() => import('./pages/auth/Login.jsx'));
const Register = lazy(() => import('./pages/auth/Register.jsx'));
const Unauthorized = lazy(() => import('./pages/errors/Unauthorized.jsx'));
const NotFound = lazy(() => import('./pages/errors/NotFound.jsx'));

const AdminLogin = lazy(() => import('./pages/admin/AdminLogin.jsx'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout.jsx'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts.jsx'));
const AdminProductForm = lazy(() => import('./pages/admin/AdminProductForm.jsx'));
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory.jsx'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders.jsx'));
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail.jsx'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers.jsx'));
const AdminCustomerDetail = lazy(() => import('./pages/admin/AdminCustomerDetail.jsx'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews.jsx'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages.jsx'));
const AdminSubscribers = lazy(() => import('./pages/admin/AdminSubscribers.jsx'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories.jsx'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings.jsx'));
const AdminNotFound = lazy(() => import('./pages/admin/AdminNotFound.jsx'));

export default function App() {
  const location = useLocation();

  return (
    <ErrorBoundary resetKey={location.pathname}>
      <ScrollToTop />
      <Suspense fallback={<PageLoader fullScreen />}>
        <Routes>
          <Route element={<StoreLayout />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="category/:slug" element={<Shop />} />
            <Route path="product/:slug" element={<ProductDetails />} />
            <Route path="cart" element={<Cart />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="order-success" element={<OrderSuccess />} />
            <Route path="track-order" element={<TrackOrder />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="faq" element={<Faq />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="terms" element={<Terms />} />
            <Route path="shipping-returns" element={<ShippingReturns />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="unauthorized" element={<Unauthorized />} />

            {/* Customer-only pages: visitors who are not logged in are sent to /login */}
            <Route element={<ProtectedRoute />}>
              <Route path="account" element={<Account />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="admin/login" element={<AdminLogin />} />

          {/* Admin-only pages (the server enforces admin access on every API call as well) */}
          <Route path="admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<AdminProductForm />} />
              <Route path="products/:id/edit" element={<AdminProductForm />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/:id" element={<AdminOrderDetail />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="customers/:id" element={<AdminCustomerDetail />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="subscribers" element={<AdminSubscribers />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="*" element={<AdminNotFound />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}