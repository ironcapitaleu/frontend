/**
 * # Email
 *
 * A validated email address, parsed once at the boundary where free-floating
 * input enters (e.g. the login form) so the rest of the app holds a checked type
 * instead of a raw string. The frontend adaptation of the backend's value types
 * (domain-concept skill, Path A: `Cik`, `UserAgent`): "parse, don't validate".
 *
 * The inner value is private and normalised (trimmed + lower-cased); an `Email`
 * is only obtainable through {@link Email.parse}, which throws {@link InvalidEmail}
 * on malformed input.
 */

/** Why an email string was rejected — one variant per invariant. */
export type InvalidEmailReason =
	| "empty"
	| "contains-whitespace"
	| "missing-at"
	| "multiple-at"
	| "empty-local-part"
	| "invalid-domain";

/**
 * Domain error raised by {@link Email.parse} when validation fails. Carries the
 * reason and the offending input, and renders in the bracketed Display format
 * (see AGENTS.md): `[InvalidEmail] Not a valid email address, Reason: '<reason>', Input: '<input>'`.
 */
export class InvalidEmail extends Error {
	readonly reason: InvalidEmailReason;
	readonly invalidInput: string;

	constructor(reason: InvalidEmailReason, invalidInput: string) {
		super(
			`[InvalidEmail] Not a valid email address, Reason: '${reason}', Input: '${invalidInput}'`,
		);
		this.name = "InvalidEmail";
		this.reason = reason;
		this.invalidInput = invalidInput;
	}
}

/**
 * A validated, normalised email address.
 *
 * Immutable: any transformation would return a new instance. Compare with
 * {@link Email.equals}, never `===` (two instances of the same address are
 * distinct objects). Serialises to its plain string via `toString` / `toJSON`.
 */
export class Email {
	private readonly _value: string;

	private constructor(value: string) {
		this._value = value;
	}

	/**
	 * Validates and normalises `raw` (trim + lower-case) into an {@link Email}.
	 * The only way to construct one.
	 *
	 * @throws InvalidEmail when the input is empty, contains whitespace, lacks a
	 * single `@`, or has an empty local part or an implausible domain.
	 */
	static parse(raw: string): Email {
		const value = raw.trim().toLowerCase();

		if (value.length === 0) {
			throw new InvalidEmail("empty", raw);
		}
		if (/\s/.test(value)) {
			throw new InvalidEmail("contains-whitespace", raw);
		}

		const parts = value.split("@");
		if (parts.length < 2) {
			throw new InvalidEmail("missing-at", raw);
		}
		if (parts.length > 2) {
			throw new InvalidEmail("multiple-at", raw);
		}

		const [localPart, domain] = parts;
		if (localPart.length === 0) {
			throw new InvalidEmail("empty-local-part", raw);
		}
		if (
			!domain.includes(".") ||
			domain.startsWith(".") ||
			domain.endsWith(".")
		) {
			throw new InvalidEmail("invalid-domain", raw);
		}

		return new Email(value);
	}

	/** Whether `raw` is a valid email, without constructing or throwing. */
	static isValid(raw: string): boolean {
		try {
			Email.parse(raw);
			return true;
		} catch {
			return false;
		}
	}

	/** The normalised email string. */
	get value(): string {
		return this._value;
	}

	/** The local part — everything before the `@`. */
	get localPart(): string {
		return this._value.slice(0, this._value.indexOf("@"));
	}

	/** The domain — everything after the `@`. */
	get domain(): string {
		return this._value.slice(this._value.indexOf("@") + 1);
	}

	/** Value equality: two emails are equal when their normalised values match. */
	equals(other: Email): boolean {
		return this._value === other._value;
	}

	/** Renders as the plain email string (template literals, `String(...)`). */
	toString(): string {
		return this._value;
	}

	/** Serialises to the plain email string (`JSON.stringify`, storage, network). */
	toJSON(): string {
		return this._value;
	}
}
