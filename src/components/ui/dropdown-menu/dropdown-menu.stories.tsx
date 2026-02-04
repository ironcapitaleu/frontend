import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';

import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from './dropdown-menu';
import { Button, BUTTON_SIZES, BUTTON_VARIANTS } from '../button';
import {
	MoreVerticalIcon,
	FileIcon,
	FolderIcon,
	FolderOpenIcon,
	FileCodeIcon,
	MoreHorizontalIcon,
	FolderSearchIcon,
	SaveIcon,
	DownloadIcon,
	EyeIcon,
	LayoutIcon,
	PaletteIcon,
	SunIcon,
	MoonIcon,
	MonitorIcon,
	UserIcon,
	LogOutIcon,
} from 'lucide-react';

type DropdownMenuStoryArgs = {
	triggerLabel: string;
	triggerVariant: (typeof BUTTON_VARIANTS)[number];
	triggerSize: (typeof BUTTON_SIZES)[number];
	contentAlign: 'start' | 'center' | 'end';
	contentSide: 'top' | 'right' | 'bottom' | 'left';
	sideOffset: number;
};

/**
 * A `DropdownMenu` displays a list of actions and options triggered by a button.
 * Use a `DropdownMenu` for contextual actions, grouped commands, and optional settings.
 * It is inherently interactive, because users must actively open the menu and make a selection.
 */
