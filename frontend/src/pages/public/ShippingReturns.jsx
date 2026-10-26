import { Link } from 'react-router-dom';
import LegalPage, { LegalSection } from '../../components/common/LegalPage.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { POLICY } from '../../utils/policy.js';
import { ROUTES } from '../../utils/constants.js';

export default function ShippingReturns() {
  const { settings, money } = useSettings();

  return (
    <LegalPage
      title="Shipping & Returns"
      description="Delivery times, delivery charges, Cash on Delivery and our returns process at Crystal Zone."
      intro="Everything you need to know about how we deliver your order and what to do if something is not right."
      updated={POLICY.lastUpdated}
    >
      <LegalSection title="Delivery">
        <p>
          We deliver across Pakistan. Orders are usually delivered within <strong>{POLICY.deliveryTime}</strong>, depending on
          your city and location. Delivery times may be longer during sales and public holidays.
        </p>
        <p>
          After you place an order we may call or message you on the phone number you gave us to confirm it. Please keep your
          phone available so your parcel is not delayed.
        </p>
      </LegalSection>

      <LegalSection title="Delivery charges">
        {settings.freeShippingThreshold > 0 ? (
          <ul>
            <li>Delivery costs {money(settings.shippingFee)} per order.</li>
            <li>Delivery is free when your order total, after discounts, reaches {money(settings.freeShippingThreshold)}.</li>
          </ul>
        ) : (
          <p>Delivery costs a flat {money(settings.shippingFee)} per order.</p>
        )}
        <p>The exact delivery charge is always shown in your cart and at checkout before you place your order.</p>
      </LegalSection>

      <LegalSection title="Payment: Cash on Delivery">
        <p>
          We currently accept Cash on Delivery only. You pay the courier in cash when your order arrives. Please check your
          parcel and have the exact amount ready if possible.
        </p>
      </LegalSection>

      <LegalSection title="Tracking your order">
        <p>
          Use the <Link to={ROUTES.trackOrder}>Track Order</Link> page with your Order ID and the phone number or email you used
          at checkout. If you have an account, you can also see every order in My Account.
        </p>
      </LegalSection>

      <LegalSection title="Cancelling an order">
        <p>
          If you have an account, you can cancel an order yourself from My Account &gt; My Orders while it is still &quot;Order
          Placed&quot; or &quot;Confirmed&quot;. Once an order is being processed or has been packed or shipped, please message
          us on WhatsApp straight away and we will do our best to help.
        </p>
      </LegalSection>

      <LegalSection title="Returns and replacements">
        <p>
          We want you to be happy with your purchase. If your item arrives damaged, defective or is not what you ordered, please
          contact us within <strong>{POLICY.returnWindow}</strong> of receiving your order.
        </p>
        <ul>
          <li>Message us on WhatsApp with your Order ID and clear photos of the item and its packaging.</li>
          <li>Items should be unused and in their original packaging where possible.</li>
          <li>
            If your claim is approved, we will offer a replacement where stock is available, or arrange a refund with you
            directly.
          </li>
        </ul>
        <p>
          Because jewellery is a personal item, we cannot accept returns for a change of mind once a piece has been worn. If you
          are unsure about a piece, message us before ordering and we will happily help you choose.
        </p>
      </LegalSection>

      <LegalSection title="Contact us">
        <p>
          WhatsApp or call <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a>, or email{' '}
          <a href={`mailto:${settings.email}`}>{settings.email}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}