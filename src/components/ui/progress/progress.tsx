import { Progress as ProgressPrimitive } from "@base-ui/react/progress";

import { cn } from "@/lib/utils";
import {
	progressIndicatorStyles,
	progressVariants,
	type ProgressVariants,
} from "./variants";

type ProgressProps = ProgressPrimitive.Root.Props & ProgressVariants;

/**
 * `Progress` is a determinate loading bar. It shows how far a known task has
 * advanced, from `0` to `max` (default `100`). Pass `value={null}` for a task
 * whose length is unknown, and the bar fills and pulses instead.
 *
 * Use `Spinner` for a compact indeterminate wait, and `Skeleton` when a
 * placeholder must hold the shape of the content itself.
 */
function Progress({ className, size, value, ...props }: ProgressProps) {
	return (
		<ProgressPrimitive.Root
			data-slot="progress"
			value={value}
			className={cn("w-full", className)}
			{...props}
		>
			<ProgressPrimitive.Track className={progressVariants({ size })}>
				<ProgressPrimitive.Indicator className={progressIndicatorStyles} />
			</ProgressPrimitive.Track>
		</ProgressPrimitive.Root>
	);
}

export { Progress };
