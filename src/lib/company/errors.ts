import type { Ticker } from "../domain/ticker";
import type { FigureRef } from "./metrics";
import type { MetricKey } from "./types";

/**
 * Base class for the errors of the company library, such as the errors that a
 * `CompanyGateway` method rejects with. Subclasses supply their bracketed name, a description and an optional tail,
 * such as `Reason: '<detail>'`.
 */
export abstract class CompanyFailure extends Error {
	protected constructor(
		name: string,
		description: string,
		tail: string | null,
	) {
		super(
			tail === null
				? `[${name}] ${description}`
				: `[${name}] ${description}, ${tail}`,
		);
		this.name = name;
	}
}

/**
 * Error indicating that the adapter knows no company for a ticker. The page
 * shows its missing state when `getMasthead` rejects with this error.
 */
export class MissingCompany extends CompanyFailure {
	readonly ticker: Ticker;

	constructor(ticker: Ticker) {
		super(
			"MissingCompany",
			"No company has this ticker",
			`Input: '${ticker.value}'`,
		);
		this.ticker = ticker;
	}
}

/**
 * Error indicating that a request for company data did not complete, for
 * example on a network timeout. The page shows its failed state.
 */
export class FailedCompanyRequest extends CompanyFailure {
	/** The detail of the failure, or `null` when the caller gave none. */
	readonly reason: string | null;

	constructor(reason?: string) {
		super(
			"FailedCompanyRequest",
			"The company request did not complete",
			reason ? `Reason: '${reason}'` : null,
		);
		this.reason = reason ? reason : null;
	}
}

/**
 * Error indicating that a guard of a metric names a figure that is not one of
 * the metric's inputs, so the guard has no input to test. It is a defect in
 * the metric data, not in the company data.
 */
export class MissingGuardInput extends CompanyFailure {
	readonly metric: MetricKey;
	readonly input: FigureRef;

	constructor(metric: MetricKey, input: FigureRef) {
		super(
			"MissingGuardInput",
			"A guard names a figure that is not an input of its metric",
			`Reason: '${metric} guards ${refName(input)}'`,
		);
		this.metric = metric;
		this.input = input;
	}
}

/** Names `ref` as the tables of the data model write it, such as `line revenue @ fiscalYear(1)`. */
function refName(ref: FigureRef): string {
	const figure = `${ref.from} ${ref.key}`;
	if (ref.at === null) {
		return figure;
	}
	switch (ref.at.kind) {
		case "fiscalYear":
			return `${figure} @ fiscalYear(${ref.at.yearsBack})`;
		case "lastFiscalYears":
			return `${figure} @ lastFiscalYears(${ref.at.count})`;
		default:
			return `${figure} @ ${ref.at.kind}`;
	}
}
