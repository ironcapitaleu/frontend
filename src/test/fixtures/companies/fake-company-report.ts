import { Ticker } from "../../../lib/domain/ticker";
import type {
	Claim,
	ClaimValue,
	Filing,
	FinancialsSection,
	IsoDate,
	LineKey,
	MarketDataset,
	MastheadSection,
	MetricKey,
	OverviewSection,
	Period,
	SectorBenchmark,
	SourceDocument,
	Statement,
	StatementLine,
	StatementTable,
	Unit,
} from "../../../lib/company/types";

/**
 * The sections of Quillvane Instruments (QVAN), a made-up company for tests.
 * Its fiscal year ends on 31 December. It has two fiscal years, FY2024 and
 * FY2025, and the four quarters of FY2025. The 10-K for FY2025 is filed, so
 * the quarterly table ends at Q4 FY2025.
 *
 * The data follows the rules of the company data model, so a test can read
 * each kind of figure:
 *
 * - the income statement has a `null` fourth quarter, because no 10-Q reports it;
 * - the cash flow statement has `null` points for Q2 to Q4 and a year-to-date table;
 * - the balance sheet holds 31 Dec 2025 once in each table, with two encodings;
 * - each sector quartile is a derived claim over two peer claims;
 * - `profile.website` has no period.
 *
 * It uses its own company instead of MRDN, so a change to the sample data of
 * the app breaks no test that uses it.
 */
const EDGAR = "https://www.sec.gov/Archives/edgar/data/1999999";

function buildReport() {
	return {
		masthead: buildMasthead(),
		overview: buildOverview(),
		financials: buildFinancials(),
	};
}

function date(value: string): IsoDate {
	return value as IsoDate;
}

function fiscalYear(year: number): Period {
	return {
		kind: "fiscalYear",
		fiscalYear: year,
		fiscalQuarter: null,
		endsOn: date(`${year}-12-31`),
	};
}

function fiscalQuarter(quarter: number, endsOn: string): Period {
	return {
		kind: "fiscalQuarter",
		fiscalYear: 2025,
		fiscalQuarter: quarter,
		endsOn: date(endsOn),
	};
}

function yearToDate(quarter: number, endsOn: string): Period {
	return {
		kind: "yearToDate",
		fiscalYear: 2025,
		fiscalQuarter: quarter,
		endsOn: date(endsOn),
	};
}

function instant(year: number, quarter: number | null, endsOn: string): Period {
	return {
		kind: "instant",
		fiscalYear: year,
		fiscalQuarter: quarter,
		endsOn: date(endsOn),
	};
}

function filing(
	form: Filing["form"],
	accession: string,
	filedOn: string,
	periodLabel: string,
): Filing {
	return {
		kind: "filing",
		form,
		filer: "Quillvane Instruments, Inc.",
		accessionNumber: accession,
		filedOn: date(filedOn),
		periodLabel,
		indexUrl: `${EDGAR}/${accession.replaceAll("-", "")}/`,
	};
}

const TEN_K_2024 = filing(
	"10-K",
	"0001999999-25-000004",
	"2025-02-20",
	"FY2024",
);
const TEN_K_2025 = filing(
	"10-K",
	"0001999999-26-000003",
	"2026-02-19",
	"FY2025",
);
const TEN_Q = [
	filing("10-Q", "0001999999-25-000011", "2025-05-01", "Q1 FY2025"),
	filing("10-Q", "0001999999-25-000019", "2025-07-31", "Q2 FY2025"),
	filing("10-Q", "0001999999-25-000027", "2025-10-30", "Q3 FY2025"),
];
const THIRTEEN_F = filing(
	"13F-HR",
	"0001888888-25-000031",
	"2025-11-14",
	"Q3 2025",
);
const PRICES: MarketDataset = {
	kind: "market",
	name: "End-of-day prices, NASDAQ",
	asOf: date("2026-03-20"),
	url: "https://prices.example/QVAN",
};

