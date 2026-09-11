import type { LucideIcon } from "lucide-react";
import { Monitor, Moon, Sun } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ThemeChoice } from "@/lib/theme/theme";

/** One selectable theme, with the icon and accessible label it renders. */
interface ThemeOption {
	value: ThemeChoice;
	label: string;
	Icon: LucideIcon;
}

/** The options the toggle renders, in display order. */
const THEME_OPTIONS = [
	{ value: "light", label: "Light theme", Icon: Sun },
	{ value: "dark", label: "Dark theme", Icon: Moon },
	{ value: "system", label: "System theme", Icon: Monitor },
] as const satisfies readonly ThemeOption[];

/** The props of {@link ThemeToggle}. */
export interface ThemeToggleProps {
	/** The current theme choice, shown as the pressed option. */
	value: ThemeChoice;
	/** Called with the new choice when the visitor selects an option. */
	onChange: (choice: ThemeChoice) => void;
	/** Optional extra classes for the group wrapper. */
	className?: string;
}

/**
 * A segmented control that selects light, dark, or system theme. It is
 * controlled: the pressed option reads from `value` and every selection calls
 * `onChange`, so the header wires it to the theme source.
 *
 * @param props - See {@link ThemeToggleProps}.
 */
export function ThemeToggle({ value, onChange, className }: ThemeToggleProps) {
	return (
		<ToggleGroup
			aria-label="Theme"
			multiple={false}
			value={[value]}
			onValueChange={(next) => {
				const [chosen] = next as ThemeChoice[];
				// Selecting the pressed option again yields an empty array. Keep the
				// current choice so a theme is always applied.
				if (chosen) {
					onChange(chosen);
				}
			}}
			variant="outline"
			size="sm"
			className={className}
		>
			{THEME_OPTIONS.map(({ value: option, label, Icon }) => (
				<ToggleGroupItem key={option} value={option} aria-label={label}>
					<Icon aria-hidden="true" />
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}
