import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "./pagination";

// Shared hook for pagination logic
function usePagination(totalPages: number, initialPage = 1) {
	const [currentPage, setCurrentPage] = React.useState(initialPage);

	const goToPage = (page: number) => {
		setCurrentPage(Math.max(1, Math.min(totalPages, page)));
	};

	const goToPrevious = () => goToPage(currentPage - 1);
	const goToNext = () => goToPage(currentPage + 1);

	const getVisiblePages = () => {
		const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [];

		if (totalPages <= 7) {
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}

		pages.push(1);

		if (currentPage > 3) {
			pages.push("ellipsis-start");
		}

		const start = Math.max(2, currentPage - 1);
		const end = Math.min(totalPages - 1, currentPage + 1);

		for (let i = start; i <= end; i++) {
			pages.push(i);
		}

		if (currentPage < totalPages - 2) {
			pages.push("ellipsis-end");
		}

		pages.push(totalPages);

		return pages;
	};

	return {
		currentPage,
		totalPages,
		goToPage,
		goToPrevious,
		goToNext,
		getVisiblePages,
		isFirstPage: currentPage === 1,
		isLastPage: currentPage === totalPages,
	};
}

function PaginationDemo() {
	const {
		currentPage,
		goToPage,
		goToPrevious,
		goToNext,
		getVisiblePages,
		isFirstPage,
		isLastPage,
	} = usePagination(10);

	return (
		<Pagination>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						href="#"
						onClick={(e) => {
							e.preventDefault();
							goToPrevious();
						}}
						className={isFirstPage ? "pointer-events-none opacity-50" : ""}
					/>
				</PaginationItem>
				{getVisiblePages().map((page) =>
					typeof page === "string" ? (
						<PaginationItem key={page}>
							<PaginationEllipsis />
						</PaginationItem>
					) : (
						<PaginationItem key={page}>
							<PaginationLink
								href="#"
								isActive={page === currentPage}
								onClick={(e) => {
									e.preventDefault();
									goToPage(page);
								}}
							>
								{page}
							</PaginationLink>
						</PaginationItem>
					),
				)}
				<PaginationItem>
					<PaginationNext
						href="#"
						onClick={(e) => {
							e.preventDefault();
							goToNext();
						}}
						className={isLastPage ? "pointer-events-none opacity-50" : ""}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}

/**
 * A `Pagination` component divides large sets of content into discrete pages and lets users navigate between them.
 * Use `Pagination` when you need to split large datasets or content across multiple pages. Use it where loading or showing everything at once would be overwhelming or inefficient.
 * `Pagination` is inherently interactive, allowing users to navigate between pages.
 */
const meta: Meta<typeof PaginationDemo> = {
	title: "Components/Pagination",
	component: PaginationDemo,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

// ==========================================
// PLAYGROUND
// ==========================================

/**
 * Interactive playground for the Pagination component.
 * This example shows a typical pagination with previous/next buttons and page numbers.
 */
export const Playground: Story = {
	render: () => <PaginationDemo />,
};

// ==========================================
// BASIC EXAMPLES
// ==========================================

/**
 * Simple pagination with just previous and next buttons.
 */
export const Simple: Story = {
	render: () => {
		const {
			currentPage,
			totalPages,
			goToPrevious,
			goToNext,
			isFirstPage,
			isLastPage,
		} = usePagination(10);

		return (
			<div className="space-y-4">
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								href="#"
								onClick={(e) => {
									e.preventDefault();
									goToPrevious();
								}}
								className={isFirstPage ? "pointer-events-none opacity-50" : ""}
							/>
						</PaginationItem>
						<PaginationItem>
							<PaginationNext
								href="#"
								onClick={(e) => {
									e.preventDefault();
									goToNext();
								}}
								className={isLastPage ? "pointer-events-none opacity-50" : ""}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
				<p className="text-muted-foreground text-center text-sm">
					Page {currentPage} of {totalPages}
				</p>
			</div>
		);
	},
	parameters: {
		controls: { disable: true },
	},
};

/**
 * Pagination with page numbers only (no previous/next).
 */
export const NumbersOnly: Story = {
	render: () => {
		const { currentPage, goToPage } = usePagination(5);

		return (
			<Pagination>
				<PaginationContent>
					{[1, 2, 3, 4, 5].map((page) => (
						<PaginationItem key={page}>
							<PaginationLink
								href="#"
								isActive={page === currentPage}
								onClick={(e) => {
									e.preventDefault();
									goToPage(page);
								}}
							>
								{page}
							</PaginationLink>
						</PaginationItem>
					))}
				</PaginationContent>
			</Pagination>
		);
	},
	parameters: {
		controls: { disable: true },
	},
};

// ==========================================
// LAYOUT EXAMPLES
// ==========================================

/**
 * Pagination with ellipsis for large page counts.
 */
export const WithEllipsis: Story = {
	render: () => {
		const {
			currentPage,
			goToPage,
			goToPrevious,
			goToNext,
			getVisiblePages,
			isFirstPage,
			isLastPage,
		} = usePagination(10, 5);

		return (
			<Pagination>
				<PaginationContent>
					<PaginationItem>
						<PaginationPrevious
							href="#"
							onClick={(e) => {
								e.preventDefault();
								goToPrevious();
							}}
							className={isFirstPage ? "pointer-events-none opacity-50" : ""}
						/>
					</PaginationItem>
					{getVisiblePages().map((page) =>
						typeof page === "string" ? (
							<PaginationItem key={page}>
								<PaginationEllipsis />
							</PaginationItem>
						) : (
							<PaginationItem key={page}>
								<PaginationLink
									href="#"
									isActive={page === currentPage}
									onClick={(e) => {
										e.preventDefault();
										goToPage(page);
									}}
								>
									{page}
								</PaginationLink>
							</PaginationItem>
						),
					)}
					<PaginationItem>
						<PaginationNext
							href="#"
							onClick={(e) => {
								e.preventDefault();
								goToNext();
							}}
							className={isLastPage ? "pointer-events-none opacity-50" : ""}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		);
	},
	parameters: {
		controls: { disable: true },
	},
};

/**
 * Pagination at the first page.
 */
export const FirstPage: Story = {
	render: () => {
		const {
			currentPage,
			goToPage,
			goToPrevious,
			goToNext,
			getVisiblePages,
			isFirstPage,
			isLastPage,
		} = usePagination(10, 1);

		return (
			<Pagination>
				<PaginationContent>
					<PaginationItem>
						<PaginationPrevious
							href="#"
							onClick={(e) => {
								e.preventDefault();
								goToPrevious();
							}}
							className={isFirstPage ? "pointer-events-none opacity-50" : ""}
						/>
					</PaginationItem>
					{getVisiblePages().map((page) =>
						typeof page === "string" ? (
							<PaginationItem key={page}>
								<PaginationEllipsis />
							</PaginationItem>
						) : (
							<PaginationItem key={page}>
								<PaginationLink
									href="#"
									isActive={page === currentPage}
									onClick={(e) => {
										e.preventDefault();
										goToPage(page);
									}}
								>
									{page}
								</PaginationLink>
							</PaginationItem>
						),
					)}
					<PaginationItem>
						<PaginationNext
							href="#"
							onClick={(e) => {
								e.preventDefault();
								goToNext();
							}}
							className={isLastPage ? "pointer-events-none opacity-50" : ""}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		);
	},
	parameters: {
		controls: { disable: true },
	},
};

/**
 * Pagination at the last page.
 */
export const LastPage: Story = {
	render: () => {
		const {
			currentPage,
			goToPage,
			goToPrevious,
			goToNext,
			getVisiblePages,
			isFirstPage,
			isLastPage,
		} = usePagination(10, 10);

		return (
			<Pagination>
				<PaginationContent>
					<PaginationItem>
						<PaginationPrevious
							href="#"
							onClick={(e) => {
								e.preventDefault();
								goToPrevious();
							}}
							className={isFirstPage ? "pointer-events-none opacity-50" : ""}
						/>
					</PaginationItem>
					{getVisiblePages().map((page) =>
						typeof page === "string" ? (
							<PaginationItem key={page}>
								<PaginationEllipsis />
							</PaginationItem>
						) : (
							<PaginationItem key={page}>
								<PaginationLink
									href="#"
									isActive={page === currentPage}
									onClick={(e) => {
										e.preventDefault();
										goToPage(page);
									}}
								>
									{page}
								</PaginationLink>
							</PaginationItem>
						),
					)}
					<PaginationItem>
						<PaginationNext
							href="#"
							onClick={(e) => {
								e.preventDefault();
								goToNext();
							}}
							className={isLastPage ? "pointer-events-none opacity-50" : ""}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		);
	},
	parameters: {
		controls: { disable: true },
	},
};

// ==========================================
// INTERACTIVE EXAMPLES
// ==========================================

/**
 * Controlled pagination with state management and page indicator.
 */
export const Controlled: Story = {
	render: () => {
		const {
			currentPage,
			totalPages,
			goToPage,
			goToPrevious,
			goToNext,
			getVisiblePages,
			isFirstPage,
			isLastPage,
		} = usePagination(10);

		return (
			<div className="space-y-4">
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								href="#"
								onClick={(e) => {
									e.preventDefault();
									goToPrevious();
								}}
								className={isFirstPage ? "pointer-events-none opacity-50" : ""}
							/>
						</PaginationItem>
						{getVisiblePages().map((page) =>
							typeof page === "string" ? (
								<PaginationItem key={page}>
									<PaginationEllipsis />
								</PaginationItem>
							) : (
								<PaginationItem key={page}>
									<PaginationLink
										href="#"
										isActive={page === currentPage}
										onClick={(e) => {
											e.preventDefault();
											goToPage(page);
										}}
									>
										{page}
									</PaginationLink>
								</PaginationItem>
							),
						)}
						<PaginationItem>
							<PaginationNext
								href="#"
								onClick={(e) => {
									e.preventDefault();
									goToNext();
								}}
								className={isLastPage ? "pointer-events-none opacity-50" : ""}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
				<p className="text-muted-foreground text-center text-sm">
					Page {currentPage} of {totalPages}
				</p>
			</div>
		);
	},
	parameters: {
		controls: { disable: true },
	},
};

// ==========================================
// COMPOSITION EXAMPLES
// ==========================================

/**
 * Pagination with item count displayed below.
 */
export const WithItemCount: Story = {
	render: () => {
		const {
			currentPage,
			goToPage,
			goToPrevious,
			goToNext,
			getVisiblePages,
			isFirstPage,
			isLastPage,
		} = usePagination(10, 3);

		const itemsPerPage = 10;
		const totalItems = 97;
		const startItem = (currentPage - 1) * itemsPerPage + 1;
		const endItem = Math.min(currentPage * itemsPerPage, totalItems);

		return (
			<div className="space-y-4">
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								href="#"
								onClick={(e) => {
									e.preventDefault();
									goToPrevious();
								}}
								className={isFirstPage ? "pointer-events-none opacity-50" : ""}
							/>
						</PaginationItem>
						{getVisiblePages().map((page) =>
							typeof page === "string" ? (
								<PaginationItem key={page}>
									<PaginationEllipsis />
								</PaginationItem>
							) : (
								<PaginationItem key={page}>
									<PaginationLink
										href="#"
										isActive={page === currentPage}
										onClick={(e) => {
											e.preventDefault();
											goToPage(page);
										}}
									>
										{page}
									</PaginationLink>
								</PaginationItem>
							),
						)}
						<PaginationItem>
							<PaginationNext
								href="#"
								onClick={(e) => {
									e.preventDefault();
									goToNext();
								}}
								className={isLastPage ? "pointer-events-none opacity-50" : ""}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
				<p className="text-muted-foreground text-center text-sm">
					Showing {startItem}-{endItem} of {totalItems} items
				</p>
			</div>
		);
	},
	parameters: {
		controls: { disable: true },
	},
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================