function reported(
	id: string,
	label: string,
	value: ClaimValue,
	unit: Unit,
	period: Period | null,
	document: SourceDocument,
	line: string,
	xbrlTag: string | null,
): Claim {
	return {
		id,
		label,
		value,
		unit,
		period,
		source: {
			kind: "reported",
			document,
			line,
			xbrlTag,
			url:
				document.kind === "filing"
					? `${document.indexUrl}qvan.htm`
					: document.url,
		},
	};
}

function periodId(period: Period): string {
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

function buildMasthead(): MastheadSection {
	const yearEnds = [
		instant(2024, null, "2024-12-31"),
		instant(2025, null, "2025-12-31"),
	];
	const price = (id: string, value: number, on: string) =>
		reported(
			`masthead.${id}`,
			"Price",
			value,
			"usdPerShare",
			instant(Number(on.slice(0, 4)), null, on),
			PRICES,
			"Closing price, NASDAQ",
			null,
		);
	return {
		ticker: Ticker.parse("QVAN"),
		name: "Quillvane Instruments, Inc.",
		listings: [{ exchange: "NASDAQ", symbol: "QVAN" }],
		sector: "Industrials",
		country: "United States",
		reportingCurrency: "USD",
		fiscalYearEnd: "31 December",
		price: price("price", 84.2, "2026-03-20"),
		priceMonthEarlier: price("priceMonthEarlier", 79.5, "2026-02-20"),
		low52Weeks: price("low52Weeks", 61.35, "2025-04-08"),
		high52Weeks: price("high52Weeks", 88.9, "2026-01-14"),
		priceAtFiscalYearEnds: {
			key: "priceAtFiscalYearEnds",
			label: "Price at fiscal year end",
			unit: "usdPerShare",
			periods: yearEnds,
			points: [
				reported(
					"masthead.priceAtFiscalYearEnds.2024-12-31",
					"Price",
					64.1,
					"usdPerShare",
					yearEnds[0],
					PRICES,
					"Closing price, NASDAQ",
					null,
				),
				reported(
					"masthead.priceAtFiscalYearEnds.2025-12-31",
					"Price",
					82.75,
					"usdPerShare",
					yearEnds[1],
					PRICES,
					"Closing price, NASDAQ",
					null,
				),
			],
		},
	};
}

function tenK(
	id: string,
	label: string,
	value: ClaimValue,
	unit: Unit,
	line: string,
	xbrlTag: string | null,
): Claim {
	return reported(
		`overview.${id}`,
		label,
		value,
		unit,
		fiscalYear(2025),
		TEN_K_2025,
		line,
		xbrlTag,
	);
}

function benchmark(
	metric: MetricKey,
	quartiles: [number, number, number],
): SectorBenchmark {
	const names = ["lowerQuartile", "median", "upperQuartile"] as const;
	const peers = ["Alder Controls", "Brisk Metrology"];
	const [lowerQuartile, median, upperQuartile] = names.map((name, position) => {
		const inputs = peers.map((peer, row) =>
			reported(
				`overview.sectorBenchmarks.${metric}.${name}.peer${row}`,
				peer,
				quartiles[position],
				"percent",
				fiscalYear(2025),
				{ ...TEN_K_2025, filer: peer },
				`Peer figure › ${metric}`,
				null,
			),
		);
		return {
			id: `overview.sectorBenchmarks.${metric}.${name}`,
			label: `Sector ${name}`,
			value: quartiles[position],
			unit: "percent" as const,
			period: fiscalYear(2025),
			source: {
				kind: "derived" as const,
				formula: `${name} of the peer figures`,
				inputs: [inputs[0], inputs[1]] as [Claim, Claim],
			},
		};
	});
	return {
		metric,
		peerGroup: "Industrial instruments",
		peerCount: 2,
		lowerQuartile,
		median,
		upperQuartile,
	};
}

function buildOverview(): OverviewSection {
	const revenuePart = (list: string, name: string, value: number) => ({
		name,
		revenue: tenK(
			`${list}.${name}.revenue`,
			`${name} revenue`,
			value,
			"usd",
			`Note 15 › Segment information › ${name}`,
			"us-gaap:Revenues",
		),
	});
	const quarterEnd = instant(2025, 3, "2025-09-30");
	const ownershipClaim = (
		id: string,
		label: string,
		value: number,
		document: Filing,
		line: string,
		xbrlTag: string | null,
	) =>
		reported(
			`overview.ownership.${id}`,
			label,
			value,
			"shares",
			quarterEnd,
			document,
			line,
			xbrlTag,
		);
	return {
		business: tenK(
			"business",
			"Business",
			"Quillvane Instruments builds sensors and test equipment for factories.",
			"text",
			"Item 1 › Business",
			null,
		),
		segments: [
			revenuePart("segments", "Sensors", 1_900_000_000),
			revenuePart("segments", "Test equipment", 1_300_000_000),
		],
		regions: [
			revenuePart("regions", "Americas", 2_000_000_000),
			revenuePart("regions", "Europe", 1_200_000_000),
		],
		sectorBenchmarks: [
			benchmark("operatingMargin", [0.08, 0.12, 0.17]),
			benchmark("returnOnEquity", [0.09, 0.14, 0.2]),
			benchmark("dividendYield", [0.005, 0.012, 0.021]),
			benchmark("buybackYield", [0, 0.01, 0.025]),
		],
		ownership: {
			asOf: quarterEnd.endsOn,
			sharesOutstanding: ownershipClaim(
				"sharesOutstanding",
				"Shares outstanding",
				150_000_000,
				TEN_Q[2],
				"Cover page › Shares outstanding",
				"dei:EntityCommonStockSharesOutstanding",
			),
			institutionShares: ownershipClaim(
				"institutionShares",
				"Shares held by institutions",
				108_000_000,
				THIRTEEN_F,
				"Information table › Shares (sshPrnamt)",
				null,
			),
			insiderShares: ownershipClaim(
				"insiderShares",
				"Shares held by insiders",
				4_500_000,
				TEN_Q[2],
				"Security ownership › Directors and officers",
				null,
			),
		},
		profile: {
			founded: tenK(
				"profile.founded",
				"Founded",
				1987,
				"year",
				"Item 1 › History",
				null,
			),
			headquarters: tenK(
				"profile.headquarters",
				"Headquarters",
				"Portland, Oregon",
				"text",
				"Cover page › Address",
				"dei:EntityAddressCityOrTown",
			),
			employees: tenK(
				"profile.employees",
				"Employees",
				9_400,
				"count",
				"Item 1 › Human capital",
				"dei:EntityNumberOfEmployees",
			),
			chiefExecutive: tenK(
				"profile.chiefExecutive",
				"Chief executive",
				"Dana Whitcombe",
				"text",
				"Item 10 › Executive officers",
				null,
			),
			chiefExecutiveSince: tenK(
				"profile.chiefExecutiveSince",
				"Chief executive since",
				date("2019-04-01"),
				"date",
				"Item 10 › Executive officers",
				null,
			),
			auditor: tenK(
				"profile.auditor",
				"Auditor",
				"Hollis & Grant LLP",
				"text",
				"Item 9A › Auditor",
				"dei:AuditorName",
			),
			website: reported(
				"overview.profile.website",
				"Website",
				"https://quillvane.example",
				"text",
				null,
				TEN_K_2025,
				"Cover page › Website",
				null,
			),
		},
	};
}

type LineSpec = [
	key: LineKey,
	label: string,
	unit: Unit,
	level: number,
	xbrlTag: string,
	values: (number | null)[],
];

const ANNUAL = [fiscalYear(2024), fiscalYear(2025)];
const ANNUAL_DOCUMENTS = [TEN_K_2024, TEN_K_2025];
const QUARTERS = [
	fiscalQuarter(1, "2025-03-31"),
	fiscalQuarter(2, "2025-06-30"),
	fiscalQuarter(3, "2025-09-30"),
	fiscalQuarter(4, "2025-12-31"),
];
const QUARTER_DOCUMENTS = [...TEN_Q, TEN_K_2025];

function table(
	title: string,
	periods: Period[],
	documents: Filing[],
	specs: LineSpec[],
): StatementTable {
	const lines: StatementLine[] = specs.map(
		([key, label, unit, level, xbrlTag, values]) => ({
			key,
			label,
			unit,
			level,
			periods,
			points: values.map((value, position) =>
				value === null
					? null
					: reported(
							`financials.${key}.${periodId(periods[position])}`,
							label,
							value,
							unit,
							periods[position],
							documents[position],
							`${title} › ${label}`,
							xbrlTag,
						),
			),
		}),
	);
	return { periods, lines };
}

function statement(
	title: string,
	annual: LineSpec[],
	quarterly: LineSpec[],
	periods: Period[],
	yearToDate: StatementTable | null,
): Statement {
	return {
		annual: table(title, ANNUAL, ANNUAL_DOCUMENTS, annual),
		quarterly: table(title, periods, QUARTER_DOCUMENTS, quarterly),
		yearToDate,
	};
}

function buildFinancials(): FinancialsSection {
	const income = "Consolidated statements of income";
	const balance = "Consolidated balance sheets";
	const cashFlow = "Consolidated statements of cash flows";
	const quarterEnds = [
		instant(2025, 1, "2025-03-31"),
		instant(2025, 2, "2025-06-30"),
		instant(2025, 3, "2025-09-30"),
		instant(2025, 4, "2025-12-31"),
	];
	const yearEnds = [
		instant(2024, null, "2024-12-31"),
		instant(2025, null, "2025-12-31"),
	];
	const ytd = [yearToDate(2, "2025-06-30"), yearToDate(3, "2025-09-30")];
	return {
		income: statement(
			income,
			[
				[
					"revenue",
					"Revenue",
					"usd",
					0,
					"us-gaap:Revenues",
					[2_900_000_000, 3_200_000_000],
				],
				[
					"operatingIncome",
					"Operating income",
					"usd",
					1,
					"us-gaap:OperatingIncomeLoss",
					[380_000_000, 450_000_000],
				],
				[
					"netIncome",
					"Net income",
					"usd",
					1,
					"us-gaap:NetIncomeLoss",
					[290_000_000, 340_000_000],
				],
				[
					"dilutedEps",
					"Diluted EPS",
					"usdPerShare",
					2,
					"us-gaap:EarningsPerShareDiluted",
					[1.9, 2.25],
				],
				[
					"dilutedShares",
					"Diluted shares",
					"shares",
					2,
					"us-gaap:WeightedAverageNumberOfDilutedSharesOutstanding",
					[152_600_000, 151_100_000],
				],
			],
			[
				[
					"revenue",
					"Revenue",
					"usd",
					0,
					"us-gaap:Revenues",
					[760_000_000, 790_000_000, 810_000_000, null],
				],
				[
					"operatingIncome",
					"Operating income",
					"usd",
					1,
					"us-gaap:OperatingIncomeLoss",
					[104_000_000, 110_000_000, 115_000_000, null],
				],
				[
					"netIncome",
					"Net income",
					"usd",
					1,
					"us-gaap:NetIncomeLoss",
					[79_000_000, 83_000_000, 87_000_000, null],
				],
				[
					"dilutedEps",
					"Diluted EPS",
					"usdPerShare",
					2,
					"us-gaap:EarningsPerShareDiluted",
					[0.52, 0.55, 0.58, null],
				],
				[
					"dilutedShares",
					"Diluted shares",
					"shares",
					2,
					"us-gaap:WeightedAverageNumberOfDilutedSharesOutstanding",
					[151_600_000, 151_200_000, 150_800_000, null],
				],
			],
			QUARTERS,
			null,
		),
		balance: {
			annual: table(
				balance,
				yearEnds,
				ANNUAL_DOCUMENTS,
				balanceLines(
					[1_200_000_000, 1_350_000_000],
					[3_600_000_000, 3_900_000_000],
				),
			),
			quarterly: table(
				balance,
				quarterEnds,
				QUARTER_DOCUMENTS,
				balanceLines(
					[1_250_000_000, 1_280_000_000, 1_310_000_000, 1_350_000_000],
					[3_700_000_000, 3_750_000_000, 3_820_000_000, 3_900_000_000],
				),
			),
			yearToDate: null,
		},
		cashFlow: statement(
			cashFlow,
			cashFlowLines([420_000_000, 480_000_000], [300_000_000, 330_000_000]),
			cashFlowLines(
				[110_000_000, null, null, null],
				[75_000_000, null, null, null],
			),
			QUARTERS,
			table(
				cashFlow,
				ytd,
				TEN_Q.slice(1),
				cashFlowLines([225_000_000, 350_000_000], [155_000_000, 240_000_000]),
			),
		),
	};
}

/** Scales the current assets and the total assets into the eight balance sheet lines. */
function balanceLines(
	currentAssets: number[],
	totalAssets: number[],
): LineSpec[] {
	const part = (values: number[], share: number) =>
		values.map((value) => Math.round(value * share));
	return [
		[
			"totalCurrentAssets",
			"Total current assets",
			"usd",
			1,
			"us-gaap:AssetsCurrent",
			currentAssets,
		],
		["totalAssets", "Total assets", "usd", 0, "us-gaap:Assets", totalAssets],
		[
			"totalCurrentLiabilities",
			"Total current liabilities",
			"usd",
			1,
			"us-gaap:LiabilitiesCurrent",
			part(currentAssets, 0.5),
		],
		[
			"totalLiabilities",
			"Total liabilities",
			"usd",
			0,
			"us-gaap:Liabilities",
			part(totalAssets, 0.45),
		],
		[
			"shareholdersEquity",
			"Total shareholders' equity",
			"usd",
			0,
			"us-gaap:StockholdersEquity",
			part(totalAssets, 0.55),
		],
		[
			"cashAndShortTermInvestments",
			"Cash and short-term investments",
			"usd",
			2,
			"us-gaap:CashCashEquivalentsAndShortTermInvestments",
			part(currentAssets, 0.4),
		],
		[
			"shortTermDebt",
			"Short-term debt",
			"usd",
			2,
			"us-gaap:DebtCurrent",
			part(currentAssets, 0.05),
		],
		[
			"longTermDebt",
			"Long-term debt",
			"usd",
			1,
			"us-gaap:LongTermDebtNoncurrent",
			part(totalAssets, 0.15),
		],
	];
}

/** Builds the six cash flow lines from the operating cash flow and one base amount. */
function cashFlowLines(
	operating: (number | null)[],
	base: (number | null)[],
): LineSpec[] {
	const part = (share: number) =>
		base.map((value) => (value === null ? null : Math.round(value * share)));
	return [
		[
			"operatingCashFlow",
			"Net cash from operating activities",
			"usd",
			0,
			"us-gaap:NetCashProvidedByUsedInOperatingActivities",
			operating,
		],
		[
			"capitalExpenditure",
			"Purchases of property and equipment",
			"usd",
			1,
			"us-gaap:PaymentsToAcquirePropertyPlantAndEquipment",
			part(0.4),
		],
		[
			"dividendsPaid",
			"Dividends paid",
			"usd",
			1,
			"us-gaap:PaymentsOfDividends",
			part(0.2),
		],
		[
			"shareRepurchases",
			"Repurchases of common stock",
			"usd",
			1,
			"us-gaap:PaymentsForRepurchaseOfCommonStock",
			part(0.3),
		],
		[
			"shareIssuanceProceeds",
			"Proceeds from stock plans",
			"usd",
			1,
			"us-gaap:ProceedsFromStockPlans",
			part(0.05),
		],
		[
			"shareBasedCompensation",
			"Share-based compensation",
			"usd",
			1,
			"us-gaap:ShareBasedCompensation",
			part(0.25),
		],
	];
}

export const fakeCompanyReport: {
	readonly masthead: MastheadSection;
	readonly overview: OverviewSection;
	readonly financials: FinancialsSection;
} = buildReport();
