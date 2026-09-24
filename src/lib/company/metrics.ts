import type {
	Claim,
	CompanySections,
	CompletedSections,
	Figure,
	LineKey,
	Period,
	Series,
	Statement,
	StatementLine,
	StatementTable,
} from "./types";

/**
 * The statement lines that add up over a fiscal year. Only these lines get a
 * derived quarter and a sum over the last four quarters. A share count, a
 * per-share figure and a balance sheet line are not in the set.
 */
export const flowLineKeys: ReadonlySet<LineKey> = new Set<LineKey>([
	"revenue",
	"operatingIncome",
	"netIncome",
	"operatingCashFlow",
	"capitalExpenditure",
	"dividendsPaid",
	"shareRepurchases",
	"shareIssuanceProceeds",
	"shareBasedCompensation",
]);

/**
 * Brands the sections of the port as {@link CompletedSections}, so a tab can
 * read them. Returns a new object and leaves `sections` unchanged.
 *
 * The quarterly table of each statement is the one that
 * {@link completeQuarters} returns, so a derived quarter holds its figure.
 */
export function completeSections(sections: CompanySections): CompletedSections {
	const { financials } = sections;
	return {
		...sections,
		financials:
			financials === null
				? null
				: {
						income: withCompleteQuarters(financials.income),
						balance: withCompleteQuarters(financials.balance),
						cashFlow: withCompleteQuarters(financials.cashFlow),
					},
	} as CompletedSections;
}

/**
 * Returns a new quarterly table of `statement` with each missing quarter of
 * a flow line derived from the figures that the filings report.
 *
 * A quarter is the figure up to the end of the quarter minus the figure up to
 * the end of the quarter before. The figure up to a fourth quarter is the
 * fiscal year of the annual table. The figure up to a second or third quarter
 * is the six-month or nine-month figure of the year-to-date table. The figure
 * up to the quarter before is the first quarter or the year-to-date figure
 * when a table reports it, and the reported quarters of the fiscal year
 * otherwise. So the income
 * statement gets Q4 = FY − Q1 − Q2 − Q3, and the cash flow statement gets
 * Q2 = six months − Q1, Q3 = nine months − six months and Q4 = FY − nine
 * months.
 *
 * A point stays `null` when the line is not a flow line, when the quarter is
 * a first quarter, or when one of its inputs is missing, is not a number or
 * has no period. `statement` stays unchanged.
 */
export function completeQuarters(statement: Statement): StatementTable {
	const { quarterly } = statement;
	return {
		periods: quarterly.periods,
		lines: quarterly.lines.map((line) =>
			flowLineKeys.has(line.key)
				? {
						...line,
						points: line.points.map(
							(point, position) =>
								point ??
								derivedQuarter(statement, line, line.periods[position]),
						),
					}
				: line,
		),
	};
}

/** Returns `statement` with the quarterly table that {@link completeQuarters} returns. */
function withCompleteQuarters(statement: Statement): Statement {
	return { ...statement, quarterly: completeQuarters(statement) };
}

/** Derives the three-month figure of `line` for `quarter`, or returns `null`. */
function derivedQuarter(
	statement: Statement,
	line: StatementLine,
	quarter: Period,
): Figure {
	const { fiscalYear, fiscalQuarter } = quarter;
	if (fiscalQuarter === null || fiscalQuarter === 1) {
		return null;
	}
	const upToQuarter =
		fiscalQuarter === 4
			? pointAt(statement.annual, line.key, "fiscalYear", fiscalYear, null)
			: yearToDateAt(statement, line, fiscalYear, fiscalQuarter);
	const before = yearToDateAt(statement, line, fiscalYear, fiscalQuarter - 1);
	const earlier =
		before === null
			? quartersBefore(line, fiscalYear, fiscalQuarter)
			: [before];
	if (
		!isPeriodNumberClaim(upToQuarter) ||
		!earlier.every(isPeriodNumberClaim)
	) {
		return null;
	}
	const inputs: [PeriodNumberClaim, ...PeriodNumberClaim[]] = [
		upToQuarter,
		...earlier,
	];
	return {
		id: `metric.${line.key}.Q${fiscalQuarter}-FY${fiscalYear}`,
		label: line.label,
		value: earlier.reduce(
			(value, claim) => value - claim.value,
			upToQuarter.value,
		),
		unit: line.unit,
		period: quarter,
		source: {
			kind: "derived",
			formula: inputs.map((claim) => periodName(claim.period)).join(" − "),
			inputs,
		},
	};
}

/**
 * Returns the figure up to the end of `fiscalQuarter`: the reported first
 * quarter for `1`, or the year-to-date figure for `2` and `3`.
 */
function yearToDateAt(
	statement: Statement,
	line: StatementLine,
	fiscalYear: number,
	fiscalQuarter: number,
): Figure {
	if (fiscalQuarter === 1) {
		return pointOf(line, "fiscalQuarter", fiscalYear, 1);
	}
	return statement.yearToDate === null
		? null
		: pointAt(
				statement.yearToDate,
				line.key,
				"yearToDate",
				fiscalYear,
				fiscalQuarter,
			);
}

/** Returns the reported quarters of `line` in `fiscalYear` before `fiscalQuarter`. */
function quartersBefore(
	line: StatementLine,
	fiscalYear: number,
	fiscalQuarter: number,
): Figure[] {
	return Array.from({ length: fiscalQuarter - 1 }, (_, position) =>
		pointOf(line, "fiscalQuarter", fiscalYear, position + 1),
	);
}

/** Returns the point of line `key` in `table` at the matching period, or `null`. */
function pointAt(
	table: StatementTable,
	key: LineKey,
	kind: Period["kind"],
	fiscalYear: number,
	fiscalQuarter: number | null,
): Figure {
	const line = table.lines.find((candidate) => candidate.key === key);
	return line === undefined
		? null
		: pointOf(line, kind, fiscalYear, fiscalQuarter);
}

/** Returns the point of `series` at the matching period, or `null`. */
function pointOf(
	series: Series,
	kind: Period["kind"],
	fiscalYear: number,
	fiscalQuarter: number | null,
): Figure {
	const position = series.periods.findIndex(
		(period) =>
			period.kind === kind &&
			period.fiscalYear === fiscalYear &&
			period.fiscalQuarter === fiscalQuarter,
	);
	return position === -1 ? null : (series.points[position] ?? null);
}

/** A claim with a number value and a period, so a formula can subtract and name it. */
type PeriodNumberClaim = Claim & {
	readonly value: number;
	readonly period: Period;
};

/** Tells whether `figure` is a claim with a number value and a period. */
function isPeriodNumberClaim(figure: Figure): figure is PeriodNumberClaim {
	return (
		figure !== null &&
		typeof figure.value === "number" &&
		figure.period !== null
	);
}

/**
 * Names a period in a formula, such as `FY2025`, `Q1 FY2025` or `9 months to
 * Q3 FY2025`. A new period kind fails the type check here until it gets a name.
 */
function periodName(period: Period): string {
	const year = `FY${period.fiscalYear}`;
	switch (period.kind) {
		case "fiscalQuarter":
			return `Q${period.fiscalQuarter} ${year}`;
		case "yearToDate":
			return period.fiscalQuarter === null
				? year
				: `${period.fiscalQuarter * 3} months to Q${period.fiscalQuarter} ${year}`;
		case "fiscalYear":
			return year;
		case "lastFourQuarters":
			return `last four quarters to ${period.endsOn}`;
		case "instant":
			return period.endsOn;
		default: {
			const unknown: never = period.kind;
			return unknown;
		}
	}
}
