import { cn } from '../../utils/cn.js';

export default function AdminCard({ title, description, actions, children, className }) {
  return (
    <section className={cn('rounded-3xl bg-white p-5 shadow-soft sm:p-6', className)}>
      {(title || actions) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-serif text-xl sm:text-2xl">{title}</h2>}
            {description && <p className="mt-1 text-sm text-charcoal/60">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}