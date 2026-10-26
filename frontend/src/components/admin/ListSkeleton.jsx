import Skeleton from '../ui/Skeleton.jsx';

export default function ListSkeleton({ rows = 6, className = 'h-20' }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={`${className} rounded-2xl`} />
      ))}
    </div>
  );
}