import { cn } from '../../utils/cn.js';

/** Friendly "nothing here yet" block. `action` is a button or link element. */
export default function EmptyState({ icon: Icon, title, message, action, className }) {
  return (
    <div className={cn('mx-auto flex max-w-md animate-fade-up flex-col items-center px-4 py-16 text-center', className)}>
      {Icon && (
        <span className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gold/40 bg-white text-gold-dark shadow-soft">
          <Icon size={30} strokeWidth={1.5} aria-hidden="true" />
        </span>
      )}
      <h2 className="font-serif text-2xl sm:text-3xl">{title}</h2>
      {message && <p className="mt-3 text-sm leading-relaxed text-charcoal/70">{message}</p>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}