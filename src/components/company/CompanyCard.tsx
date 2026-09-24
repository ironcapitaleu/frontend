import * as React from "react";

import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { COMPANY_TABS } from "@/lib/company/tabs";
import type { TabKey } from "@/lib/company/types";
import { cn } from "@/lib/utils";

/** Props for {@link CompanyCard}. */
interface CompanyCardProps extends Omit<React.ComponentProps<"div">, "title"> {
	/** The tab that holds the card. Its row in the URL table is the first number of the title. */
	tab: TabKey;
	/** The card's place in the tab, from 1, read top to bottom and then left to right. */
	position: number;
	/** The title without its number, such as `Buybacks Net of Shares Issued to Staff`. */
	title: string;
	/** The muted line under the title. It names the period, the unit and the filing. */
	caption: React.ReactNode;
	/** The "Data" button and the "Sources" chip, at the right of the title. */
	actions?: React.ReactNode;
	/** How many columns of a desktop {@link CompanyCardGrid} the card takes. */
	span?: 1 | 2;
}

/**
 * One card of a company page tab (DESIGN.md §8 "Shared Layout", region 3).
 * The serif title carries the number `row.position`, such as
 * "4.3 Buybacks Net of Shares Issued to Staff". `actions` sit at the right of
 * the title. On a phone they stack, so the "Data" button sits above the
 * "Sources" chip.
 */
function CompanyCard({
	tab,
	position,
	title,
	caption,
	actions,
	span = 1,
	className,
	children,
	...props
}: CompanyCardProps) {
	const row = COMPANY_TABS.findIndex(({ key }) => key === tab) + 1;
	const titleId = React.useId();
	return (
		<Card
			role="region"
			aria-labelledby={titleId}
			data-span={span}
			className={cn(span === 2 && "lg:col-span-2", className)}
			{...props}
		>
			<CardHeader>
				<CardTitle>
					<h3 id={titleId} className="font-serif text-xl font-normal">
						{row}.{position} {title}
					</h3>
				</CardTitle>
				<CardDescription>{caption}</CardDescription>
				{actions && (
					<CardAction className="flex flex-col items-end gap-2 md:flex-row md:items-center">
						{actions}
					</CardAction>
				)}
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}

/**
 * The grid that holds the cards of one tab: two equal columns on a desktop,
 * one column below 1024 px (DESIGN.md §8 "Shared Layout").
 */
function CompanyCardGrid({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="company-card-grid"
			className={cn("grid grid-cols-1 gap-6 lg:grid-cols-2", className)}
			{...props}
		/>
	);
}

export { CompanyCard, CompanyCardGrid, type CompanyCardProps };
