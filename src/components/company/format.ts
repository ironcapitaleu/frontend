import {
	formatMarketCap,
	formatNumber,
	formatPercent,
	formatPrice,
	MISSING,
} from "@/components/screener/format";
import type { Claim, Unit } from "@/lib/company/types";

/**
 * The fixed first column of a company table below 1024 px. Its card ink lets
 * the scrolled figures pass under it. At 1024 px and wider it has no ink of
 * its own, so the row hover reaches it.
 */
export const FIXED_COLUMN =
	"max-lg:sticky max-lg:left-0 max-lg:z-10 max-lg:bg-card";

/**
 * Writes a figure in its unit: `$212.0B` for dollars, `24.5B` for a share
 * count, `18.4` for a ratio and `31.2%` for a percent, which the figure holds
 * as a fraction. A loss takes a true minus, such as `−$4.0B`.
 */
export function formatInUnit(value: number, unit: Unit): string {
	if (unit === "percent") return formatPercent(value * 100);
	if (unit === "ratio") return formatNumber(value);
	const sign = value < 0 ? "−" : "";
	const amount = formatMarketCap(Math.abs(value));
	return `${sign}${unit === "usd" ? amount : amount.slice(1)}`;
}

/**
 * Writes an input of a ratio in its unit, such as `$82.75` for a price or
 * `$212.0B` for dollars. A value that is not a number gives {@link MISSING}.
 */
export function formatInput({
	value,
	unit,
}: Pick<Claim, "value" | "unit">): string {
	const amount = Number(value);
	if (typeof value !== "number" || !Number.isFinite(amount)) return MISSING;
	return unit === "usdPerShare"
		? formatPrice(amount)
		: formatInUnit(amount, unit);
}
