import { Link } from 'react-router-dom';
import Spinner from './Spinner.jsx';
import { cn } from '../../utils/cn.js';

const VARIANTS = {
  gold: 'btn-gold',
  dark: 'btn-dark',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
};

const SIZES = { sm: 'btn-sm', md: '', lg: 'btn-lg' };

// The icon and the loading spinner follow the button size.
const ICON_PX = { sm: 15, md: 18, lg: 20 };
const SPINNER_CLASS = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' };

/**
 * <Button>Save</Button>                          normal button
 * <Button to="/shop">Shop</Button>               router link styled as a button
 * <Button href="https://...">WhatsApp</Button>   external link
 * <Button loading>Saving</Button>                spinner + disabled
 * <Button icon={Heart} size="lg" />              icon scales with size (sm 15, md 18, lg 20)
 * <Button icon={Heart} iconSize={24} iconClassName="animate-tick" />
 */
export default function Button({
  variant = 'gold',
  size = 'md',
  loading = false,
  disabled = false,
  to,
  href,
  icon: Icon,
  iconSize,
  iconClassName,
  className,
  children,
  type = 'button',
  ...props
}) {
  const sizeKey = size in SIZES ? size : 'md'; // an unknown size falls back to md
  const classes = cn(VARIANTS[variant] ?? VARIANTS.gold, SIZES[sizeKey], className);

  const content = (
    <>
      {loading ? (
        <Spinner className={cn(SPINNER_CLASS[sizeKey], 'shrink-0')} />
      ) : Icon ? (
        <Icon size={iconSize ?? ICON_PX[sizeKey]} className={cn('shrink-0', iconClassName)} aria-hidden="true" />
      ) : null}
      {children}
    </>
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  if (href && !disabled) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...props}>
        {content}
      </a>
    );
  }
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {content}
    </button>
  );
}