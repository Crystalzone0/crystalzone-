import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn.js';

/**
 * Label + input + error message. Use as="textarea" for multi-line text.
 * type="password" gets a show/hide button automatically.
 */
const TextField = forwardRef(function TextField(
  { label, name, type = 'text', as = 'input', error, hint, required = false, className, inputClassName, ...props },
  ref
) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = as === 'input' && type === 'password';
  const Tag = as;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
          {required && <span className="text-gold-dark"> *</span>}
        </label>
      )}

      <div className="relative">
        <Tag
          ref={ref}
          id={id}
          name={name}
          type={as === 'input' ? (isPassword && visible ? 'text' : type) : undefined}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-describedby={describedBy}
          className={cn(
            'input',
            isPassword && 'pr-12',
            error && 'border-red-400 focus:border-red-400 focus:ring-red-200',
            inputClassName
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-charcoal/50 transition hover:text-charcoal"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error ? (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-charcoal/60">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default TextField;