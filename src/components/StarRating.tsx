"use client";

import { useId } from "react";

const MAX_STARS = 5;

type StarRatingProps = {
  value: number | null;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
};

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-8 w-8",
};

const starPath =
  "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

export function StarRating({
  value,
  onChange,
  size = "md",
  readonly = false,
}: StarRatingProps) {
  // Normalize to 0–5 in 0.5 steps so half-stars render correctly (avoids int/float coercion)
  const rating =
    value != null
      ? Math.min(5, Math.max(0, Math.round(Number(value) * 2) / 2))
      : 0;
  const isInteractive = !readonly && onChange;
  const sizeClass = sizeClasses[size];
  const baseId = useId().replace(/:/g, "");

  const handleClick = (clickValue: number) => {
    if (isInteractive) onChange(clickValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent, clickValue: number) => {
    if (!isInteractive) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange(clickValue);
    }
  };

  return (
    <div
      className="flex items-center gap-0.5"
      role={readonly ? "img" : "group"}
      aria-label={
        value != null
          ? `${rating} out of ${MAX_STARS} stars`
          : "No rating"
      }
    >
      {Array.from({ length: MAX_STARS }, (_, i) => {
        const starIndex = i + 1;
        const rawFill = rating - (starIndex - 1);
        const fillRatio = Math.min(
          1,
          Math.max(0, Math.round(rawFill * 100) / 100)
        );
        const halfValue = starIndex - 0.5;
        const fullValue = starIndex;
        return (
          <span
            key={starIndex}
            className={`relative inline-flex shrink-0 ${sizeClass} ${
              isInteractive
                ? "cursor-pointer rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-1"
                : ""
            }`}
            role={isInteractive ? "group" : undefined}
            aria-label={
              isInteractive
                ? `Rate ${halfValue} or ${fullValue} stars`
                : undefined
            }
          >
            <svg
              className={sizeClass}
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              aria-hidden
            >
              <defs>
                <mask id={`${baseId}-star-mask-${i}`}>
                  <rect x="0" y="0" width="20" height="20" fill="white" />
                  <rect
                    x={20 * fillRatio}
                    y="0"
                    width={20 * (1 - fillRatio)}
                    height="20"
                    fill="black"
                  />
                </mask>
              </defs>
              {/* Unfilled – visible gray for contrast */}
              <path
                d={starPath}
                fill="currentColor"
                className="text-stone-500"
                fillOpacity={0.65}
              />
              {/* Filled portion – dark amber, masked to show left portion only */}
              <path
                d={starPath}
                fill="currentColor"
                className="text-amber-700"
                mask={`url(#${baseId}-star-mask-${i})`}
              />
            </svg>
            {isInteractive && (
              <>
                <span
                  className="absolute left-0 top-0 h-full w-1/2 cursor-pointer rounded-l"
                  onClick={() => handleClick(halfValue)}
                  onKeyDown={(e) => handleKeyDown(e, halfValue)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${halfValue} stars`}
                />
                <span
                  className="absolute left-1/2 top-0 h-full w-1/2 cursor-pointer rounded-r"
                  onClick={() => handleClick(fullValue)}
                  onKeyDown={(e) => handleKeyDown(e, fullValue)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${fullValue} stars`}
                />
              </>
            )}
          </span>
        );
      })}
    </div>
  );
}
