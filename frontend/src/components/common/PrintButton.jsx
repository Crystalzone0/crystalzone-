import { Printer } from 'lucide-react';
import Button from '../ui/Button.jsx';

/** Opens the browser's print dialog. The print styles in index.css hide the site chrome and buttons. */
export default function PrintButton({ label = 'Print', variant = 'outline', ...props }) {
  return (
    <Button variant={variant} icon={Printer} onClick={() => window.print()} {...props}>
      {label}
    </Button>
  );
}