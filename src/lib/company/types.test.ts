import { describe, expectTypeOf, it } from "vitest";

import type {
	Claim,
	FinancialsSection,
	Filing,
	IsoDate,
	MastheadSection,
	OverviewSection,
	OwnershipSummary,
	Period,
	SectorBenchmark,
	StatementLine,
} from "./types";

/** The walk stops at these types. A claim is the figure itself, a period holds column keys and a filing is a source document. */
type WalkStop = Claim | Period | Filing;

/** The row keys of the design note §4 label rule, as an owner type and a field name. */
type RowKey =
	| [SectorBenchmark, "peerCount"]
	| [StatementLine, "level"]
	| [OwnershipSummary, "asOf"];

/**
 * The paths of the fields of `T` that hold a bare `number` or `IsoDate`
 * instead of a `Figure`, or `never` when every figure is a `Figure`.
 */
type BareFigureFields<T, Path extends string = ""> = T extends WalkStop
	? never
	: T extends number | IsoDate
		? Path
		: T extends readonly (infer Item)[]
			? BareFigureFields<Item, `${Path}[]`>
			: T extends (...args: never[]) => unknown
				? never
				: T extends object
					? {
							[Key in keyof T & string]: [T, Key] extends RowKey
								? never
								: BareFigureFields<T[Key], `${Path}.${Key}`>;
						}[keyof T & string]
					: never;

describe("section types", () => {
	it("should find no bare number or date when the walk visits MastheadSection", () => {
		type ExpectedResult = never;

		type Result = BareFigureFields<MastheadSection>;

		expectTypeOf<Result>().toEqualTypeOf<ExpectedResult>();
	});

	it("should find no bare number or date when the walk visits OverviewSection", () => {
		type ExpectedResult = never;

		type Result = BareFigureFields<OverviewSection>;

		expectTypeOf<Result>().toEqualTypeOf<ExpectedResult>();
	});

	it("should find no bare number or date when the walk visits FinancialsSection", () => {
		type ExpectedResult = never;

		type Result = BareFigureFields<FinancialsSection>;

		expectTypeOf<Result>().toEqualTypeOf<ExpectedResult>();
	});

	it("should name the field when a section type adds a bare number", () => {
		type FaultyOwnership = OwnershipSummary & {
			readonly institutionPercent: number;
		};
		type FaultySection = OverviewSection & {
			readonly ownership: FaultyOwnership;
		};

		type ExpectedResult = ".ownership.institutionPercent";

		type Result = BareFigureFields<FaultySection>;

		expectTypeOf<Result>().toEqualTypeOf<ExpectedResult>();
	});

	it("should name the field when a section type adds a bare date", () => {
		type FaultySection = MastheadSection & {
			readonly listedOn: IsoDate;
		};

		type ExpectedResult = ".listedOn";

		type Result = BareFigureFields<FaultySection>;

		expectTypeOf<Result>().toEqualTypeOf<ExpectedResult>();
	});
});
