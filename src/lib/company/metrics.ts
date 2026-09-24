import { MissingGuardInput } from "./errors";
import type {
	Claim,
	ClaimId,
	CompanySections,
	CompletedSections,
	Figure,
	LineKey,
	MastheadSection,
	MetricKey,
	Nullable,
	OverviewSection,
	Period,
	Series,
	Statement,
	StatementLine,
	StatementTable,
	Unit,
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
 * otherwise. So a fourth quarter is FY − nine months when the year-to-date
 * table reports the nine months, and FY − Q1 − Q2 − Q3 otherwise. The cash
 * flow statement gets Q2 = six months − Q1 and Q3 = nine months − six months.
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

/** Names one market figure. */
export type MarketKey = "price" | "priceAtFiscalYearEnd" | "treasuryYield10y";

/**
 * Picks the period that a {@link FigureRef} reads. `lastFiscalYears` picks a
 * window of `count` fiscal years, oldest first. Every other variant picks one
 * period. `fiscalYear`, `latestQuarter`, `lastFourQuarters` and
 * `lastFiscalYears` count from the latest period that a filing covers.
 */
export type PeriodChoice =
	| { readonly kind: "samePeriod" }
	| { readonly kind: "fiscalYear"; readonly yearsBack: number }
	| { readonly kind: "latestQuarter" }
	| { readonly kind: "lastFourQuarters" }
	| { readonly kind: "latestClose" }
	| { readonly kind: "lastFiscalYears"; readonly count: number };

/**
 * Names one figure: a statement line, a metric or a market figure, and the
 * period to read it at. `at` is `null` only for a point metric, because a
 * point metric fixes the periods of its own inputs.
 */
export type FigureRef =
	| { readonly from: "line"; readonly key: LineKey; readonly at: PeriodChoice }
	| {
			readonly from: "metric";
			readonly key: MetricKey;
			readonly at: Nullable<PeriodChoice>;
	  }
	| {
			readonly from: "market";
			readonly key: MarketKey;
			readonly at: PeriodChoice;
	  };

/** How a figure compares with a bound. */
export type Comparison = "above" | "atLeast" | "below" | "atMost";

/**
 * A condition that an input must meet before the formula has a reading, such
 * as "diluted EPS above 0". `input` equals one entry of `Metric.inputs` and
 * names a single period, never a window.
 */
export interface Guard {
	readonly input: FigureRef;
	readonly comparison: Comparison;
	readonly value: number;
}

/**
 * The fields that every metric has. `minPoints` is the least number of
 * points that each window input needs. It is `null` for a metric with no
 * window input.
 */
interface MetricFields {
	readonly key: MetricKey;
	readonly name: string;
	readonly formula: string;
	readonly unit: Unit;
	readonly inputs: readonly FigureRef[];
	readonly guards: readonly Guard[];
	readonly minPoints: Nullable<number>;
}

/** A metric that gives one figure. Each input names its own period. */
export interface PointMetric extends MetricFields {
	readonly kind: "point";
}

/**
 * A metric that gives one figure for any period that its inputs share, such
 * as free cash flow in FY2021. Every input uses `samePeriod`.
 */
export interface PeriodMetric extends MetricFields {
	readonly kind: "perPeriod";
}

/**
 * A derived figure as data. It holds no function, so it serialises. The
 * arithmetic lives in {@link formulas}.
 */
export type Metric = PointMetric | PeriodMetric;

/** Tells that the metric has a figure. `claim` is its derived claim. */
export interface MetricValue {
	readonly kind: "value";
	readonly claim: Claim;
}

/** Tells that a single-period input of the metric is missing. */
export interface MissingInput {
	readonly kind: "missingInput";
}

/** Tells that an input of a metric fails a guard. `input` is the claim of that input. */
export interface FailedGuard {
	readonly kind: "failedGuard";
	readonly guard: Guard;
	readonly input: Claim;
}

/** Tells that a window input has fewer points than `Metric.minPoints`. */
export interface ShortHistory {
	readonly kind: "shortHistory";
}

/**
 * How the evaluation of a metric ended: a claim, a missing single-period
 * input, a short window or a failed guard. The page draws each result other
 * than `value` as a dimmed `—`.
 */
export type MetricResult =
	| MetricValue
	| MissingInput
	| ShortHistory
	| FailedGuard;

/**
 * One input as a formula gets it: a claim for a single period, or the points
 * of a window with `null` at each missing point.
 */
export type ResolvedInput = Claim | readonly Figure[];

/** The arithmetic of one metric. It gets the inputs in the order of `Metric.inputs`. */
export type Formula = (inputs: readonly ResolvedInput[]) => number;

const samePeriod: PeriodChoice = { kind: "samePeriod" };
const latestYear: PeriodChoice = { kind: "fiscalYear", yearsBack: 0 };
const latestQuarter: PeriodChoice = { kind: "latestQuarter" };
const lastFourQuarters: PeriodChoice = { kind: "lastFourQuarters" };

/** Returns a reference to statement line `key` at `at`. */
function line(key: LineKey, at: PeriodChoice): FigureRef {
	return { from: "line", key, at };
}

const marketCapRef: FigureRef = { from: "metric", key: "marketCap", at: null };
const priceNow: FigureRef = {
	from: "market",
	key: "price",
	at: { kind: "latestClose" },
};

/**
 * Returns a metric with no window input. A ratio metric passes its divisor
 * as `divisor`, and the metric guards it with "above 0".
 */
function metric(
	kind: Metric["kind"],
	key: MetricKey,
	name: string,
	formula: string,
	unit: Unit,
	inputs: readonly FigureRef[],
	divisor: Nullable<FigureRef> = null,
): Metric {
	const guards: Guard[] =
		divisor === null ? [] : [{ input: divisor, comparison: "above", value: 0 }];
	return { kind, key, name, formula, unit, inputs, guards, minPoints: null };
}

/**
 * Returns a metric of `kind` that divides `dividend` by `divisor` and guards
 * the divisor, so the metric names its divisor once.
 */
function ratio(
	kind: Metric["kind"],
	key: MetricKey,
	name: string,
	formula: string,
	unit: Unit,
	dividend: FigureRef,
	divisor: FigureRef,
): Metric {
	return metric(kind, key, name, formula, unit, [dividend, divisor], divisor);
}

/**
 * The metrics of the page, by key. They cover the metrics that the checks
 * read and the metrics of the Overview and Valuation sector benchmarks.
 */
export const metrics: Record<MetricKey, Metric> = {
	operatingMargin: ratio(
		"perPeriod",
		"operatingMargin",
		"Operating margin",
		"Operating income ÷ revenue",
		"percent",
		line("operatingIncome", samePeriod),
		line("revenue", samePeriod),
	),
	returnOnEquity: ratio(
		"point",
		"returnOnEquity",
		"Return on equity",
		"Net income, latest fiscal year ÷ shareholders' equity, latest quarter end",
		"percent",
		line("netIncome", latestYear),
		line("shareholdersEquity", latestQuarter),
	),
	dividendYield: ratio(
		"point",
		"dividendYield",
		"Dividend yield",
		"Dividends paid, last four quarters ÷ market cap",
		"percent",
		line("dividendsPaid", lastFourQuarters),
		marketCapRef,
	),
	buybackYield: metric(
		"point",
		"buybackYield",
		"Buyback yield",
		"(Share repurchases − proceeds from stock plans), last four quarters ÷ market cap",
		"percent",
		[
			line("shareRepurchases", lastFourQuarters),
			line("shareIssuanceProceeds", lastFourQuarters),
			marketCapRef,
		],
		marketCapRef,
	),
	totalDebt: metric(
		"point",
		"totalDebt",
		"Total debt",
		"Short-term debt + long-term debt, latest quarter end",
		"usd",
		[line("shortTermDebt", latestQuarter), line("longTermDebt", latestQuarter)],
	),
	currentRatio: ratio(
		"point",
		"currentRatio",
		"Current ratio",
		"Total current assets ÷ total current liabilities, latest quarter end",
		"ratio",
		line("totalCurrentAssets", latestQuarter),
		line("totalCurrentLiabilities", latestQuarter),
	),
	stockPayToRevenue: ratio(
		"point",
		"stockPayToRevenue",
		"Stock-based pay to revenue",
		"Share-based compensation ÷ revenue, latest fiscal year",
		"percent",
		line("shareBasedCompensation", latestYear),
		line("revenue", latestYear),
	),
	marketCap: metric(
		"point",
		"marketCap",
		"Market cap",
		"Price × diluted shares, latest fiscal year",
		"usd",
		[priceNow, line("dilutedShares", latestYear)],
	),
	priceToEarnings: ratio(
		"point",
		"priceToEarnings",
		"P/E",
		"Price ÷ diluted EPS, latest fiscal year",
		"ratio",
		priceNow,
		line("dilutedEps", latestYear),
	),
	priceToEarningsAtYearEnd: ratio(
		"perPeriod",
		"priceToEarningsAtYearEnd",
		"P/E at fiscal year end",
		"Price at fiscal year end ÷ diluted EPS",
		"ratio",
		{ from: "market", key: "priceAtFiscalYearEnd", at: samePeriod },
		line("dilutedEps", samePeriod),
	),
	priceToEarningsMedian10y: {
		kind: "point",
		key: "priceToEarningsMedian10y",
		name: "Median P/E, 10 years",
		formula: "Median of the P/E at the last 10 fiscal year ends",
		unit: "ratio",
		inputs: [
			{
				from: "metric",
				key: "priceToEarningsAtYearEnd",
				at: { kind: "lastFiscalYears", count: 10 },
			},
		],
		guards: [],
		minPoints: 5,
	},
	freeCashFlow: metric(
		"perPeriod",
		"freeCashFlow",
		"Free cash flow",
		"Operating cash flow − capital expenditure",
		"usd",
		[
			line("operatingCashFlow", samePeriod),
			line("capitalExpenditure", samePeriod),
		],
	),
	freeCashFlowYield: ratio(
		"point",
		"freeCashFlowYield",
		"Free cash flow yield",
		"Free cash flow, latest fiscal year ÷ market cap",
		"percent",
		{ from: "metric", key: "freeCashFlow", at: latestYear },
		marketCapRef,
	),
	priceToFreeCashFlow: ratio(
		"point",
		"priceToFreeCashFlow",
		"P/FCF",
		"Market cap ÷ free cash flow, latest fiscal year",
		"ratio",
		marketCapRef,
		{ from: "metric", key: "freeCashFlow", at: latestYear },
	),
	priceToBook: ratio(
		"point",
		"priceToBook",
		"P/B",
		"Market cap ÷ shareholders' equity, latest quarter end",
		"ratio",
		marketCapRef,
		line("shareholdersEquity", latestQuarter),
	),
	enterpriseValue: metric(
		"point",
		"enterpriseValue",
		"Enterprise value",
		"Market cap + total debt − cash and short-term investments, latest quarter end",
		"usd",
		[
			marketCapRef,
			{ from: "metric", key: "totalDebt", at: null },
			line("cashAndShortTermInvestments", latestQuarter),
		],
	),
	enterpriseValueToEbit: ratio(
		"point",
		"enterpriseValueToEbit",
		"EV/EBIT",
		"Enterprise value ÷ operating income, latest fiscal year",
		"ratio",
		{ from: "metric", key: "enterpriseValue", at: null },
		line("operatingIncome", latestYear),
	),
};

/** Returns the value of a single-period input. */
function amount(input: ResolvedInput): number {
	return isWindow(input) ? Number.NaN : Number(input.value);
}

/** Returns the median of the points of a window that are not missing. */
function median(input: ResolvedInput): number {
	const values = isWindow(input)
		? input.flatMap((point) => (point === null ? [] : [Number(point.value)]))
		: [];
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 1
		? sorted[middle]
		: (sorted[middle - 1] + sorted[middle]) / 2;
}

/** Divides the dividend by the divisor of a metric that {@link ratio} builds. */
const divide: Formula = ([dividend, divisor]) =>
	amount(dividend) / amount(divisor);

/** The arithmetic of each metric, by key. */
export const formulas: Record<MetricKey, Formula> = {
	operatingMargin: divide,
	returnOnEquity: divide,
	dividendYield: divide,
	buybackYield: ([bought, issued, cap]) =>
		(amount(bought) - amount(issued)) / amount(cap),
	totalDebt: ([short, long]) => amount(short) + amount(long),
	currentRatio: divide,
	stockPayToRevenue: divide,
	marketCap: ([price, shares]) => amount(price) * amount(shares),
	priceToEarnings: divide,
	priceToEarningsAtYearEnd: divide,
	priceToEarningsMedian10y: ([window]) => median(window),
	freeCashFlow: ([operating, capital]) => amount(operating) - amount(capital),
	freeCashFlowYield: divide,
	priceToFreeCashFlow: divide,
	priceToBook: divide,
	enterpriseValue: ([cap, debt, cash]) =>
		amount(cap) + amount(debt) - amount(cash),
	enterpriseValueToEbit: divide,
};

/**
 * Tells whether `ref` names a figure that exists. A share count, a per-share
 * figure or a balance sheet line has no sum over the last four quarters. A
 * share count and a per-share figure have no fourth quarter, so they have no
 * latest quarter either. Each market figure has its own period choices. A
 * metric has no period only when it is a point metric, and otherwise reads a
 * fiscal year or the same period, because no other choice resolves to a
 * period that a metric can be evaluated for.
 */
export function isValidFigureRef(ref: FigureRef): boolean {
	const at = ref.at?.kind ?? null;
	switch (ref.from) {
		case "line":
			return at === "lastFourQuarters"
				? flowLineKeys.has(ref.key)
				: at !== "latestClose" &&
						!(
							at === "latestQuarter" &&
							(ref.key === "dilutedShares" || ref.key === "dilutedEps")
						);
		case "market":
			return at === "latestClose"
				? ref.key !== "priceAtFiscalYearEnd"
				: ref.key !== "price" &&
						(at === "fiscalYear" ||
							at === "samePeriod" ||
							at === "lastFiscalYears");
		case "metric":
			return ref.at === null
				? metrics[ref.key].kind === "point"
				: at === "samePeriod" ||
						at === "fiscalYear" ||
						at === "lastFiscalYears";
	}
}

/**
 * Evaluates the metric `key` over `sections`. `period` is the period of a
 * per-period metric, and `null` for a point metric.
 *
 * The rules apply in this order:
 *
 * 1. If a single-period input is a metric whose result is not `value`, the
 *    metric returns that same result, so the innermost failed guard reaches
 *    the caller.
 * 2. If a single-period input is missing, the result is `missingInput`.
 * 3. If a window input has fewer points than `minPoints`, the result is
 *    `shortHistory`.
 * 4. The first guard that fails gives `failedGuard`.
 *
 * Otherwise the result holds a derived claim with the formula and the input
 * claims. A per-period metric takes `period`. A point metric takes the period
 * that its inputs share, or `null` when they share none.
 */
export function evaluateMetric(
	key: MetricKey,
	sections: CompletedSections,
	period: Nullable<Period> = null,
): MetricResult {
	return evaluate(metrics[key], sections, period);
}

/**
 * Evaluates `metric` over `sections` by the rules of {@link evaluateMetric}.
 * It is exported only for tests, so a test can evaluate a metric that is not
 * in {@link metrics}. Call {@link evaluateMetric} everywhere else.
 *
 * Throws {@link MissingGuardInput} when a guard names a figure that is not
 * one of the metric's inputs.
 */
export function evaluate(
	metric: Metric,
	sections: CompletedSections,
	period: Nullable<Period>,
): MetricResult {
	const { key } = metric;
	const resolved = metric.inputs.map((ref) => resolve(ref, sections, period));
	const results = resolved.filter(
		(input): input is MetricResult => !isWindow(input),
	);
	const stop =
		results.find(
			(result) => result.kind !== "value" && result.kind !== "missingInput",
		) ?? results.find((result) => result.kind !== "value");
	if (stop !== undefined) {
		return stop;
	}
	const inputs = resolved.flatMap((input): ResolvedInput[] =>
		isWindow(input) ? [input] : input.kind === "value" ? [input.claim] : [],
	);
	const windows = inputs.filter(isWindow);
	if (
		windows.some(
			(points) =>
				points.filter((point) => point !== null).length <
				(metric.minPoints ?? 0),
		)
	) {
		return { kind: "shortHistory" };
	}
	for (const guard of metric.guards) {
		const input = guardInput(metric, inputs, guard);
		if (
			!isWindow(input) &&
			!meets(amount(input), guard.comparison, guard.value)
		) {
			return { kind: "failedGuard", guard, input };
		}
	}
	const claims = inputs.flatMap((input) =>
		isWindow(input) ? input.filter((point) => point !== null) : [input],
	);
	const [first, ...rest] = claims;
	if (first === undefined) {
		return { kind: "missingInput" };
	}
	const claimPeriod =
		metric.kind === "perPeriod" ? period : sharedPeriod(claims);
	return {
		kind: "value",
		claim: {
			id:
				claimPeriod === null
					? `metric.${key}`
					: `metric.${key}.${periodPart(claimPeriod)}`,
			label: metric.name,
			value: formulas[key](inputs),
			unit: metric.unit,
			period: claimPeriod,
			source: {
				kind: "derived",
				formula: metric.formula,
				inputs: [first, ...rest],
			},
		},
	};
}

/** Tells whether `input` is a window of points. */
export function isWindow<T extends object>(
	input: T | readonly Figure[],
): input is readonly Figure[] {
	return Array.isArray(input);
}

/**
 * Returns the resolved input that `guard` names, found by {@link sameRef}.
 * Throws {@link MissingGuardInput} when no input of `metric` matches.
 */
function guardInput(
	metric: Metric,
	inputs: readonly ResolvedInput[],
	guard: Guard,
): ResolvedInput {
	const input =
		inputs[metric.inputs.findIndex((ref) => sameRef(ref, guard.input))];
	if (input === undefined) {
		throw new MissingGuardInput(metric.key, guard.input);
	}
	return input;
}

/**
 * Tells whether two references name the same figure at the same period. A
 * guard finds its input by this test.
 */
export function sameRef(a: FigureRef, b: FigureRef): boolean {
	return (
		a.from === b.from &&
		a.key === b.key &&
		JSON.stringify(a.at) === JSON.stringify(b.at)
	);
}

/** Tells whether `value` meets `comparison` against `bound`. */
export function meets(
	value: number,
	comparison: Comparison,
	bound: number,
): boolean {
	switch (comparison) {
		case "above":
			return value > bound;
		case "atLeast":
			return value >= bound;
		case "below":
			return value < bound;
		case "atMost":
			return value <= bound;
	}
}

/**
 * Resolves `ref` to a metric result for a single period, or to the points of
 * a window. A statement line or a market figure gives `value`, or
 * `missingInput` for a `null` figure. `checks.ts` reads a check's figures
 * with it.
 */
export function resolve(
	ref: FigureRef,
	sections: CompletedSections,
	period: Nullable<Period>,
): MetricResult | readonly Figure[] {
	if (ref.at?.kind === "lastFiscalYears") {
		const single: FigureRef = { ...ref, at: samePeriod };
		return windowYears(sections, ref.at.count).map((year) => {
			const result = year === null ? null : resolve(single, sections, year);
			return result !== null && !isWindow(result) && result.kind === "value"
				? result.claim
				: null;
		});
	}
	if (ref.from === "metric") {
		const at = ref.at === null ? null : targetPeriod(ref.at, sections, period);
		return ref.at !== null && at === null
			? { kind: "missingInput" }
			: evaluateMetric(ref.key, sections, at);
	}
	const figure = figureOf(ref, sections, period);
	return figure === null
		? { kind: "missingInput" }
		: { kind: "value", claim: figure };
}

/** Returns the fiscal years that the annual tables cover, oldest first. */
function coveredYears(sections: CompletedSections): readonly Period[] {
	return sections.financials?.income.annual.periods ?? [];
}

/** Returns the covered fiscal year `yearsBack` years before the latest one, or `null`. */
function fiscalYearBack(
	sections: CompletedSections,
	yearsBack: number,
): Nullable<Period> {
	const years = coveredYears(sections);
	const latest = years.at(-1);
	return latest === undefined
		? null
		: (years.find(
				(year) => year.fiscalYear === latest.fiscalYear - yearsBack,
			) ?? null);
}

/** Returns the last `count` covered fiscal years, oldest first, with `null` for a year with no column. */
function windowYears(
	sections: CompletedSections,
	count: number,
): Nullable<Period>[] {
	return Array.from({ length: count }, (_, position) =>
		fiscalYearBack(sections, count - 1 - position),
	);
}

/** Returns the one period that `at` picks, for a choice that names a fiscal year or the same period. */
function targetPeriod(
	at: PeriodChoice,
	sections: CompletedSections,
	period: Nullable<Period>,
): Nullable<Period> {
	switch (at.kind) {
		case "samePeriod":
			return period;
		case "fiscalYear":
			return fiscalYearBack(sections, at.yearsBack);
		default:
			return null;
	}
}

/** Returns the figure that a statement line or a market reference names. */
function figureOf(
	ref: Exclude<FigureRef, { from: "metric" }>,
	sections: CompletedSections,
	period: Nullable<Period>,
): Figure {
	const quarterlyLines = linesOf(ref, sections, "quarterly");
	const [quarterly] = quarterlyLines;
	switch (ref.at.kind) {
		case "latestClose":
			return ref.key === "price"
				? (sections.masthead?.price ?? null)
				: ref.key === "treasuryYield10y"
					? (sections.valuation?.treasuryYieldNow ?? null)
					: null;
		case "latestQuarter":
			return quarterly?.points.at(-1) ?? null;
		case "lastFourQuarters":
			return ref.from === "line" && quarterly !== undefined
				? sumOfLastFourQuarters(ref.key, quarterly)
				: null;
		default: {
			const target = targetPeriod(ref.at, sections, period);
			const annual =
				ref.from === "market"
					? yearEndSeriesOf(ref.key, sections)
					: linesOf(ref, sections, "annual");
			return target === null
				? null
				: pointAtSamePeriod([...annual, ...quarterlyLines], target);
		}
	}
}

/**
 * Returns the year-end series of a market figure: the masthead's prices or the
 * Valuation section's Treasury yields. It returns no series for `price`, or
 * while the section has not loaded.
 */
function yearEndSeriesOf(
	key: MarketKey,
	sections: CompletedSections,
): Series[] {
	const { masthead, valuation } = sections;
	switch (key) {
		case "priceAtFiscalYearEnd":
			return masthead === null ? [] : [masthead.priceAtFiscalYearEnds];
		case "treasuryYield10y":
			return valuation === null
				? []
				: [valuation.treasuryYieldAtFiscalYearEnds];
		default:
			return [];
	}
}

/**
 * Returns the line of `ref` in the `table` of its statement, or no line for a
 * market figure.
 */
function linesOf(
	ref: Exclude<FigureRef, { from: "metric" }>,
	sections: CompletedSections,
	table: "annual" | "quarterly",
): Series[] {
	const { financials } = sections;
	return ref.from === "market" || financials === null
		? []
		: [financials.income, financials.balance, financials.cashFlow].flatMap(
				(statement) =>
					statement[table].lines.filter((line) => line.key === ref.key),
			);
}

/** Returns the first point of `series` at the same period as `target`, or `null`. */
function pointAtSamePeriod(series: readonly Series[], target: Period): Figure {
	for (const { periods, points } of series) {
		const position = periods.findIndex((period) =>
			isSamePeriod(period, target),
		);
		if (position !== -1) {
			return points[position] ?? null;
		}
	}
	return null;
}

/**
 * Tells whether two periods are the same period: their kind, fiscal year,
 * fiscal quarter and end date match. A fiscal year also pairs with the
 * annual instant at its end.
 */
function isSamePeriod(a: Period, b: Period): boolean {
	if (
		a.fiscalYear !== b.fiscalYear ||
		a.fiscalQuarter !== b.fiscalQuarter ||
		a.endsOn !== b.endsOn
	) {
		return false;
	}
	const kinds = [a.kind, b.kind];
	return (
		a.kind === b.kind ||
		(kinds.includes("fiscalYear") && kinds.includes("instant"))
	);
}

/**
 * Returns the period that every claim shares, or `null`. For a fiscal year
 * paired with the instant at its end, it returns the fiscal year.
 */
function sharedPeriod(claims: readonly Claim[]): Nullable<Period> {
	const periods = claims.map((claim) => claim.period);
	const first = periods[0];
	if (
		first === null ||
		!periods.every((period) => period !== null && isSamePeriod(period, first))
	) {
		return null;
	}
	return periods.find((period) => period?.kind !== "instant") ?? first;
}

/** Sums the last four points of the quarterly line `key`, or returns `null` when `key` is not a flow line. */
function sumOfLastFourQuarters(key: LineKey, line: Series): Figure {
	const quarters = line.points.slice(-4);
	const last = line.periods.at(-1);
	if (
		!flowLineKeys.has(key) ||
		last === undefined ||
		quarters.length < 4 ||
		!quarters.every(isPeriodNumberClaim)
	) {
		return null;
	}
	const [first, ...rest] = quarters;
	const period: Period = {
		kind: "lastFourQuarters",
		fiscalYear: last.fiscalYear,
		fiscalQuarter: null,
		endsOn: last.endsOn,
	};
	return {
		id: `metric.${key}.${periodPart(period)}`,
		label: line.label,
		value: quarters.reduce((sum, claim) => sum + claim.value, 0),
		unit: line.unit,
		period,
		source: {
			kind: "derived",
			formula: quarters.map((claim) => periodName(claim.period)).join(" + "),
			inputs: [first, ...rest],
		},
	};
}

/** Renders `period` as the period part of a claim id, such as `FY2026` or `L4Q-2026-07-26`. */
function periodPart(period: Period): string {
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

/**
 * Returns the change of the price over one month, as a fraction of the
 * price a month earlier. The masthead draws it next to the price.
 */
export function priceChangeOneMonth(masthead: MastheadSection): Figure {
	return share(
		"metric.priceChangeOneMonth",
		"Price change over one month",
		"(Price − Price a month earlier) ÷ Price a month earlier",
		[masthead.price, masthead.priceMonthEarlier],
		([now, before]) => [now - before, before],
	);
}

/**
 * Returns the share of revenue of the row at `position` in the `list` of
 * `overview`: the revenue of the row divided by the revenue of every row of
 * the list. Returns `null` when the list has no row at `position`.
 */
export function revenueShare(
	overview: OverviewSection,
	list: "segments" | "regions",
	position: number,
): Figure {
	const parts = overview[list];
	const row = parts[position];
	if (row === undefined) {
		return null;
	}
	const names = parts.map((part) => `${part.name} revenue`).join(" + ");
	return share(
		`metric.revenueShare.${list}.${position}`,
		`${row.name} share of revenue`,
		`${row.name} revenue ÷ (${names})`,
		parts.map((part) => part.revenue),
		(values) => [
			values[position],
			values.reduce((sum, value) => sum + value, 0),
		],
	);
}

/** The three ownership shares of the company, one figure each. */
export interface OwnershipShares {
	readonly institutions: Figure;
	readonly insiders: Figure;
	readonly public: Figure;
}

/**
 * Returns the shares of the company that institutions, insiders and the
 * public hold, each as a fraction of the shares outstanding. The public
 * holds the shares that neither institutions nor insiders hold. Its share
 * is `null` when the other two hold more than the shares outstanding.
 */
export function ownershipShares(overview: OverviewSection): OwnershipShares {
	const { sharesOutstanding, institutionShares, insiderShares } =
		overview.ownership;
	const held = [institutionShares, insiderShares, sharesOutstanding];
	return {
		institutions: share(
			"metric.ownershipShares.institutions",
			"Held by institutions",
			"Shares held by institutions ÷ Shares outstanding",
			[institutionShares, sharesOutstanding],
			([shares, outstanding]) => [shares, outstanding],
		),
		insiders: share(
			"metric.ownershipShares.insiders",
			"Held by insiders",
			"Shares held by insiders ÷ Shares outstanding",
			[insiderShares, sharesOutstanding],
			([shares, outstanding]) => [shares, outstanding],
		),
		public: withinTotal(
			share(
				"metric.ownershipShares.public",
				"Held by the public",
				"(Shares outstanding − Shares held by institutions − Shares held by insiders) ÷ Shares outstanding",
				held,
				([institutions, insiders, outstanding]) => [
					outstanding - institutions - insiders,
					outstanding,
				],
			),
		),
	};
}

/**
 * Builds the percent claim of a per-row function, or returns `null` when an
 * input is missing or not a number, or when the divisor is not above 0. The
 * claim takes the period that its inputs share, and `null` otherwise.
 */
function share(
	id: ClaimId,
	label: string,
	formula: string,
	inputs: readonly Figure[],
	part: (values: number[]) => [number, number],
): Figure {
	if (!inputs.every(isNumberClaim)) {
		return null;
	}
	const [first, ...rest] = inputs;
	if (first === undefined) {
		return null;
	}
	const [dividend, divisor] = part(inputs.map((claim) => claim.value));
	if (!(divisor > 0)) {
		return null;
	}
	return {
		id,
		label,
		value: dividend / divisor,
		unit: "percent",
		period: sharedPeriod(inputs),
		source: { kind: "derived", formula, inputs: [first, ...rest] },
	};
}

/**
 * Returns `null` for a share below 0. Institutions and insiders then hold
 * more than the shares outstanding, because the reported holdings overlap.
 */
function withinTotal(figure: Figure): Figure {
	return isNumberClaim(figure) && figure.value < 0 ? null : figure;
}

/** A claim with a number value, so a per-row function can do its arithmetic. */
type NumberClaim = Claim & { readonly value: number };

/** Tells whether `figure` is a claim with a number value. */
function isNumberClaim(figure: Figure): figure is NumberClaim {
	return figure !== null && typeof figure.value === "number";
}
