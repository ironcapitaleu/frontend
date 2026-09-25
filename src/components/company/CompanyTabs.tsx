import type * as React from "react";
import { useEffect, useRef } from "react";
import { Link } from "react-router";

import { COMPANY_TABS, tabPath } from "@/lib/company/tabs";
import type { TabKey } from "@/lib/company/types";
import type { Assert } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Props for {@link CompanyTabs}. */
interface CompanyTabsProps extends Omit<React.ComponentProps<"nav">, "ref"> {
	/** The ticker the tab links point at, such as `MRDN`. */
	symbol: string;
	/** The tab of the current URL. Its link carries `aria-current="page"`. */
	activeTab: TabKey;
}

/**
 * The tab strip of the company page, the second region of every tab
 * (DESIGN.md §8 "Shared Layout"). It links to the seven tabs in the order of
 * `COMPANY_TABS`, which copies the URL table, and sits above a hairline.
 *
 * Each tab is its own URL, so the strip is a `nav` of links, not an ARIA
 * `tablist`. The link of the active tab carries `aria-current="page"` and an
 * underline. On a phone the row scrolls sideways, and it scrolls the active
 * tab into view so a reader who opens a later tab by URL sees it marked.
 */
function CompanyTabs({
	symbol,
	activeTab,
	className,
	...props
}: CompanyTabsProps) {
	const navRef = useRef<HTMLElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: re-centre the strip each time the active tab changes.
	useEffect(() => {
		const nav = navRef.current;
		const link = nav?.querySelector<HTMLElement>('[aria-current="page"]');
		if (!nav || !link) return;
		nav.scrollLeft = link.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2;
	}, [activeTab]);

	return (
		<nav
			ref={navRef}
			data-slot="company-tabs"
			aria-label="Company sections"
			className={cn(
				"relative overflow-x-auto border-b border-border print:hidden",
				className,
			)}
			{...props}
		>
			<ul className="flex w-max gap-1">
				{COMPANY_TABS.map((tab) => {
					const active = tab.key === activeTab;
					return (
						<li key={tab.key}>
							<Link
								to={tabPath(symbol, tab)}
								aria-current={active ? "page" : undefined}
								className={cn(
									"flex h-12 items-center whitespace-nowrap px-3 text-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset md:px-4",
									active
										? "font-medium text-foreground shadow-[inset_0_-2px_0_var(--color-foreground)]"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{tab.label}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}

// Fails the type check when a caller can pass a `ref`. The spread props come
// after `navRef`, so such a ref would replace it and stop the centring effect.
export type CompanyTabsTakesNoRef = Assert<
	"ref" extends keyof CompanyTabsProps ? false : true
>;

export { CompanyTabs, type CompanyTabsProps };
