import Spinner from './Spinner.jsx';
import { cn } from '../../utils/cn.js';

export default function PageLoader({ fullScreen = false }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center text-gold-dark',
        fullScreen ? 'min-h-screen' : 'min-h-[50vh]'
      )}
    >
      <Spinner className="h-9 w-9" />
    </div>
  );
}