import LegalPage, { LegalSection } from '../../components/common/LegalPage.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { POLICY } from '../../utils/policy.js';

export default function PrivacyPolicy() {
  const { settings } = useSettings();

  return (
    <LegalPage
      title="Privacy Policy"
      description="How Crystal Zone collects, uses and protects your personal information."
      intro="We respect your privacy. This page explains what information we collect when you use our store, and how we use it."
      updated={POLICY.lastUpdated}
    >
      <LegalSection title="Who we are">
        <p>
          {settings.storeName} (&quot;we&quot;, &quot;us&quot;) is an online store for artificial jewellery and fashion
          accessories. You can reach us at <a href={`mailto:${settings.email}`}>{settings.email}</a> or on {settings.phone}.
        </p>
      </LegalSection>

      <LegalSection title="Information we collect">
        <ul>
          <li>
            <strong>Account details:</strong> your name, email address, phone number and password. Your password is stored only in
            a scrambled (hashed) form that we cannot read.
          </li>
          <li>
            <strong>Order details:</strong> your name, phone number, email, delivery address, order notes and the items you order.
          </li>
          <li>
            <strong>Messages:</strong> what you send us through the contact form, and your email address if you join our
            newsletter.
          </li>
          <li>
            <strong>Reviews:</strong> the rating and comment you write. Your review shows your first name and the first letter of
            your last name.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="How we use your information">
        <ul>
          <li>To confirm, prepare and deliver your orders, and to contact you about them by phone, WhatsApp or email.</li>
          <li>To provide customer support and answer your messages.</li>
          <li>To send order confirmations and, if you subscribed, news about new arrivals and offers.</li>
          <li>To keep our store secure and prevent fraud and misuse.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Cookies and local storage">
        <p>
          We use one essential cookie to keep you logged in. It cannot be read by scripts on the page and is removed when you log
          out or it expires. Your browser also stores your cart, wishlist and recently viewed products on your own device so they
          are still there when you come back.
        </p>
        <p>At the time of writing, we do not use advertising or cross-site tracking cookies.</p>
      </LegalSection>

      <LegalSection title="Who we share it with">
        <p>We do not sell your personal information. We share it only where needed to run the store:</p>
        <ul>
          <li>Couriers and delivery partners, who receive your name, phone number and address to deliver your order.</li>
          <li>Service providers that host our website and database, store our product images, and send emails for us.</li>
          <li>Authorities, where we are required to by law.</li>
        </ul>
      </LegalSection>

      <LegalSection title="How we protect your information">
        <p>
          We use reasonable technical measures to protect your data, including hashed passwords, encrypted connections and
          restricted access to our admin area. No system is completely secure, so please choose a strong, unique password.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>
          We keep order records for as long as we need them for our business and legal obligations. Contact messages and newsletter
          addresses are kept until you ask us to remove them.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <ul>
          <li>Update your name and phone number, saved addresses and password any time in My Account.</li>
          <li>Ask us to unsubscribe you from the newsletter, or to correct or delete your personal information.</li>
        </ul>
        <p>
          To make a request, email <a href={`mailto:${settings.email}`}>{settings.email}</a> or message us on WhatsApp.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>Our store is not directed at children, and we do not knowingly collect information from them.</p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>We may update this policy from time to time. The date at the top shows when it was last changed.</p>
      </LegalSection>
    </LegalPage>
  );
}