import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { useState } from "react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { DatePicker } from "../components/ui/date-picker";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../components/ui/tooltip";
import { type ThemeControls, themeVars } from "./theme-vars";

/**
 * The theme playground renders a representative spread of the `ui/*` primitives
 * under theme settings you drive from the Controls panel. Change the primary or
 * secondary color, the corner radius, or the base spacing, and watch the
 * buttons, badges, form controls, and card repaint at once.
 *
 * The controls set CSS custom properties on a single wrapper element that this
 * story renders, so the change reaches only the playground. Every other story
 * keeps the shared theme. The primitives themselves read the semantic tokens,
 * the same ones the app ships, so what you see here is what a real theme change
 * would produce.
 *
 * Leave a color control empty to keep that token at its active-theme value. The
 * Storybook theme toggle still switches the playground between light and dark,
 * and any color you set rides on top of the active theme.
 */
const meta: Meta<ThemeControls> = {
	title: "Playground/Theme",
	tags: ["autodocs"],
	argTypes: {
		primary: {
			control: "color",
			description:
				"The accent color for primary buttons, badges, and focus rings. Empty keeps the theme value.",
		},
		primaryForeground: {
			control: "color",
			description:
				"The text color that sits on a primary surface. Empty keeps the theme value.",
		},
		secondary: {
			control: "color",
			description:
				"The color for secondary buttons and badges. Empty keeps the theme value.",
		},
		background: {
			control: "color",
			description:
				"The page background behind the primitives. Empty keeps the theme value.",
		},
		foreground: {
			control: "color",
			description: "The body text color. Empty keeps the theme value.",
		},
		border: {
			control: "color",
			description:
				"The color for borders, inputs, and separators. Empty keeps the theme value.",
		},
		radius: {
			control: { type: "range", min: 0, max: 24, step: 1 },
			description: "The corner radius in pixels. The theme default is 10.",
		},
		spacing: {
			control: { type: "range", min: 0.15, max: 0.5, step: 0.01 },
			description:
				"The base spacing unit in rem, which scales gaps and padding. The theme default is 0.25.",
		},
	},
	args: {
		primary: "",
		primaryForeground: "",
		secondary: "",
		background: "",
		foreground: "",
		border: "",
		radius: 10,
		spacing: 0.25,
	},
};

export default meta;
type Story = StoryObj<ThemeControls>;

/** The four account roles the showcase select offers. */
const ROLE_ITEMS = [
	{ value: "admin", label: "Admin" },
	{ value: "editor", label: "Editor" },
	{ value: "viewer", label: "Viewer" },
] as const;

/**
 * Renders the primitive spread inside the theme wrapper. The wrapper carries the
 * CSS custom properties, paints the background and text tokens, and draws a
 * bordered card so a color, radius, or spacing change reads at a glance.
 */
function ThemeShowcase(controls: ThemeControls) {
	const [date, setDate] = useState<Date | undefined>(new Date(2026, 8, 15));
	const style = themeVars(controls) as CSSProperties;

	return (
		<div
			style={style}
			className="bg-background text-foreground flex max-w-3xl flex-col gap-6 rounded-xl border p-6"
		>
			<div className="flex flex-col gap-1">
				<h2 className="font-serif">Theme playground</h2>
				<p className="text-muted-foreground max-w-none text-left">
					Drive the theme settings from the Controls panel. Every primitive
					below reads the same tokens the app ships.
				</p>
			</div>

			<div className="flex flex-wrap gap-2">
				<Button>Primary</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="outline">Outline</Button>
				<Button variant="ghost">Ghost</Button>
				<Button variant="destructive">Destructive</Button>
			</div>

			<div className="flex flex-wrap gap-2">
				<Badge>Default</Badge>
				<Badge variant="secondary">Secondary</Badge>
				<Badge variant="outline">Outline</Badge>
				<Badge variant="destructive">Destructive</Badge>
			</div>

			<Separator />

			<Card>
				<CardHeader>
					<CardTitle>New report</CardTitle>
					<CardDescription>
						A small form to show the controls under the theme.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<Label htmlFor="report-name">Report name</Label>
						<Input id="report-name" placeholder="Quarterly summary" />
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="report-role">Owner role</Label>
						<Select>
							<SelectTrigger id="report-role">
								<SelectValue placeholder="Select a role" />
							</SelectTrigger>
							<SelectContent>
								{ROLE_ITEMS.map((role) => (
									<SelectItem key={role.value} value={role.value}>
										{role.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="report-date">Filing date</Label>
						<DatePicker id="report-date" value={date} onValueChange={setDate} />
					</div>

					<RadioGroup defaultValue="quarterly" className="gap-2">
						<div className="flex items-center gap-2">
							<RadioGroupItem value="quarterly" id="period-quarterly" />
							<Label htmlFor="period-quarterly">Quarterly</Label>
						</div>
						<div className="flex items-center gap-2">
							<RadioGroupItem value="yearly" id="period-yearly" />
							<Label htmlFor="period-yearly">Yearly</Label>
						</div>
					</RadioGroup>

					<div className="flex items-center gap-2">
						<Switch id="live-prices" defaultChecked />
						<Label htmlFor="live-prices">Live prices</Label>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="threshold">Threshold</Label>
						<Slider
							id="threshold"
							defaultValue={[40]}
							max={100}
							step={1}
							className="max-w-xs"
						/>
					</div>
				</CardContent>
				<CardFooter className="gap-2">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger render={<Button>Save report</Button>} />
							<TooltipContent>Store the report and its filters</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<Button variant="outline">Cancel</Button>
				</CardFooter>
			</Card>
		</div>
	);
}

/**
 * The live playground. Open the Controls panel, change a color, the radius, or
 * the spacing, and the whole spread repaints. Leave a color empty to keep the
 * active-theme value, and use the theme toolbar to switch light and dark.
 */
export const Default: Story = {
	render: (args) => <ThemeShowcase {...args} />,
};

/**
 * A preset that sets a warm primary, a soft background, a wider radius, and
 * looser spacing, so the effect of a theme change reads at a glance next to the
 * default. Every value still lands on the story wrapper alone.
 */
export const WarmPreset: Story = {
	args: {
		primary: "#c2410c",
		primaryForeground: "#fff7ed",
		secondary: "#fed7aa",
		background: "#fffbf5",
		foreground: "#431407",
		border: "#fdba74",
		radius: 18,
		spacing: 0.3,
	},
	render: (args) => <ThemeShowcase {...args} />,
};
