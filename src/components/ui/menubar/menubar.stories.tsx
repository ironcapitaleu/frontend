import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import {
	Menubar,
	MenubarCheckboxItem,
	MenubarContent,
	MenubarGroup,
	MenubarItem,
	MenubarLabel,
	MenubarMenu,
	MenubarPortal,
	MenubarRadioGroup,
	MenubarRadioItem,
	MenubarSeparator,
	MenubarShortcut,
	MenubarSub,
	MenubarSubContent,
	MenubarSubTrigger,
	MenubarTrigger,
} from "./menubar";
import {
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
	CopyIcon,
	ClipboardIcon,
	ScissorsIcon,
	Undo2Icon,
	Redo2Icon,
	ZoomInIcon,
	ZoomOutIcon,
	MaximizeIcon,
	MinusIcon,
	BugIcon,
	PlayIcon,
	TerminalIcon,
	HelpCircleIcon,
	BookOpenIcon,
	MessageCircleIcon,
} from "lucide-react";

type MenubarStoryArgs = {
	showFileMenu: boolean;
	showEditMenu: boolean;
	showViewMenu: boolean;
	showIcons: boolean;
	showShortcuts: boolean;
};

function MenubarStory({
	showFileMenu = true,
	showEditMenu = true,
	showViewMenu = true,
	showIcons = true,
	showShortcuts = true,
}: MenubarStoryArgs) {
	const [toggles, setToggles] = React.useState({
		sidebar: true,
		statusBar: false,
		minimap: true,
	});
	const [theme, setTheme] = React.useState<"light" | "dark" | "system">(
		"light",
	);

	return (
		<Menubar>
			{showFileMenu && (
				<MenubarMenu>
					<MenubarTrigger>File</MenubarTrigger>
					<MenubarContent>
						<MenubarGroup>
							<MenubarItem>
								{showIcons && <FileIcon />}
								New File
								{showShortcuts && <MenubarShortcut>⌘N</MenubarShortcut>}
							</MenubarItem>
							<MenubarItem>
								{showIcons && <FolderIcon />}
								New Folder
								{showShortcuts && <MenubarShortcut>⇧⌘N</MenubarShortcut>}
							</MenubarItem>
							<MenubarSub>
								<MenubarSubTrigger>
									{showIcons && <FolderOpenIcon />}
									Open Recent
								</MenubarSubTrigger>
								<MenubarPortal>
									<MenubarSubContent>
										<MenubarGroup>
											<MenubarLabel>Recent Projects</MenubarLabel>
											<MenubarItem>
												{showIcons && <FileCodeIcon />}
												Project Alpha
											</MenubarItem>
											<MenubarItem>
												{showIcons && <FileCodeIcon />}
												Project Beta
											</MenubarItem>
											<MenubarSub>
												<MenubarSubTrigger>
													{showIcons && <MoreHorizontalIcon />}
													More Projects
												</MenubarSubTrigger>
												<MenubarPortal>
													<MenubarSubContent>
														<MenubarItem>
															{showIcons && <FileCodeIcon />}
															Project Gamma
														</MenubarItem>
														<MenubarItem>
															{showIcons && <FileCodeIcon />}
															Project Delta
														</MenubarItem>
													</MenubarSubContent>
												</MenubarPortal>
											</MenubarSub>
										</MenubarGroup>
										<MenubarSeparator />
										<MenubarGroup>
											<MenubarItem>
												{showIcons && <FolderSearchIcon />}
												Browse...
											</MenubarItem>
										</MenubarGroup>
									</MenubarSubContent>
								</MenubarPortal>
							</MenubarSub>
							<MenubarSeparator />
							<MenubarItem>
								{showIcons && <SaveIcon />}
								Save
								{showShortcuts && <MenubarShortcut>⌘S</MenubarShortcut>}
							</MenubarItem>
							<MenubarItem>
								{showIcons && <DownloadIcon />}
								Export
								{showShortcuts && <MenubarShortcut>⇧⌘E</MenubarShortcut>}
							</MenubarItem>
						</MenubarGroup>
					</MenubarContent>
				</MenubarMenu>
			)}

			{showEditMenu && (
				<MenubarMenu>
					<MenubarTrigger>Edit</MenubarTrigger>
					<MenubarContent>
						<MenubarGroup>
							<MenubarItem>
								{showIcons && <Undo2Icon />}
								Undo
								{showShortcuts && <MenubarShortcut>⌘Z</MenubarShortcut>}
							</MenubarItem>
							<MenubarItem>
								{showIcons && <Redo2Icon />}
								Redo
								{showShortcuts && <MenubarShortcut>⇧⌘Z</MenubarShortcut>}
							</MenubarItem>
						</MenubarGroup>
						<MenubarSeparator />
						<MenubarGroup>
							<MenubarItem>
								{showIcons && <ScissorsIcon />}
								Cut
								{showShortcuts && <MenubarShortcut>⌘X</MenubarShortcut>}
							</MenubarItem>
							<MenubarItem>
								{showIcons && <CopyIcon />}
								Copy
								{showShortcuts && <MenubarShortcut>⌘C</MenubarShortcut>}
							</MenubarItem>
							<MenubarItem>
								{showIcons && <ClipboardIcon />}
								Paste
								{showShortcuts && <MenubarShortcut>⌘V</MenubarShortcut>}
							</MenubarItem>
						</MenubarGroup>
					</MenubarContent>
				</MenubarMenu>
			)}

			{showViewMenu && (
				<MenubarMenu>
					<MenubarTrigger>View</MenubarTrigger>
					<MenubarContent>
						<MenubarGroup>
							<MenubarLabel>Panels</MenubarLabel>
							<MenubarCheckboxItem
								checked={toggles.sidebar}
								onCheckedChange={(checked) =>
									setToggles((prev) => ({ ...prev, sidebar: checked === true }))
								}
							>
								{showIcons && <EyeIcon />}
								Show Sidebar
							</MenubarCheckboxItem>
							<MenubarCheckboxItem
								checked={toggles.statusBar}
								onCheckedChange={(checked) =>
									setToggles((prev) => ({
										...prev,
										statusBar: checked === true,
									}))
								}
							>
								{showIcons && <LayoutIcon />}
								Show Status Bar
							</MenubarCheckboxItem>
							<MenubarCheckboxItem
								checked={toggles.minimap}
								onCheckedChange={(checked) =>
									setToggles((prev) => ({ ...prev, minimap: checked === true }))
								}
							>
								{showIcons && <MaximizeIcon />}
								Show Minimap
							</MenubarCheckboxItem>
						</MenubarGroup>
						<MenubarSeparator />
						<MenubarSub>
							<MenubarSubTrigger>
								{showIcons && <PaletteIcon />}
								Theme
							</MenubarSubTrigger>
							<MenubarPortal>
								<MenubarSubContent>
									<MenubarGroup>
										<MenubarLabel>Appearance</MenubarLabel>
										<MenubarRadioGroup value={theme} onValueChange={setTheme}>
											<MenubarRadioItem value="light">
												{showIcons && <SunIcon />}
												Light
											</MenubarRadioItem>
											<MenubarRadioItem value="dark">
												{showIcons && <MoonIcon />}
												Dark
											</MenubarRadioItem>
											<MenubarRadioItem value="system">
												{showIcons && <MonitorIcon />}
												System
											</MenubarRadioItem>
										</MenubarRadioGroup>
									</MenubarGroup>
								</MenubarSubContent>
							</MenubarPortal>
						</MenubarSub>
						<MenubarSeparator />
						<MenubarGroup>
							<MenubarLabel>Zoom</MenubarLabel>
							<MenubarItem>
								{showIcons && <ZoomInIcon />}
								Zoom In
								{showShortcuts && <MenubarShortcut>⌘+</MenubarShortcut>}
							</MenubarItem>
							<MenubarItem>
								{showIcons && <ZoomOutIcon />}
								Zoom Out
								{showShortcuts && <MenubarShortcut>⌘-</MenubarShortcut>}
							</MenubarItem>
							<MenubarItem>
								{showIcons && <MinusIcon />}
								Reset Zoom
								{showShortcuts && <MenubarShortcut>⌘0</MenubarShortcut>}
							</MenubarItem>
						</MenubarGroup>
					</MenubarContent>
				</MenubarMenu>
			)}
		</Menubar>
	);
}

