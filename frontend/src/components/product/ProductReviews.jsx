import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { Stars } from './Rating.jsx';
import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';
import ErrorState from '../ui/ErrorState.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import TextField from '../ui/TextField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import * as engagementApi from '../../services/engagementApi.js';
import { fieldErrors, getErrorMessage } from '../../services/api.js';
import { formatDate } from '../../utils/format.js';
import { ROUTES } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);

  return (
    <div role="radiogroup" aria-label="Your rating" className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          className="p-0.5"
        >
          <Star size={30} className={cn('transition', (hover || value) >= n ? 'fill-gold text-gold' : 'text-charcoal/25')} />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ product }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const found = {};
    if (!rating) found.rating = 'Please choose a rating from 1 to 5';
    if (comment.trim().length < 3) found.comment = 'Please write a short review';
    setErrors(found);
    setSubmitError('');
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await engagementApi.createReview(product.id, { rating, comment: comment.trim() });
      toast.success('Thank you for your review!');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reviews', product.id] }),
        queryClient.invalidateQueries({ queryKey: ['product', product.slug] }),
      ]);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setErrors(fieldErrors(err));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl bg-cream p-5 sm:p-6">
      <h3 className="font-serif text-xl">Write a review</h3>
      {submitError && <Alert className="mt-4">{submitError}</Alert>}

      <div className="mt-4">
        <StarInput value={rating} onChange={(n) => { setRating(n); setErrors((e) => ({ ...e, rating: '' })); }} />
        {errors.rating && <p className="field-error" role="alert">{errors.rating}</p>}
      </div>

      <TextField
        as="textarea"
        rows={4}
        label="Your review"
        name="comment"
        maxLength={1000}
        placeholder="Tell others what you think about this piece"
        value={comment}
        onChange={(e) => { setComment(e.target.value); setErrors((er) => ({ ...er, comment: '' })); }}
        error={errors.comment}
        className="mt-4"
        required
      />

      <Button type="submit" loading={submitting} className="mt-4">
        Submit review
      </Button>
    </form>
  );
}

function EligibilityNote({ eligibility, product }) {
  const location = useLocation();
  if (!eligibility) return null;

  if (eligibility.canReview) return <ReviewForm product={product} />;

  const notes = {
    login: (
      <>
        <Link to={ROUTES.login} state={{ from: location }} className="font-medium underline underline-offset-4 hover:text-gold-dark">
          Log in
        </Link>{' '}
        to write a review.
      </>
    ),
    'not-purchased': 'Only customers who have received this product can review it.',
    'already-reviewed': 'Thank you, you have already reviewed this product.',
  };

  return <p className="rounded-2xl bg-cream px-5 py-4 text-sm text-charcoal/75">{notes[eligibility.reason]}</p>;
}

export default function ProductReviews({ product }) {
  const { user } = useAuth();

  const query = useInfiniteQuery({
    queryKey: ['reviews', product.id, user?._id ?? 'guest'],
    queryFn: ({ pageParam }) => engagementApi.getReviews(product.id, { page: pageParam, limit: 5 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.hasMore ? last.pagination.page + 1 : undefined),
  });

  if (query.isPending) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (query.isError && !query.data) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} title="Reviews could not be loaded" className="py-8" />;
  }

  const first = query.data.pages[0];
  const { summary, eligibility } = first;
  const reviews = query.data.pages.flatMap((page) => page.reviews);

  return (
    <div className="grid gap-10 lg:grid-cols-[18rem_1fr]">
      <div>
        {summary.count > 0 ? (
          <div>
            <p className="font-serif text-5xl">{Number(summary.average).toFixed(1)}</p>
            <Stars value={summary.average} size={20} className="mt-2" />
            <p className="mt-1 text-sm text-charcoal/60">
              Based on {summary.count} review{summary.count === 1 ? '' : 's'}
            </p>

            <ul className="mt-5 space-y-2" aria-label="Rating breakdown">
              {[5, 4, 3, 2, 1].map((star) => {
                const n = summary.distribution[star] || 0;
                return (
                  <li key={star} className="flex items-center gap-3 text-xs">
                    <span className="w-8 shrink-0 text-charcoal/70">{star} star</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-cream-dark">
                      <span className="block h-full rounded-full bg-gold" style={{ width: `${(n / summary.count) * 100}%` }} />
                    </span>
                    <span className="w-6 text-right text-charcoal/60">{n}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-charcoal/70">No reviews yet.</p>
        )}
      </div>

      <div className="space-y-8">
        <EligibilityNote eligibility={eligibility} product={product} />

        {reviews.length === 0 ? (
          <p className="text-sm text-charcoal/70">
            Be the first to share your thoughts once your order arrives.
          </p>
        ) : (
          <ul className="divide-y divide-charcoal/10">
            {reviews.map((review) => (
              <li key={review.id ?? review._id} className="py-5 first:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Stars value={review.rating} size={15} />
                    <span className="text-sm font-medium">{review.name}</span>
                  </div>
                  <time dateTime={review.createdAt} className="text-xs text-charcoal/50">
                    {formatDate(review.createdAt)}
                  </time>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-charcoal/80">{review.comment}</p>
              </li>
            ))}
          </ul>
        )}

        {query.isFetchNextPageError && (
          <Alert>Could not load more reviews. Please try again.</Alert>
        )}
        {query.hasNextPage && (
          <Button variant="outline" loading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
            Show more reviews
          </Button>
        )}
      </div>
    </div>
  );
}