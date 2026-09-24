import { Popover } from "@base-ui/react/popover";
import { useMemo } from "react";

import { buttonVariants } from "@/components/ui/button/variants";
import { formatDate } from "@/lib/company/dates";
import { filingsOf } from "@/lib/company/sources";
import type { Claim } from "@/lib/company/types";
import { cn } from "@/lib/utils";

/**
 * The "Sources" chip of a chart card (DESIGN.md §8). A click opens the
 * filings behind all of `claims`, newest first, each with its filing date and
 * a link. Like the sources index, it lists no market data. It sits in the
 * card header, next to the "Data" button. When no filing is left, it renders
 * nothing, as the sources index does, since a chip that opens onto nothing
 * only adds a control.
 */
function SourcesChip({ claims }: { claims: readonly Claim[] }) {
	const filings = useMemo(() => filingsOf(claims), [claims]);
	if (filings.length === 0) {
		return null;
	}
	return (
		<Popover.Root>
			<Popover.Trigger
				className={cn(
					buttonVariants({ variant: "outline", size: "sm" }),
					"rounded-full",
				)}
			>
				Sources
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Positioner align="end" sideOffset={8} className="z-50">
					<Popover.Popup
						aria-label="Sources of the chart"
						className="max-h-96 w-100 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md outline-none"
					>
						<ul className="flex flex-col gap-3 text-base">
							{filings.map((filing) => (
								<li key={filing.accessionNumber}>
									<p className="font-medium">
										{filing.form} for {filing.periodLabel}
									</p>
									<p className="text-muted-foreground">
										Filed {formatDate(filing.filedOn)}
									</p>
									<a
										href={filing.indexUrl}
										target="_blank"
										rel="noreferrer"
										className="text-primary underline underline-offset-4"
									>
										Open the filing on SEC EDGAR
									</a>
								</li>
							))}
						</ul>
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	);
}

export { SourcesChip };
