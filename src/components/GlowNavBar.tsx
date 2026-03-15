import {
	Camera,
	Heart,
	Home,
	Share2,
	Video,
	type LucideIcon,
} from "lucide-react";

interface GlowNavItem {
	icon: LucideIcon;
	title: string;
	gradientFrom: string;
	gradientTo: string;
}

const navItems: GlowNavItem[] = [
	{
		icon: Home,
		title: "Home",
		gradientFrom: "#a955ff",
		gradientTo: "#ea51ff",
	},
	{
		icon: Video,
		title: "Video",
		gradientFrom: "#56CCF2",
		gradientTo: "#2F80ED",
	},
	{
		icon: Camera,
		title: "Photo",
		gradientFrom: "#FF9966",
		gradientTo: "#FF5E62",
	},
	{
		icon: Share2,
		title: "Share",
		gradientFrom: "#80FF72",
		gradientTo: "#7EE8FA",
	},
	{
		icon: Heart,
		title: "Like",
		gradientFrom: "#ffa9c6",
		gradientTo: "#f434e2",
	},
];

/** Horizontal nav bar with gradient glow on hover. */
function GlowNavBar() {
	return (
		<ul className="glow-nav">
			{navItems.map((item) => (
				<GlowNavItem key={item.title} item={item} />
			))}
		</ul>
	);
}

function GlowNavItem({ item }: { item: GlowNavItem }) {
	const Icon = item.icon;
	return (
		<li
			className="glow-nav-item"
			style={
				{
					"--glow-from": item.gradientFrom,
					"--glow-to": item.gradientTo,
				} as React.CSSProperties
			}
		>
			<span className="glow-nav-icon">
				<Icon size={28} strokeWidth={1.5} />
			</span>
			<span className="glow-nav-title">{item.title}</span>
		</li>
	);
}

export { GlowNavBar };