const meta: Meta<DropdownMenuStoryArgs> = {
	title: 'Components/DropdownMenu',
	tags: ['autodocs'],
	args: {
		triggerLabel: 'More options',
		triggerVariant: 'ghost',
		triggerSize: 'icon',
		contentAlign: 'end',
		contentSide: 'bottom',
		sideOffset: 4,
	},
	argTypes: {
		triggerLabel: { control: 'text' },
		triggerVariant: { control: 'select', options: BUTTON_VARIANTS },
		triggerSize: { control: 'select', options: BUTTON_SIZES },
		contentAlign: { control: 'inline-radio', options: ['start', 'center', 'end'] },
		contentSide: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
		sideOffset: { control: { type: 'number', min: 0, max: 24, step: 1 } },
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

const renderMenu: Story['render'] = ({
	triggerLabel,
	triggerVariant,
	triggerSize,
	contentAlign,
	contentSide,
	sideOffset,
}) => {
	const [toggles, setToggles] = React.useState({
		sidebar: true,
		statusBar: false,
	});
	const [theme, setTheme] = React.useState<'light' | 'dark' | 'system'>('light');

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant={triggerVariant} size={triggerSize} />}>
				<MoreVerticalIcon />
				<span className="sr-only">{triggerLabel}</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align={contentAlign}
				side={contentSide}
				sideOffset={sideOffset}
				className="w-56"
			>
				<DropdownMenuGroup>
					<DropdownMenuLabel>File</DropdownMenuLabel>
					<DropdownMenuItem>
						<FileIcon />
						New File
						<DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
					</DropdownMenuItem>
					<DropdownMenuItem>
						<FolderIcon />
						New Folder
						<DropdownMenuShortcut>⇧⌘N</DropdownMenuShortcut>
					</DropdownMenuItem>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							<FolderOpenIcon />
							Open Recent
						</DropdownMenuSubTrigger>
						<DropdownMenuPortal>
							<DropdownMenuSubContent>
								<DropdownMenuGroup>
									<DropdownMenuLabel>Recent Projects</DropdownMenuLabel>
									<DropdownMenuItem>
										<FileCodeIcon />
										Project Alpha
									</DropdownMenuItem>
									<DropdownMenuItem>
										<FileCodeIcon />
										Project Beta
									</DropdownMenuItem>
									<DropdownMenuSub>
										<DropdownMenuSubTrigger>
											<MoreHorizontalIcon />
											More Projects
										</DropdownMenuSubTrigger>
										<DropdownMenuPortal>
											<DropdownMenuSubContent>
												<DropdownMenuItem>
													<FileCodeIcon />
													Project Gamma
												</DropdownMenuItem>
												<DropdownMenuItem>
													<FileCodeIcon />
													Project Delta
												</DropdownMenuItem>
											</DropdownMenuSubContent>
										</DropdownMenuPortal>
									</DropdownMenuSub>
								</DropdownMenuGroup>
								<DropdownMenuSeparator />
								<DropdownMenuGroup>
									<DropdownMenuItem>
										<FolderSearchIcon />
										Browse...
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</DropdownMenuSubContent>
						</DropdownMenuPortal>
					</DropdownMenuSub>
					<DropdownMenuSeparator />
					<DropdownMenuItem>
						<SaveIcon />
						Save
						<DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
					</DropdownMenuItem>
					<DropdownMenuItem>
						<DownloadIcon />
						Export
						<DropdownMenuShortcut>⇧⌘E</DropdownMenuShortcut>
					</DropdownMenuItem>
				</DropdownMenuGroup>

				<DropdownMenuSeparator />

				<DropdownMenuGroup>
					<DropdownMenuLabel>View</DropdownMenuLabel>
					<DropdownMenuCheckboxItem
						checked={toggles.sidebar}
						onCheckedChange={(checked) =>
							setToggles((prev) => ({ ...prev, sidebar: checked === true }))
						}
					>
						<EyeIcon />
						Show Sidebar
					</DropdownMenuCheckboxItem>
					<DropdownMenuCheckboxItem
						checked={toggles.statusBar}
						onCheckedChange={(checked) =>
							setToggles((prev) => ({ ...prev, statusBar: checked === true }))
						}
					>
						<LayoutIcon />
						Show Status Bar
					</DropdownMenuCheckboxItem>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							<PaletteIcon />
							Theme
						</DropdownMenuSubTrigger>
						<DropdownMenuPortal>
							<DropdownMenuSubContent>
								<DropdownMenuGroup>
									<DropdownMenuLabel>Appearance</DropdownMenuLabel>
									<DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
										<DropdownMenuRadioItem value="light">
											<SunIcon />
											Light
										</DropdownMenuRadioItem>
										<DropdownMenuRadioItem value="dark">
											<MoonIcon />
											Dark
										</DropdownMenuRadioItem>
										<DropdownMenuRadioItem value="system">
											<MonitorIcon />
											System
										</DropdownMenuRadioItem>
									</DropdownMenuRadioGroup>
								</DropdownMenuGroup>
							</DropdownMenuSubContent>
						</DropdownMenuPortal>
					</DropdownMenuSub>
				</DropdownMenuGroup>

				<DropdownMenuSeparator />

				<DropdownMenuGroup>
					<DropdownMenuLabel>Account</DropdownMenuLabel>
					<DropdownMenuItem>
						<UserIcon />
						Profile
					</DropdownMenuItem>
					<DropdownMenuItem variant="destructive">
						<LogOutIcon />
						Sign Out
						<DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

// ==========================================
// PLAYGROUND
// ==========================================

export const Playground: Story = {
	render: renderMenu,
};

// ==========================================
// ALIGNMENT STORIES
// ==========================================

export const AlignStart: Story = {
	render: renderMenu,
	args: {
		contentAlign: 'start',
	},
	argTypes: {
		contentAlign: { control: { disable: true } },
	},
};

export const AlignEnd: Story = {
	render: renderMenu,
	args: {
		contentAlign: 'end',
	},
	argTypes: {
		contentAlign: { control: { disable: true } },
	},
};

// ==========================================
// COMPOSITION STORIES
// ==========================================

export const Simple: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="outline" size="default" />}>Open menu</DropdownMenuTrigger>
			<DropdownMenuContent className="w-44">
				<DropdownMenuItem>Profile</DropdownMenuItem>
				<DropdownMenuItem>Settings</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	),
};

export const WithInsetItems: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="outline" size="default" />}>Inset items</DropdownMenuTrigger>
			<DropdownMenuContent className="w-48">
				<DropdownMenuGroup>
					<DropdownMenuLabel inset>Account</DropdownMenuLabel>
					<DropdownMenuItem inset>Profile</DropdownMenuItem>
					<DropdownMenuItem inset>Billing</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem inset variant="destructive">
						Sign out
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	),
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================