/**
 * A `Menubar` is a horizontal menu bar that displays a set of menus, typically used for application-wide actions.
 * Use a `Menubar` when you need to expose core actions or navigation options consistently across a view, such as in desktop-style applications or complex tools. The difference between a `Menubar` and a `Navigation Menu` is that: A `Menubar` exposes commands and actions (often application-level), while a `Navigation Menu` primarily provides links for moving between pages or sections of the application.
 * It is inherently interactive, as users actively open menus and select options.
 */
const meta: Meta<MenubarStoryArgs> = {
	title: "Components/Menubar",
	component: MenubarStory,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
	args: {
		showFileMenu: true,
		showEditMenu: true,
		showViewMenu: true,
		showIcons: true,
		showShortcuts: true,
	},
	argTypes: {
		showFileMenu: { control: "boolean", description: "Show the File menu" },
		showEditMenu: { control: "boolean", description: "Show the Edit menu" },
		showViewMenu: { control: "boolean", description: "Show the View menu" },
		showIcons: { control: "boolean", description: "Show icons in menu items" },
		showShortcuts: {
			control: "boolean",
			description: "Show keyboard shortcuts",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

// ==========================================
// PLAYGROUND
// ==========================================

/**
 * Interactive playground for the Menubar component.
 * Use the controls to show/hide individual menus.
 */
export const Playground: Story = {
	render: (args) => <MenubarStory {...args} />,
};

// ==========================================
// COMPOSITION STORIES
// ==========================================

export const Simple: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<Menubar>
			<MenubarMenu>
				<MenubarTrigger>File</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>New</MenubarItem>
					<MenubarItem>Open</MenubarItem>
					<MenubarSeparator />
					<MenubarItem>Save</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>Edit</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>Undo</MenubarItem>
					<MenubarItem>Redo</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	),
};

export const WithShortcuts: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<Menubar>
			<MenubarMenu>
				<MenubarTrigger>File</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>
						New File
						<MenubarShortcut>⌘N</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						Open
						<MenubarShortcut>⌘O</MenubarShortcut>
					</MenubarItem>
					<MenubarSeparator />
					<MenubarItem>
						Save
						<MenubarShortcut>⌘S</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						Save As
						<MenubarShortcut>⇧⌘S</MenubarShortcut>
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>Edit</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>
						Undo
						<MenubarShortcut>⌘Z</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						Redo
						<MenubarShortcut>⇧⌘Z</MenubarShortcut>
					</MenubarItem>
					<MenubarSeparator />
					<MenubarItem>
						Cut
						<MenubarShortcut>⌘X</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						Copy
						<MenubarShortcut>⌘C</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						Paste
						<MenubarShortcut>⌘V</MenubarShortcut>
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	),
};

