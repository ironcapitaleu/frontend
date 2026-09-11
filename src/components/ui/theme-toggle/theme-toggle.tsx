import type { LucideIcon } from "lucide-react";
import { ChevronDown, Monitor, Moon, Sun } from "lucide-react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ThemeChoice } from "@/lib/theme/theme";
import { cn } from "@/lib/utils";

/** One selectable theme, with the icon and label it renders. */
interface ThemeOption {
	value: ThemeChoice;
	label: string;
	Icon: LucideIcon;
}

/** The options the menu lists, in display order. */
const THEME_OPTIONS = [
	{ value: "light", label: "Light", Icon: Sun },
	{ value: "dark", label: "Dark", Icon: Moon },
	{ value: "system", label: "System", Icon: Monitor },
] as const satisfies readonly ThemeOption[];

/** The option the trigger shows when the value matches nothing, which the type prevents. */
const FALLBACK_OPTION = THEME_OPTIONS[2];

/** The props of {@link ThemeToggle}. */
export interface ThemeToggleProps {
	/** The current theme choice, named on the trigger and checked in the menu. */
	value: ThemeChoice;
	/** Called with the new choice when the visitor picks one. */
	onChange: (choice: ThemeChoice) => void;
	/** Optional extra classes for the trigger. */
	className?: string;
}

/**
 * A menu that selects the light, dark, or system theme. The trigger names the
 * active choice, so the control says what it does without the reader opening it.
 *
 * It is controlled: the checked item reads from `value` and every pick calls
 * `onChange`, so the header wires it to the theme source.
 *
 * @param props - See {@link ThemeToggleProps}.
 */
export function ThemeToggle({ value, onChange, className }: ThemeToggleProps) {
	const active =
		THEME_OPTIONS.find((option) => option.value === value) ?? FALLBACK_OPTION;
	const ActiveIcon = active.Icon;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label={`Theme: ${active.label}`}
				className={cn(
					"flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
					className,
				)}
			>
				<ActiveIcon size={16} aria-hidden="true" />
				{active.label}
				<ChevronDown size={14} aria-hidden="true" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-36">
				<DropdownMenuRadioGroup
					value={value}
					onValueChange={(next) => onChange(next as ThemeChoice)}
				>
					{THEME_OPTIONS.map(({ value: option, label, Icon }) => (
						<DropdownMenuRadioItem key={option} value={option}>
							<Icon aria-hidden="true" />
							{label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
