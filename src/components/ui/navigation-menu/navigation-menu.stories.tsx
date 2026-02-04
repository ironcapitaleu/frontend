import type { Meta, StoryObj } from '@storybook/react-vite';

import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from './navigation-menu';
import { cn } from '@/lib/utils';

const components: { title: string; href: string; description: string }[] = [
	{
		title: 'Alert Dialog',
		href: '#alert-dialog',
		description:
			'A modal dialog that interrupts the user with important content and expects a response.',
	},
	{
		title: 'Hover Card',
		href: '#hover-card',
		description: 'For sighted users to preview content available behind a link.',
	},
	{
		title: 'Progress',
		href: '#progress',
		description:
			'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.',
	},
	{
		title: 'Scroll-area',
		href: '#scroll-area',
		description: 'Visually or semantically separates content.',
	},
	{
		title: 'Tabs',
		href: '#tabs',
		description:
			'A set of layered sections of content—known as tab panels—that are displayed one at a time.',
	},
	{
		title: 'Tooltip',
		href: '#tooltip',
		description:
			'A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.',
	},
];

function ListItem({
	className,
	title,
	href,
	children,
}: {
	className?: string;
	title: string;
	href: string;
	children: React.ReactNode;
}) {
	return (
		<li>
			<NavigationMenuLink
				href={href}
				className={cn(
					'hover:bg-muted focus:bg-muted block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors',
					className
				)}
			>
				<div className="text-sm font-medium leading-none">{title}</div>
				<p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
					{children}
				</p>
			</NavigationMenuLink>
		</li>
	);
}

