import type { IsoDate, Period } from "../types";

/** One fiscal quarter of Meridian, such as Q2 FY2027. */
export interface FiscalQuarter {
	readonly year: number;
	readonly quarter: number;
}

const DAY = 24 * 60 * 60 * 1000;

/** Brands a date string of the form `2026-07-26` as an {@link IsoDate}. */
export function isoDate(value: string): IsoDate {
	return value as IsoDate;
}

function format(time: number): IsoDate {
	return isoDate(new Date(time).toISOString().slice(0, 10));
}

function lastSundayOfJanuary(year: number): number {
	const january31 = Date.UTC(year, 0, 31);
	return january31 - new Date(january31).getUTCDay() * DAY;
}

/**
 * Returns the last day of a Meridian fiscal quarter. A fiscal year ends on the
 * last Sunday of January, so FY2026 ends on 25 Jan 2026. The first three
 * quarters each end 13 weeks after the one before.
 */
export function quarterEnd({ year, quarter }: FiscalQuarter): IsoDate {
	if (quarter === 4) {
		return format(lastSundayOfJanuary(year));
	}
	return format(lastSundayOfJanuary(year - 1) + quarter * 91 * DAY);
}

/** Returns the fiscal year that a date falls in, such as 2027 for 23 Sep 2026. */
export function fiscalYearOf(date: IsoDate): number {
	const year = Number(date.slice(0, 4));
	return date > quarterEnd({ year, quarter: 4 }) ? year + 1 : year;
}

/** Returns the quarter before `quarter`, such as Q4 FY2026 before Q1 FY2027. */
export function previousQuarter({
	year,
	quarter,
}: FiscalQuarter): FiscalQuarter {
	return quarter === 1
		? { year: year - 1, quarter: 4 }
		: { year, quarter: quarter - 1 };
}

/** Returns the period of a whole fiscal year, such as FY2026. */
export function fiscalYearPeriod(year: number): Period {
	return {
		kind: "fiscalYear",
		fiscalYear: year,
		fiscalQuarter: null,
		endsOn: quarterEnd({ year, quarter: 4 }),
	};
}

/** Returns the period of three months that ends a fiscal quarter. */
export function fiscalQuarterPeriod(at: FiscalQuarter): Period {
	return {
		kind: "fiscalQuarter",
		fiscalYear: at.year,
		fiscalQuarter: at.quarter,
		endsOn: quarterEnd(at),
	};
}

/** Returns the period from the start of the fiscal year to the end of a quarter. */
export function yearToDatePeriod(at: FiscalQuarter): Period {
	return { ...fiscalQuarterPeriod(at), kind: "yearToDate" };
}

/** Returns the instant at the end of a fiscal year, as an annual table holds it. */
export function yearEndInstant(year: number): Period {
	return { ...fiscalYearPeriod(year), kind: "instant" };
}

/** Returns the instant at the end of a quarter, as a quarterly table holds it. */
export function quarterEndInstant(at: FiscalQuarter): Period {
	return { ...fiscalQuarterPeriod(at), kind: "instant" };
}

/** Returns the instant at a date that ends no fiscal period, such as the date of a price. */
export function dateInstant(date: string): Period {
	return {
		kind: "instant",
		fiscalYear: fiscalYearOf(isoDate(date)),
		fiscalQuarter: null,
		endsOn: isoDate(date),
	};
}

/**
 * Renders the `{period}` part of a claim id, by the rules of
 * `company_data_model.md` §3. For example, the second quarter of FY2027 gives
 * `Q2-FY2027`, and the annual instant at 25 Jan 2026 gives `2026-01-25`.
 */
export function periodId(period: Period): string {
	switch (period.kind) {
		case "fiscalYear":
			return `FY${period.fiscalYear}`;
		case "fiscalQuarter":
			return `Q${period.fiscalQuarter}-FY${period.fiscalYear}`;
		case "yearToDate":
			return `YTD-Q${period.fiscalQuarter}-FY${period.fiscalYear}`;
		case "lastFourQuarters":
			return `L4Q-${period.endsOn}`;
		case "instant":
			return period.fiscalQuarter === null
				? period.endsOn
				: `Q${period.fiscalQuarter}-${period.endsOn}`;
	}
}
