import Skeleton from '../ui/Skeleton.jsx';

export default function ProductCardSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
      <Skeleton className="mt-3 h-3 w-1/3" />
      <Skeleton className="mt-2 h-5 w-4/5" />
      <Skeleton className="mt-2 h-5 w-1/3" />
      <Skeleton className="mt-3 h-9 w-full rounded-full" />
    </div>
  );
}