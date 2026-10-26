import { Link } from 'react-router-dom';
import LegalPage, { LegalSection } from '../../components/common/LegalPage.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { POLICY } from '../../utils/policy.js';
import { ROUTES } from '../../utils/constants.js';

export default function Terms() {
  const { settings } = useSettings();

  return (
    <LegalPage
      title="Terms & Conditions"
      seoTitle="Terms and Conditions"
      description="The terms that apply when you browse and shop at Crystal Zone."
      intro="By using our website or placing an order, you agree to these terms. Please read them carefully."
      updated={POLICY.lastUpdated}
    >
      <LegalSection title="About these terms">
        <p>
          These terms apply to your use of the {settings.storeName} website and to every order you place with us. If you do not
          agree with them, please do not use the site.
        </p>
      </LegalSection>

      <LegalSection title="Products and prices">
        <ul>
          <li>Prices are shown in {settings.currency} and may change without notice. The price you pay is the price shown when you place your order.</li>
          <li>We try to show our products as accurately as possible, but colours and finish may look slightly different on your screen.</li>
          <li>All products are subject to availability. If an item you ordered is no longer available, we will contact you.</li>
          <li>If a price or description is clearly wrong, we may cancel the affected order and let you know.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Orders and payment">
        <p>
          Placing an order is an offer to buy. Your order is confirmed when we accept it, which we may do by phone, WhatsApp or
          email. We may decline or cancel an order, for example if we cannot reach you to confirm it, if stock runs out, or if we
          suspect misuse.
        </p>
        <p>
          Payment is by Cash on Delivery. You agree to pay the full order total in cash to the courier when your order arrives.
          Repeatedly refusing delivery of orders may lead us to stop accepting your orders.
        </p>
      </LegalSection>

      <LegalSection title="Delivery, returns and cancellations">
        <p>
          Our delivery, cancellation and returns rules are explained on our <Link to={ROUTES.shipping}>Shipping &amp; Returns</Link>{' '}
          page, which forms part of these terms.
        </p>
      </LegalSection>

      <LegalSection title="Your account">
        <p>
          You are responsible for keeping your password secret and for everything done through your account. Please give us
          accurate details, and tell us straight away if you think someone else has used your account.
        </p>
      </LegalSection>

      <LegalSection title="Reviews">
        <p>
          You may review products you have received. Reviews must be honest and respectful. We may hide or remove reviews that are
          abusive, misleading or unrelated to the product.
        </p>
      </LegalSection>

      <LegalSection title="Our content">
        <p>
          The text, images, logo and design on this site belong to {settings.storeName} or its suppliers. Please do not copy or
          reuse them without our written permission.
        </p>
      </LegalSection>

      <LegalSection title="Limits of our responsibility">
        <p>
          We do our best to keep the site available and accurate, but we cannot promise it will always be free of errors or
          interruptions. To the extent the law allows, we are not responsible for indirect losses, and our responsibility for any
          order is limited to the amount you paid for it.
        </p>
      </LegalSection>

      <LegalSection title="Privacy">
        <p>
          How we handle your personal information is explained in our <Link to={ROUTES.privacy}>Privacy Policy</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>These terms are governed by the laws of Pakistan.</p>
      </LegalSection>

      <LegalSection title="Contact us">
        <p>
          Questions about these terms? Email <a href={`mailto:${settings.email}`}>{settings.email}</a> or call {settings.phone}.
        </p>
      </LegalSection>
    </LegalPage>
  );
}