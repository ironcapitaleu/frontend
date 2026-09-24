/**
 * # Ticker
 *
 * A validated ticker, the short code under which an exchange lists a company,
 * for example `MRDN`. The company page parses the `:symbol` part of its URL
 * into a `Ticker` once, where the URL enters the app, so the rest of the app
 * holds a checked type instead of raw URL text. `CompanyPage` is that caller.
 * Follows the "parse, don't validate" rule of AGENTS.md "Value Objects
 * (Newtypes)", like `Email` in `email.ts`.
 *
 * The inner value is private and normalised (trimmed and upper-cased). A
 * `Ticker` is only obtainable through {@link Ticker.parse}, which throws
 * {@link InvalidTicker} on malformed input.
 */

/**
 * The longest normalised ticker accepted. US tickers have at most five letters.
 * The cap leaves room for a share-class suffix and for longer codes on other
 * exchanges.
 */
const MAX_LENGTH = 10;

/** Why a ticker string was rejected — one variant per rule, in check order. */
export type InvalidTickerReason =
	| "empty"
	| "too-long"
	| "invalid-character"
	| "invalid-separator";

/**
 * Error indicating that the raw input given to {@link Ticker.parse} is not a
 * valid ticker. Carries the reason and the raw input, and renders in the
 * bracketed display format:
 * `[InvalidTicker] Not a valid ticker, Reason: '<reason>', Input: '<input>'`.
 */
export class InvalidTicker extends Error {
	readonly reason: InvalidTickerReason;
	readonly invalidInput: string;

	constructor(reason: InvalidTickerReason, invalidInput: string) {
		super(
			`[InvalidTicker] Not a valid ticker, Reason: '${reason}', Input: '${invalidInput}'`,
		);
		this.name = "InvalidTicker";
		this.reason = reason;
		this.invalidInput = invalidInput;
	}
}

/**
 * A validated, normalised ticker such as `MRDN` or `BRK.B`.
 *
 * Immutable. Compare with {@link Ticker.equals}, never `===` (two instances of
 * the same ticker are distinct objects). Serialises to its plain string via
 * `toString` / `toJSON`.
 */
export class Ticker {
	private readonly _value: string;

	private constructor(value: string) {
		this._value = value;
	}

	/**
	 * Validates and normalises `raw` (trim + upper-case) into a {@link Ticker}.
	 * The only way to construct one.
	 *
	 * @throws InvalidTicker with reason `empty` when nothing is left after
	 * trimming, `too-long` when the value has more than 10 characters,
	 * `invalid-character` when it has a character other than `A`–`Z`, a digit,
	 * `.` or `-`, and `invalid-separator` when a `.` or `-` does not sit between
	 * two letters or digits. The first rule that fails sets the reason.
	 */
	static parse(raw: string): Ticker {
		const trimmed = raw.trim();

		if (trimmed.length === 0) {
			throw new InvalidTicker("empty", raw);
		}
		if (trimmed.length > MAX_LENGTH) {
			throw new InvalidTicker("too-long", raw);
		}
		// Check the character set before upper-casing. Unicode case mapping turns
		// some non-ASCII characters into ASCII letters ("ı" becomes "I", "ß"
		// becomes "SS"), so a check after toUpperCase accepts input that is not a
		// ticker. The two patterns below allow the same characters and must change
		// together. The first one only picks the reason.
		if (!/^[A-Za-z0-9.-]+$/.test(trimmed)) {
			throw new InvalidTicker("invalid-character", raw);
		}

		const value = trimmed.toUpperCase();

		if (!/^[A-Z0-9]+(?:[.-][A-Z0-9]+)*$/.test(value)) {
			throw new InvalidTicker("invalid-separator", raw);
		}

		return new Ticker(value);
	}

	/** Whether `raw` is a valid ticker, without constructing or throwing. */
	static isValid(raw: string): boolean {
		try {
			Ticker.parse(raw);
			return true;
		} catch {
			return false;
		}
	}

	/** The normalised ticker string. */
	get value(): string {
		return this._value;
	}

	/** Value equality: two tickers are equal when their normalised values match. */
	equals(other: Ticker): boolean {
		return this._value === other._value;
	}

	/** Renders as the plain ticker string (template literals, `String(...)`). */
	toString(): string {
		return this._value;
	}

	/** Serialises to the plain ticker string (`JSON.stringify`, storage, network). */
	toJSON(): string {
		return this._value;
	}
}