export const WithIcons: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<Menubar>
			<MenubarMenu>
				<MenubarTrigger>File</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>
						<FileIcon />
						New File
					</MenubarItem>
					<MenubarItem>
						<FolderIcon />
						New Folder
					</MenubarItem>
					<MenubarSeparator />
					<MenubarItem>
						<SaveIcon />
						Save
					</MenubarItem>
					<MenubarItem>
						<DownloadIcon />
						Export
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>Edit</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>
						<Undo2Icon />
						Undo
					</MenubarItem>
					<MenubarItem>
						<Redo2Icon />
						Redo
					</MenubarItem>
					<MenubarSeparator />
					<MenubarItem>
						<ScissorsIcon />
						Cut
					</MenubarItem>
					<MenubarItem>
						<CopyIcon />
						Copy
					</MenubarItem>
					<MenubarItem>
						<ClipboardIcon />
						Paste
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	),
};

// ==========================================
// CHECKBOX & RADIO STORIES
// ==========================================

export const WithCheckboxItems: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => {
		const [toggles, setToggles] = React.useState({
			sidebar: true,
			statusBar: false,
			minimap: true,
		});

		return (
			<Menubar>
				<MenubarMenu>
					<MenubarTrigger>View</MenubarTrigger>
					<MenubarContent>
						<MenubarGroup>
							<MenubarLabel>Panels</MenubarLabel>
							<MenubarCheckboxItem
								checked={toggles.sidebar}
								onCheckedChange={(checked) =>
									setToggles((prev) => ({ ...prev, sidebar: checked === true }))
								}
							>
								Show Sidebar
							</MenubarCheckboxItem>
							<MenubarCheckboxItem
								checked={toggles.statusBar}
								onCheckedChange={(checked) =>
									setToggles((prev) => ({
										...prev,
										statusBar: checked === true,
									}))
								}
							>
								Show Status Bar
							</MenubarCheckboxItem>
							<MenubarCheckboxItem
								checked={toggles.minimap}
								onCheckedChange={(checked) =>
									setToggles((prev) => ({ ...prev, minimap: checked === true }))
								}
							>
								Show Minimap
							</MenubarCheckboxItem>
						</MenubarGroup>
					</MenubarContent>
				</MenubarMenu>
			</Menubar>
		);
	},
};

