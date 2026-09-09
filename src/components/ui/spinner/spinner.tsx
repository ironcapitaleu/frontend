import { cn } from "@/lib/utils";
import { spinnerVariants, type SpinnerVariants } from "./variants";

type SpinnerProps = React.ComponentProps<"svg"> &
	SpinnerVariants & {
		/**
		 * Accessible name announced to screen readers. Defaults to `"Loading"`.
		 */
		label?: string;
	};

/**
 * `Spinner` is an indeterminate loading indicator — a rotating ring for waits
 * whose length is unknown (a submit in flight, a page fetching). Reach for
 * `Progress` instead when the completion amount is known, and `Skeleton` when a
 * placeholder should hold the shape of the content itself.
 *
 * Its strokes use `currentColor` with a `text-muted-foreground` default, so a
 * `text-*` class on the element (or an ancestor) recolors it; `size` sets the
 * diameter.
 */
function Spinner({
	className,
	size,
	label = "Loading",
	...props
}: SpinnerProps) {
	return (
		<svg
			data-slot="spinner"
			role="status"
			aria-label={label}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={cn(spinnerVariants({ size }), className)}
			{...props}
		>
			<circle
				cx="12"
				cy="12"
				r="10"
				stroke="currentColor"
				strokeWidth="3"
				className="opacity-25"
			/>
			<path
				d="M12 2a10 10 0 0 1 10 10"
				stroke="currentColor"
				strokeWidth="3"
				strokeLinecap="round"
			/>
		</svg>
	);
}

export { Spinner };
