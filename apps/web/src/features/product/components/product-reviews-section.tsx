import type { Locale } from "@ys/intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuthDialog } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

import type { ProductReviewDto } from "../product.queries";
import {
  deleteProductReviewMutationOptions,
  productReviewsQuery,
  submitProductReviewMutationOptions,
} from "../product.queries";

interface ProductReviewsSectionProps {
  locale: Locale;
  productSlug: string;
  /** When true, omit outer heading and top border (e.g. inside a tab panel). */
  embedded?: boolean;
}

export function ProductReviewsSection({
  locale,
  productSlug,
  embedded = false,
}: ProductReviewsSectionProps) {
  const queryClient = useQueryClient();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { openAuth } = useAuthDialog();

  const { data, isPending, isError, error } = useQuery(productReviewsQuery(locale, productSlug));
  const submitReview = useMutation(
    submitProductReviewMutationOptions(queryClient, locale, productSlug),
  );
  const deleteReview = useMutation(
    deleteProductReviewMutationOptions(queryClient, locale, productSlug),
  );

  const [stars, setStars] = useState<number | null>(null);
  const [hoverStars, setHoverStars] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isEditingReview, setIsEditingReview] = useState(false);

  useEffect(() => {
    setIsEditingReview(false);
    setStars(null);
    setHoverStars(null);
    setComment("");
  }, [productSlug]);

  const viewerReview = data?.viewerReview;

  const displayReviews = useMemo((): ProductReviewDto[] => {
    if (!data) return [];
    const vid = data.viewerReview?.id;
    const others = data.reviews.filter((r) => r.id !== vid);

    if (!data.viewerReview || !session?.user) {
      return data.reviews;
    }

    if (isEditingReview) {
      return others;
    }

    const mine: ProductReviewDto = {
      id: data.viewerReview.id,
      stars: data.viewerReview.stars,
      comment: data.viewerReview.comment,
      createdAt: data.viewerReview.createdAt,
      authorName: session.user.name ?? "You",
    };
    return [mine, ...others];
  }, [data, session?.user, isEditingReview]);

  const showReviewForm =
    Boolean(session?.user) &&
    !isPending &&
    !isError &&
    data &&
    (!viewerReview || isEditingReview);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stars === null) return;
    submitReview.mutate(
      { stars, comment: comment.trim() },
      {
        onSuccess: () => {
          setIsEditingReview(false);
          setComment("");
          setStars(null);
        },
      },
    );
  };

  const startEditing = () => {
    if (viewerReview) {
      setStars(viewerReview.stars);
      setComment(viewerReview.comment ?? "");
    }
    setIsEditingReview(true);
  };

  const cancelEditing = () => {
    setIsEditingReview(false);
    if (viewerReview) {
      setStars(viewerReview.stars);
      setComment(viewerReview.comment ?? "");
    } else {
      setStars(null);
      setComment("");
    }
  };

  const onDelete = () => {
    if (
      !window.confirm(
        "Remove your review? You can write a new one later.",
      )
    ) {
      return;
    }
    deleteReview.mutate(undefined, {
      onSuccess: () => {
        setIsEditingReview(false);
        setComment("");
        setStars(null);
      },
    });
  };

  return (
    <section
      className={cn(
        embedded ? "mt-0 border-0 pt-0" : "mt-10 border-t border-border pt-10",
      )}
    >
      {!embedded ? (
        <h2 className="mb-6 text-xl font-bold tracking-tight md:text-2xl">
          Customer reviews
        </h2>
      ) : null}

      {sessionPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !session?.user ? (
        <div className="mb-10 rounded-lg border border-dashed border-border bg-muted/20 p-4 md:p-5">
          <p className="text-sm text-muted-foreground">
            Sign in to share your rating and a written review.
          </p>
          <Button type="button" className="mt-3" onClick={() => openAuth()}>
            Sign in
          </Button>
        </div>
      ) : isPending ? (
        <p className="mb-10 text-sm text-muted-foreground">Loading…</p>
      ) : isError ? null : showReviewForm ? (
        <form
          onSubmit={onSubmit}
          className="mb-10 space-y-4 rounded-lg border border-border bg-muted/30 p-4 md:p-5"
        >
          <p className="text-sm font-medium">
            {isEditingReview ? "Edit your review" : "Write a review"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Rating</span>
            <div
              className="flex gap-1"
              onMouseLeave={() => setHoverStars(null)}
            >
              {[1, 2, 3, 4, 5].map((n) => {
                const filled =
                  (hoverStars !== null && n <= hoverStars) ||
                  (hoverStars === null && stars !== null && n <= stars);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStars(n)}
                    onMouseEnter={() => setHoverStars(n)}
                    className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  >
                    <Star
                      className={cn(
                        "h-7 w-7 transition-colors duration-150 md:h-6 md:w-6",
                        filled
                          ? "fill-rating text-rating"
                          : "fill-neutral-300/15 text-neutral-300/15 dark:fill-neutral-400/25 dark:text-neutral-400/25",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="review-comment" className="text-sm text-muted-foreground">
              Your review
            </label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product…"
              maxLength={2000}
              rows={4}
              required
              disabled={submitReview.isPending}
            />
            <p className="text-xs text-muted-foreground">{comment.length}/2000</p>
          </div>
          {submitReview.isError && (
            <p className="text-sm text-destructive" role="alert">
              {submitReview.error instanceof Error
                ? submitReview.error.message
                : "Could not submit review."}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              disabled={submitReview.isPending || stars === null || !comment.trim()}
            >
              {submitReview.isPending
                ? isEditingReview
                  ? "Saving…"
                  : "Submitting…"
                : isEditingReview
                  ? "Save changes"
                  : "Submit review"}
            </Button>
            {isEditingReview ? (
              <Button
                type="button"
                variant="outline"
                disabled={submitReview.isPending}
                onClick={cancelEditing}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading reviews…</p>
      ) : isError ? (
        <p className="text-sm text-destructive" role="alert">
          {error instanceof Error ? error.message : "Could not load reviews."}
        </p>
      ) : (
        <>
          {deleteReview.isError ? (
            <p className="mb-4 text-sm text-destructive" role="alert">
              {deleteReview.error instanceof Error
                ? deleteReview.error.message
                : "Could not delete review."}
            </p>
          ) : null}
          <ul className="space-y-6">
          {displayReviews.length === 0 ? (
            <li className="text-sm text-muted-foreground">
              No reviews yet. Be the first to review.
            </li>
          ) : (
            displayReviews.map((r) => {
              const isMine = Boolean(
                viewerReview && session?.user && r.id === viewerReview.id,
              );
              return (
                <li
                  key={r.id}
                  className="border-b border-border pb-6 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-start gap-2 gap-y-1">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 gap-y-1">
                      <StarRating rating={r.stars} size="sm" />
                      <span className="text-sm font-medium">{r.authorName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    {isMine ? (
                      <div className="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          aria-label="Edit review"
                          disabled={deleteReview.isPending || submitReview.isPending}
                          onClick={startEditing}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          aria-label="Delete review"
                          disabled={deleteReview.isPending || submitReview.isPending}
                          onClick={onDelete}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  {r.comment ? (
                    <p className="mt-2 text-sm leading-relaxed text-foreground">{r.comment}</p>
                  ) : null}
                </li>
              );
            })
          )}
          </ul>
        </>
      )}
    </section>
  );
}