export const WithRadioItems: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => {
		const [theme, setTheme] = React.useState<"light" | "dark" | "system">(
			"light",
		);

		return (
			<Menubar>
				<MenubarMenu>
					<MenubarTrigger>Preferences</MenubarTrigger>
					<MenubarContent>
						<MenubarGroup>
							<MenubarLabel>Theme</MenubarLabel>
							<MenubarRadioGroup value={theme} onValueChange={setTheme}>
								<MenubarRadioItem value="light">
									<SunIcon />
									Light
								</MenubarRadioItem>
								<MenubarRadioItem value="dark">
									<MoonIcon />
									Dark
								</MenubarRadioItem>
								<MenubarRadioItem value="system">
									<MonitorIcon />
									System
								</MenubarRadioItem>
							</MenubarRadioGroup>
						</MenubarGroup>
					</MenubarContent>
				</MenubarMenu>
			</Menubar>
		);
	},
};

// ==========================================
// SUBMENU STORIES
// ==========================================

export const WithSubmenus: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<Menubar>
			<MenubarMenu>
				<MenubarTrigger>File</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>New File</MenubarItem>
					<MenubarSub>
						<MenubarSubTrigger>Open Recent</MenubarSubTrigger>
						<MenubarPortal>
							<MenubarSubContent>
								<MenubarGroup>
									<MenubarLabel>Recent Files</MenubarLabel>
									<MenubarItem>Document.txt</MenubarItem>
									<MenubarItem>Report.pdf</MenubarItem>
									<MenubarItem>Notes.md</MenubarItem>
								</MenubarGroup>
								<MenubarSeparator />
								<MenubarItem>Clear Recent</MenubarItem>
							</MenubarSubContent>
						</MenubarPortal>
					</MenubarSub>
					<MenubarSeparator />
					<MenubarItem>Save</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	),
};

