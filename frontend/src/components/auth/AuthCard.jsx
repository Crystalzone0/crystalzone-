export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <section className="bg-cream py-12 sm:py-16">
      <div className="container-cz">
        <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-soft sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="font-serif text-3xl sm:text-4xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-charcoal/70">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="mt-8 border-t border-charcoal/10 pt-6 text-center text-sm text-charcoal/70">{footer}</div>}
        </div>
      </div>
    </section>
  );
}