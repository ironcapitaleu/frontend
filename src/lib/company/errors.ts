import type { Ticker } from "../domain/ticker";

/**
 * Base class for the errors that a `CompanyGateway` method rejects with.
 * Subclasses supply their bracketed name, a description and an optional tail,
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