export const NestedSubmenus: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<Menubar>
			<MenubarMenu>
				<MenubarTrigger>File</MenubarTrigger>
				<MenubarContent>
					<MenubarSub>
						<MenubarSubTrigger>
							<FolderOpenIcon />
							Open Recent
						</MenubarSubTrigger>
						<MenubarPortal>
							<MenubarSubContent>
								<MenubarGroup>
									<MenubarLabel>Projects</MenubarLabel>
									<MenubarItem>
										<FileCodeIcon />
										Project Alpha
									</MenubarItem>
									<MenubarSub>
										<MenubarSubTrigger>
											<MoreHorizontalIcon />
											More Projects
										</MenubarSubTrigger>
										<MenubarPortal>
											<MenubarSubContent>
												<MenubarItem>
													<FileCodeIcon />
													Project Beta
												</MenubarItem>
												<MenubarItem>
													<FileCodeIcon />
													Project Gamma
												</MenubarItem>
											</MenubarSubContent>
										</MenubarPortal>
									</MenubarSub>
								</MenubarGroup>
							</MenubarSubContent>
						</MenubarPortal>
					</MenubarSub>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	),
};

// ==========================================
// REAL-WORLD EXAMPLES
// ==========================================

export const CodeEditorMenubar: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => {
		const [toggles, setToggles] = React.useState({
			wordWrap: true,
			lineNumbers: true,
			minimap: false,
		});
		const [theme, setTheme] = React.useState<"light" | "dark" | "system">(
			"dark",
		);

		return (
			<Menubar>
				<MenubarMenu>
					<MenubarTrigger>File</MenubarTrigger>
					<MenubarContent>
						<MenubarItem>
							<FileIcon />
							New File
							<MenubarShortcut>⌘N</MenubarShortcut>
						</MenubarItem>
						<MenubarItem>
							<FolderIcon />
							New Folder
						</MenubarItem>
						<MenubarSeparator />
						<MenubarItem>
							<SaveIcon />
							Save
							<MenubarShortcut>⌘S</MenubarShortcut>
						</MenubarItem>
						<MenubarItem>Save All</MenubarItem>
						<MenubarSeparator />
						<MenubarItem variant="destructive">Close Editor</MenubarItem>
					</MenubarContent>
				</MenubarMenu>

				<MenubarMenu>
					<MenubarTrigger>Edit</MenubarTrigger>
					<MenubarContent>
						<MenubarItem>
							<Undo2Icon />
							Undo
							<MenubarShortcut>⌘Z</MenubarShortcut>
						</MenubarItem>
						<MenubarItem>
							<Redo2Icon />
							Redo
							<MenubarShortcut>⇧⌘Z</MenubarShortcut>
						</MenubarItem>
						<MenubarSeparator />
						<MenubarItem>
							<ScissorsIcon />
							Cut
							<MenubarShortcut>⌘X</MenubarShortcut>
						</MenubarItem>
						<MenubarItem>
							<CopyIcon />
							Copy
							<MenubarShortcut>⌘C</MenubarShortcut>
						</MenubarItem>
						<MenubarItem>
							<ClipboardIcon />
							Paste
							<MenubarShortcut>⌘V</MenubarShortcut>
						</MenubarItem>
					</MenubarContent>
				</MenubarMenu>

				<MenubarMenu>
					<MenubarTrigger>View</MenubarTrigger>
					<MenubarContent>
						<MenubarGroup>
							<MenubarLabel>Editor Settings</MenubarLabel>
							<MenubarCheckboxItem
								checked={toggles.wordWrap}
								onCheckedChange={(checked) =>
									setToggles((prev) => ({
										...prev,
										wordWrap: checked === true,
									}))
								}
							>
								Word Wrap
							</MenubarCheckboxItem>
							<MenubarCheckboxItem
								checked={toggles.lineNumbers}
								onCheckedChange={(checked) =>
									setToggles((prev) => ({
										...prev,
										lineNumbers: checked === true,
									}))
								}
							>
								Line Numbers
							</MenubarCheckboxItem>
							<MenubarCheckboxItem
								checked={toggles.minimap}
								onCheckedChange={(checked) =>
									setToggles((prev) => ({ ...prev, minimap: checked === true }))
								}
							>
								Minimap
							</MenubarCheckboxItem>
						</MenubarGroup>
						<MenubarSeparator />
						<MenubarSub>
							<MenubarSubTrigger>
								<PaletteIcon />
								Theme
							</MenubarSubTrigger>
							<MenubarPortal>
								<MenubarSubContent>
									<MenubarRadioGroup value={theme} onValueChange={setTheme}>
										<MenubarRadioItem value="light">
											<SunIcon />
											Light
										</MenubarRadioItem>
										<MenubarRadioItem value="dark">
											<MoonIcon />
											Dark
										</MenubarRadioItem>
										<MenubarRadioItem value="system">
											<MonitorIcon />
											System
										</MenubarRadioItem>
									</MenubarRadioGroup>
								</MenubarSubContent>
							</MenubarPortal>
						</MenubarSub>
					</MenubarContent>
				</MenubarMenu>

				<MenubarMenu>
					<MenubarTrigger>Run</MenubarTrigger>
					<MenubarContent>
						<MenubarItem>
							<PlayIcon />
							Start Debugging
							<MenubarShortcut>F5</MenubarShortcut>
						</MenubarItem>
						<MenubarItem>
							<BugIcon />
							Run Without Debugging
							<MenubarShortcut>⌃F5</MenubarShortcut>
						</MenubarItem>
						<MenubarSeparator />
						<MenubarItem>
							<TerminalIcon />
							Open Terminal
							<MenubarShortcut>⌃`</MenubarShortcut>
						</MenubarItem>
					</MenubarContent>
				</MenubarMenu>

				<MenubarMenu>
					<MenubarTrigger>Help</MenubarTrigger>
					<MenubarContent>
						<MenubarItem>
							<BookOpenIcon />
							Documentation
						</MenubarItem>
						<MenubarItem>
							<MessageCircleIcon />
							Report Issue
						</MenubarItem>
						<MenubarSeparator />
						<MenubarItem>
							<HelpCircleIcon />
							About
						</MenubarItem>
					</MenubarContent>
				</MenubarMenu>
			</Menubar>
		);
	},
};

// ==========================================
// STATE STORIES
// ==========================================

export const WithDisabledItems: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<Menubar>
			<MenubarMenu>
				<MenubarTrigger>Edit</MenubarTrigger>
				<MenubarContent>
					<MenubarItem disabled>
						<Undo2Icon />
						Undo
						<MenubarShortcut>⌘Z</MenubarShortcut>
					</MenubarItem>
					<MenubarItem disabled>
						<Redo2Icon />
						Redo
						<MenubarShortcut>⇧⌘Z</MenubarShortcut>
					</MenubarItem>
					<MenubarSeparator />
					<MenubarItem>
						<ScissorsIcon />
						Cut
						<MenubarShortcut>⌘X</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						<CopyIcon />
						Copy
						<MenubarShortcut>⌘C</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						<ClipboardIcon />
						Paste
						<MenubarShortcut>⌘V</MenubarShortcut>
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	),
};

export const WithInsetItems: Story = {
	parameters: {
		controls: { disable: true },
	},
	render: () => (
		<Menubar>
			<MenubarMenu>
				<MenubarTrigger>Account</MenubarTrigger>
				<MenubarContent>
					<MenubarGroup>
						<MenubarLabel inset>Account</MenubarLabel>
						<MenubarItem inset>Profile</MenubarItem>
						<MenubarItem inset>Billing</MenubarItem>
						<MenubarItem inset>Settings</MenubarItem>
					</MenubarGroup>
					<MenubarSeparator />
					<MenubarGroup>
						<MenubarItem inset variant="destructive">
							Sign out
						</MenubarItem>
					</MenubarGroup>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	),
};

// ==========================================
// ADDITIONAL EXAMPLES
// ==========================================
