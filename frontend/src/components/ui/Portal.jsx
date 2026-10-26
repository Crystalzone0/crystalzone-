import { createPortal } from 'react-dom';

/**
 * Renders its children directly in <body>. Dialogs and drawers use it so that a parent's blur, transform or
 * overflow (for example the header's backdrop-blur) can never shrink, clip or hide them.
 */
export default function Portal({ children }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}