function NavigationMenuDemo() {
	return (
		<NavigationMenu>
			<NavigationMenuList>
				<NavigationMenuItem>
					<NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
					<NavigationMenuContent>
						<ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
							<li className="row-span-3">
								<NavigationMenuLink
									href="#"
									className="from-muted/50 to-muted flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b p-6 no-underline outline-none focus:shadow-md"
								>
									<div className="mb-2 mt-4 text-lg font-medium">Design System</div>
									<p className="text-muted-foreground text-sm leading-tight">
										Beautifully designed components built with Base UI and Tailwind CSS.
									</p>
								</NavigationMenuLink>
							</li>
							<ListItem href="#introduction" title="Introduction">
								Re-usable components built using Base UI and Tailwind CSS.
							</ListItem>
							<ListItem href="#installation" title="Installation">
								How to install dependencies and structure your app.
							</ListItem>
							<ListItem href="#typography" title="Typography">
								Styles for headings, paragraphs, lists...etc
							</ListItem>
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuTrigger>Components</NavigationMenuTrigger>
					<NavigationMenuContent>
						<ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
							{components.map((component) => (
								<ListItem key={component.title} title={component.title} href={component.href}>
									{component.description}
								</ListItem>
							))}
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink className={navigationMenuTriggerStyle()} href="#documentation">
						Documentation
					</NavigationMenuLink>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
}

function SimpleNavigationMenu() {
	return (
		<NavigationMenu>
			<NavigationMenuList>
				<NavigationMenuItem>
					<NavigationMenuLink className={navigationMenuTriggerStyle()} href="#home">
						Home
					</NavigationMenuLink>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink className={navigationMenuTriggerStyle()} href="#about">
						About
					</NavigationMenuLink>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink className={navigationMenuTriggerStyle()} href="#contact">
						Contact
					</NavigationMenuLink>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
}

/**
 * A `Navigation Menu` is a component for building site navigation with support for dropdown menus. It is essentially a collection of links for navigating websites.
 * Use a `Navigation Menu` when you need accessible, keyboard-navigable site navigation with nested content panels. The difference between a `Navigation Menu` and a `Menubar` is that: A `Menubar` exposes commands and actions (often application-level), while a `Navigation Menu` primarily provides links for moving between pages or sections of the application.
 * `Navigation Menu`s are inherently interactive, allowing users to browse and select navigation destinations.
 */
const meta: Meta<typeof NavigationMenuDemo> = {
	title: 'Components/Navigation Menu',
	component: NavigationMenuDemo,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

// ==========================================
// PLAYGROUND
// ==========================================

/**
 * Interactive playground for the Navigation Menu component.
 * This example shows a complete navigation with dropdown menus and links.
 */
export const Playground: Story = {
	render: () => <NavigationMenuDemo />,
};

// ==========================================
// BASIC EXAMPLES
// ==========================================

/**
 * A simple navigation menu with only direct links (no dropdowns).
 */
export const Simple: Story = {
	render: () => <SimpleNavigationMenu />,
	parameters: {
		controls: { disable: true },
	},
};

/**
 * Navigation menu with a single dropdown trigger and content.
 */
export const WithDropdown: Story = {
	render: () => (
		<NavigationMenu>
			<NavigationMenuList>
				<NavigationMenuItem>
					<NavigationMenuTrigger>Products</NavigationMenuTrigger>
					<NavigationMenuContent>
						<ul className="grid w-[300px] gap-3 p-4">
							<ListItem href="#product-1" title="Product One">
								Our flagship product with amazing features.
							</ListItem>
							<ListItem href="#product-2" title="Product Two">
								A companion product for advanced users.
							</ListItem>
							<ListItem href="#product-3" title="Product Three">
								The budget-friendly option for everyone.
							</ListItem>
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink className={navigationMenuTriggerStyle()} href="#pricing">
						Pricing
					</NavigationMenuLink>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	),
	parameters: {
		controls: { disable: true },
	},
};

// ==========================================
// LAYOUT EXAMPLES
// ==========================================

/**
 * Navigation menu with a multi-column dropdown layout.
 */
export const MultiColumn: Story = {
	render: () => (
		<NavigationMenu>
			<NavigationMenuList>
				<NavigationMenuItem>
					<NavigationMenuTrigger>Resources</NavigationMenuTrigger>
					<NavigationMenuContent>
						<ul className="grid w-[500px] gap-3 p-4 md:grid-cols-2">
							<ListItem href="#docs" title="Documentation">
								Comprehensive guides and API references.
							</ListItem>
							<ListItem href="#tutorials" title="Tutorials">
								Step-by-step learning resources.
							</ListItem>
							<ListItem href="#examples" title="Examples">
								Code samples and starter templates.
							</ListItem>
							<ListItem href="#blog" title="Blog">
								Latest news and updates from our team.
							</ListItem>
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	),
	parameters: {
		controls: { disable: true },
	},
};

/**
 * Navigation menu with a featured item and grid layout.
 */
export const WithFeaturedItem: Story = {
	render: () => (
		<NavigationMenu>
			<NavigationMenuList>
				<NavigationMenuItem>
					<NavigationMenuTrigger>Explore</NavigationMenuTrigger>
					<NavigationMenuContent>
						<ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
							<li className="row-span-3">
								<NavigationMenuLink
									href="#featured"
									className="from-muted/50 to-muted flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b p-6 no-underline outline-none focus:shadow-md"
								>
									<div className="mb-2 mt-4 text-lg font-medium">Featured</div>
									<p className="text-muted-foreground text-sm leading-tight">
										Check out our latest featured content and highlights.
									</p>
								</NavigationMenuLink>
							</li>
							<ListItem href="#new" title="What's New">
								Latest updates and releases.
							</ListItem>
							<ListItem href="#popular" title="Popular">
								Most viewed content this week.
							</ListItem>
							<ListItem href="#trending" title="Trending">
								Hot topics in the community.
							</ListItem>
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	),
	parameters: {
		controls: { disable: true },
	},
};

// ==========================================
// COMPOSITION EXAMPLES
// ==========================================

/**
 * Navigation menu integrated with a simple header layout.
 */
export const InHeader: Story = {
	render: () => (
		<header className="border-border flex w-[800px] items-center justify-between border-b px-6 py-3">
			<div className="text-lg font-semibold">Logo</div>
			<NavigationMenuDemo />
			<div className="text-muted-foreground text-sm">Sign In</div>
		</header>
	),
	parameters: {
		controls: { disable: true },
		layout: 'padded',
	},
};

/**
 * Navigation menu with icons in the dropdown items.
 */
export const WithIcons: Story = {
	render: () => (
		<NavigationMenu>
			<NavigationMenuList>
				<NavigationMenuItem>
					<NavigationMenuTrigger>Account</NavigationMenuTrigger>
					<NavigationMenuContent>
						<ul className="grid w-[300px] gap-1 p-2">
							<li>
								<NavigationMenuLink
									href="#profile"
									className="hover:bg-muted focus:bg-muted flex items-center gap-3 rounded-md p-3 transition-colors"
								>
									<span className="bg-muted flex size-8 items-center justify-center rounded-md text-sm">
										👤
									</span>
									<div>
										<div className="text-sm font-medium">Profile</div>
										<p className="text-muted-foreground text-xs">Manage your account</p>
									</div>
								</NavigationMenuLink>
							</li>
							<li>
								<NavigationMenuLink
									href="#settings"
									className="hover:bg-muted focus:bg-muted flex items-center gap-3 rounded-md p-3 transition-colors"
								>
									<span className="bg-muted flex size-8 items-center justify-center rounded-md text-sm">
										⚙️
									</span>
									<div>
										<div className="text-sm font-medium">Settings</div>
										<p className="text-muted-foreground text-xs">Configure preferences</p>
									</div>
								</NavigationMenuLink>
							</li>
							<li>
								<NavigationMenuLink
									href="#logout"
									className="hover:bg-muted focus:bg-muted flex items-center gap-3 rounded-md p-3 transition-colors"
								>
									<span className="bg-muted flex size-8 items-center justify-center rounded-md text-sm">
										🚪
									</span>
									<div>
										<div className="text-sm font-medium">Sign Out</div>
										<p className="text-muted-foreground text-xs">Log out of your account</p>
									</div>
								</NavigationMenuLink>
							</li>
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	),
	parameters: {
		controls: { disable: true },
	},
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================
