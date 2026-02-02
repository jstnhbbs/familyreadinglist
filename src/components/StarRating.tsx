"use client";

const MAX_STARS = 5;

type StarRatingProps = {
  value: number | null;
  onChange?: (rating: number) => void;
  size?: "sm" | "md";
  readonly?: boolean;
};

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
};

const starPath =
  "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

export function StarRating({
  value,
  onChange,
  size = "md",
  readonly = false,
}: StarRatingProps) {
  const rating = value ?? 0;
  const isInteractive = !readonly && onChange;
  const sizeClass = sizeClasses[size];

  const handleClick = (n: number) => {
    if (isInteractive) onChange(n);
  };

  const handleKeyDown = (e: React.KeyboardEvent, n: number) => {
    if (!isInteractive) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange(n);
    }
  };

  return (
    <div
      className="flex items-center gap-0.5"
      role={readonly ? "img" : "group"}
      aria-label={
        value != null ? `${value} out of ${MAX_STARS} stars` : "No rating"
      }
    >
      {Array.from({ length: MAX_STARS }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= rating;
        return (
          <span
            key={starValue}
            className={`inline-block shrink-0 ${sizeClass} ${
              isInteractive
                ? "cursor-pointer rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1"
                : ""
            }`}
            onClick={() => handleClick(starValue)}
            onKeyDown={(e) => handleKeyDown(e, starValue)}
            tabIndex={isInteractive ? 0 : undefined}
            role={isInteractive ? "button" : undefined}
            aria-pressed={isInteractive ? filled : undefined}
          >
            <svg
              className={`${sizeClass} ${filled ? "text-amber-500" : "text-stone-300"}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path d={starPath} fillOpacity={filled ? 1 : 0.35} />
            </svg>
          </span>
        );
      })}
    </div>
  );
}
