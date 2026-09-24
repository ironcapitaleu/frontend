import { Ticker } from "../../../lib/domain/ticker";
import type {
	Claim,
	ClaimValue,
	Filing,
	FilingsSection,
	FinancialsSection,
	InsiderHolding,
	IsoDate,
	LineKey,
	ManagementSection,
	MarketDataset,
	MastheadSection,
	MetricKey,
	OverviewSection,
	OwnershipSummary,
	Period,
	RelationshipsSection,
	SectorBenchmark,
	Series,
	ShareholderReturnsSection,
	SourceDocument,
	Statement,
	StatementLine,
	StatementTable,
	Unit,
	ValuationSection,
} from "../../../lib/company/types";

// The SEC EDGAR folder of the made-up filer.
const EDGAR = "https://www.sec.gov/Archives/edgar/data/1999999";

/** The fiscal years of the annual tables, FY2016 to FY2025. */
const YEARS = Array.from({ length: 10 }, (_, position) => 2016 + position);

/** The fiscal years of the quarterly tables. */
const QUARTER_YEARS = [2024, 2025];

function buildReport() {
	return {
		masthead: fakeMasthead(Ticker.parse("QVAN")),
		overview: buildOverview(),
		financials: buildFinancials(),
		valuation: buildValuation(),
		shareholderReturns: buildShareholderReturns(),
		relationships: buildRelationships(),
		management: buildManagement(),
		filings: buildFilings(),
	};
}

function date(value: string): IsoDate {
	return value as IsoDate;
}

function quarterEnd(year: number, quarter: number): string {
	return `${year}-${["03-31", "06-30", "09-30", "12-31"][quarter - 1]}`;
}

function fiscalYear(year: number): Period {
	return {
		kind: "fiscalYear",
		fiscalYear: year,
		fiscalQuarter: null,
		endsOn: date(`${year}-12-31`),
	};
}

function fiscalQuarter(year: number, quarter: number): Period {
	return {
		kind: "fiscalQuarter",
		fiscalYear: year,
		fiscalQuarter: quarter,
		endsOn: date(quarterEnd(year, quarter)),
	};
}

function yearToDate(year: number, quarter: number): Period {
	return {
		kind: "yearToDate",
		fiscalYear: year,
		fiscalQuarter: quarter,
		endsOn: date(quarterEnd(year, quarter)),
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

function yearEnd(year: number): Period {
	return instant(year, null, `${year}-12-31`);
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

/** The 10-K for a fiscal year, filed in February of the next year. */
function tenK(year: number): Filing {
	const filedIn = year + 1;
	return filing(
		"10-K",
		`0001999999-${String(filedIn).slice(2)}-000003`,
		`${filedIn}-02-19`,
		`FY${year}`,
	);
}

/** The 10-Q for one of the first three quarters of a fiscal year. */
function tenQ(year: number, quarter: number): Filing {
	return filing(
		"10-Q",
		`0001999999-${String(year).slice(2)}-${String(3 + 8 * quarter).padStart(6, "0")}`,
		`${year}-${["05-01", "07-31", "10-30"][quarter - 1]}`,
		`Q${quarter} FY${year}`,
	);
}

const TEN_K_2025 = tenK(2025);
const TEN_Q3_2025 = tenQ(2025, 3);
const THIRTEEN_F = filing(
	"13F-HR",
	"0001888888-25-000031",
	"2025-11-14",
	"Q3 2025",
);

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

/** The closing price at each fiscal year end, FY2016 to FY2025. */
const PRICE_AT_YEAR_ENDS = [
	38.2, 41.5, 36.9, 45.3, 40.1, 52.6, 48.8, 57.4, 64.1, 82.75,
];

/**
 * The masthead of Quillvane Instruments, listed under `ticker`. The listing
 * and the link of the price dataset carry `ticker`. Every other field is the
 * same for each ticker.
 */
export function fakeMasthead(ticker: Ticker): MastheadSection {
	const prices: MarketDataset = {
		kind: "market",
		name: "End-of-day prices, NASDAQ",
		asOf: date("2026-03-20"),
		url: `https://prices.example/${ticker.value}`,
	};
	const price = (key: string, value: number, period: Period) =>
		reported(
			`masthead.${key}.${periodId(period)}`,
			"Price",
			value,
			"usdPerShare",
			period,
			prices,
			"Closing price, NASDAQ",
			null,
		);
	const on = (endsOn: string) =>
		instant(Number(endsOn.slice(0, 4)), null, endsOn);
	const yearEnds = YEARS.map(yearEnd);
	return {
		ticker,
		name: "Quillvane Instruments, Inc.",
		listings: [{ exchange: "NASDAQ", symbol: ticker.value }],
		sector: "Industrials",
		country: "United States",
		reportingCurrency: "USD",
		fiscalYearEnd: "31 December",
		price: price("price", 84.2, on("2026-03-20")),
		priceMonthEarlier: price("priceMonthEarlier", 79.5, on("2026-02-20")),
		low52Weeks: price("low52Weeks", 61.35, on("2025-04-08")),
		high52Weeks: price("high52Weeks", 88.9, on("2026-01-14")),
		priceAtFiscalYearEnds: {
			key: "priceAtFiscalYearEnds",
			label: "Price at fiscal year end",
			unit: "usdPerShare",
			periods: yearEnds,
			points: yearEnds.map((period, position) =>
				price("priceAtFiscalYearEnds", PRICE_AT_YEAR_ENDS[position], period),
			),
		},
	};
}

function tenKClaim(
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

/** The FY2025 10-K of a peer. Each filer has its own accession number. */
function peerTenK(filer: string, row: number): Filing {
	const cik = `177777${row}`;
	const accession = `000${cik}-26-000004`;
	return {
		...TEN_K_2025,
		filer,
		accessionNumber: accession,
		indexUrl: `https://www.sec.gov/Archives/edgar/data/${cik}/${accession.replaceAll("-", "")}/`,
	};
}

function benchmark(
	metric: MetricKey,
	quartiles: [number, number, number],
	section: "overview" | "valuation" = "overview",
	unit: Unit = "percent",
): SectorBenchmark {
	const names = ["lowerQuartile", "median", "upperQuartile"] as const;
	const peers = ["Alder Controls", "Brisk Metrology"];
	const [lowerQuartile, median, upperQuartile] = names.map((name, position) => {
		const inputs = peers.map((peer, row) =>
			reported(
				`${section}.sectorBenchmarks.${metric}.${name}.peer${row}`,
				peer,
				quartiles[position],
				unit,
				fiscalYear(2025),
				peerTenK(peer, row),
				`Peer figure › ${metric}`,
				null,
			),
		);
		return {
			id: `${section}.sectorBenchmarks.${metric}.${name}`,
			label: `Sector ${name}`,
			value: quartiles[position],
			unit,
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

/**
 * The share counts behind the ownership bar, under the ids of `section`. The
 * Overview and Relationships copies hold the same figures.
 */
function ownershipSummary(
	section: "overview" | "relationships",
): OwnershipSummary {
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
			`${section}.ownership.${id}`,
			label,
			value,
			"shares",
			quarterEnd,
			document,
			line,
			xbrlTag,
		);
	return {
		asOf: quarterEnd.endsOn,
		sharesOutstanding: ownershipClaim(
			"sharesOutstanding",
			"Shares outstanding",
			150_000_000,
			TEN_Q3_2025,
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
			TEN_Q3_2025,
			"Security ownership › Directors and officers",
			null,
		),
	};
}

function buildOverview(): OverviewSection {
	const revenuePart = (list: string, name: string, value: number) => ({
		name,
		revenue: tenKClaim(
			`${list}.${name}.revenue`,
			`${name} revenue`,
			value,
			"usd",
			`Note 15 › Segment information › ${name}`,
			"us-gaap:Revenues",
		),
	});
	return {
		business: tenKClaim(
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
		ownership: ownershipSummary("overview"),
		profile: {
			founded: tenKClaim(
				"profile.founded",
				"Founded",
				1987,
				"year",
				"Item 1 › History",
				null,
			),
			headquarters: tenKClaim(
				"profile.headquarters",
				"Headquarters",
				"Portland, Oregon",
				"text",
				"Cover page › Address",
				"dei:EntityAddressCityOrTown",
			),
			employees: tenKClaim(
				"profile.employees",
				"Employees",
				9_400,
				"count",
				"Item 1 › Human capital",
				"dei:EntityNumberOfEmployees",
			),
			chiefExecutive: tenKClaim(
				"profile.chiefExecutive",
				"Chief executive",
				"Dana Whitcombe",
				"text",
				"Item 10 › Executive officers",
				null,
			),
			chiefExecutiveSince: tenKClaim(
				"profile.chiefExecutiveSince",
				"Chief executive since",
				date("2019-04-01"),
				"date",
				"Item 10 › Executive officers",
				null,
			),
			auditor: tenKClaim(
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

/** The label, unit, indent level and XBRL tag of each statement line. */
const LINES: Record<LineKey, [string, Unit, number, string]> = {
	revenue: ["Revenue", "usd", 0, "us-gaap:Revenues"],
	operatingIncome: [
		"Operating income",
		"usd",
		1,
		"us-gaap:OperatingIncomeLoss",
	],
	netIncome: ["Net income", "usd", 1, "us-gaap:NetIncomeLoss"],
	dilutedEps: [
		"Diluted EPS",
		"usdPerShare",
		2,
		"us-gaap:EarningsPerShareDiluted",
	],
	dilutedShares: [
		"Diluted shares",
		"shares",
		2,
		"us-gaap:WeightedAverageNumberOfDilutedSharesOutstanding",
	],
	totalCurrentAssets: [
		"Total current assets",
		"usd",
		1,
		"us-gaap:AssetsCurrent",
	],
	totalAssets: ["Total assets", "usd", 0, "us-gaap:Assets"],
	totalCurrentLiabilities: [
		"Total current liabilities",
		"usd",
		1,
		"us-gaap:LiabilitiesCurrent",
	],
	totalLiabilities: ["Total liabilities", "usd", 0, "us-gaap:Liabilities"],
	shareholdersEquity: [
		"Total shareholders' equity",
		"usd",
		0,
		"us-gaap:StockholdersEquity",
	],
	cashAndShortTermInvestments: [
		"Cash and short-term investments",
		"usd",
		2,
		"us-gaap:CashCashEquivalentsAndShortTermInvestments",
	],
	shortTermDebt: ["Short-term debt", "usd", 2, "us-gaap:DebtCurrent"],
	longTermDebt: ["Long-term debt", "usd", 1, "us-gaap:LongTermDebtNoncurrent"],
	operatingCashFlow: [
		"Net cash from operating activities",
		"usd",
		0,
		"us-gaap:NetCashProvidedByUsedInOperatingActivities",
	],
	capitalExpenditure: [
		"Purchases of property and equipment",
		"usd",
		1,
		"us-gaap:PaymentsToAcquirePropertyPlantAndEquipment",
	],
	dividendsPaid: ["Dividends paid", "usd", 1, "us-gaap:PaymentsOfDividends"],
	shareRepurchases: [
		"Repurchases of common stock",
		"usd",
		1,
		"us-gaap:PaymentsForRepurchaseOfCommonStock",
	],
	shareIssuanceProceeds: [
		"Proceeds from stock plans",
		"usd",
		1,
		"us-gaap:ProceedsFromStockPlans",
	],
	shareBasedCompensation: [
		"Share-based compensation",
		"usd",
		1,
		"us-gaap:ShareBasedCompensation",
	],
};

type Values = (number | null)[];

/** One statement line: its key and one value for each period of the table. */
type Row = [key: LineKey, values: Values];

/** A table of the ten fiscal years, with one 10-K for each year. */
const ANNUAL = { periods: YEARS.map(fiscalYear), documents: YEARS.map(tenK) };

/**
 * A table of the eight quarters, with one filing for each quarter: three 10-Qs
 * and the 10-K for each fiscal year.
 */
const QUARTERLY = {
	periods: QUARTER_YEARS.flatMap((year) =>
		[1, 2, 3, 4].map((quarter) => fiscalQuarter(year, quarter)),
	),
	documents: QUARTER_YEARS.flatMap((year) => [
		tenQ(year, 1),
		tenQ(year, 2),
		tenQ(year, 3),
		tenK(year),
	]),
};

/** The six-month and nine-month table of the income and cash flow statements, with the 10-Q of each period. */
const YEAR_TO_DATE = {
	periods: QUARTER_YEARS.flatMap((year) => [
		yearToDate(year, 2),
		yearToDate(year, 3),
	]),
	documents: QUARTER_YEARS.flatMap((year) => [tenQ(year, 2), tenQ(year, 3)]),
};

/** Turns amounts in millions into whole units. */
function millions(...values: Values): Values {
	return values.map((value) =>
		value === null ? null : Math.round(value * 1_000_000),
	);
}

/** Adds the `null` fourth quarter after the three reported quarters of each fiscal year. */
function withoutFourthQuarters(...years: number[][]): Values {
	return millions(...years.flatMap((quarters) => [...quarters, null]));
}

/** Adds the `null` second to fourth quarters after the first quarter of each fiscal year. */
function withFirstQuartersOnly(...firstQuarters: number[]): Values {
	return millions(
		...firstQuarters.flatMap((value) => [value, null, null, null]),
	);
}

function table(
	title: string,
	{ periods, documents }: { periods: Period[]; documents: Filing[] },
	rows: Row[],
): StatementTable {
	const lines: StatementLine[] = rows.map(([key, values]) => {
		const [label, unit, level, xbrlTag] = LINES[key];
		return {
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
		};
	});
	return { periods, lines };
}

/** Builds the five income lines. Diluted EPS is net income over diluted shares. */
function incomeRows(
	revenue: Values,
	operatingIncome: Values,
	netIncome: Values,
	dilutedShares: Values,
): Row[] {
	const eps = netIncome.map((value, position) => {
		const shares = dilutedShares[position];
		return value === null || shares === null
			? null
			: Math.round((value / shares) * 100) / 100;
	});
	return [
		["revenue", revenue],
		["operatingIncome", operatingIncome],
		["netIncome", netIncome],
		["dilutedEps", eps],
		["dilutedShares", dilutedShares],
	];
}

/** Scales the current assets and the total assets into the eight balance sheet lines. */
function balanceRows(currentAssets: Values, totalAssets: Values): Row[] {
	const part = (values: Values, share: number) =>
		values.map((value) => (value === null ? null : Math.round(value * share)));
	return [
		["totalCurrentAssets", currentAssets],
		["totalAssets", totalAssets],
		["totalCurrentLiabilities", part(currentAssets, 0.5)],
		["totalLiabilities", part(totalAssets, 0.45)],
		["shareholdersEquity", part(totalAssets, 0.55)],
		["cashAndShortTermInvestments", part(currentAssets, 0.4)],
		["shortTermDebt", part(currentAssets, 0.05)],
		["longTermDebt", part(totalAssets, 0.15)],
	];
}

/** Builds the six cash flow lines from the operating cash flow and one base amount. */
function cashFlowRows(operating: Values, base: Values): Row[] {
	const part = (share: number) =>
		base.map((value) => (value === null ? null : Math.round(value * share)));
	return [
		["operatingCashFlow", operating],
		["capitalExpenditure", part(0.4)],
		["dividendsPaid", part(0.2)],
		["shareRepurchases", part(0.3)],
		["shareIssuanceProceeds", part(0.05)],
		["shareBasedCompensation", part(0.25)],
	];
}

function buildFinancials(): FinancialsSection {
	const income = "Consolidated statements of income";
	const balance = "Consolidated balance sheets";
	const cashFlow = "Consolidated statements of cash flows";
	const incomeStatement: Statement = {
		annual: table(
			income,
			ANNUAL,
			incomeRows(
				millions(1800, 1880, 1960, 2050, 1900, 2150, 2450, 2700, 2900, 3200),
				millions(220, 232, 245, 260, 190, 270, 320, 350, 380, 450),
				millions(165, 175, 185, 196, 140, 205, 245, 268, 290, 340),
				millions(
					162,
					161.2,
					160.1,
					159,
					158.4,
					157.3,
					156,
					154.2,
					152.6,
					151.1,
				),
			),
		),
		quarterly: table(
			income,
			QUARTERLY,
			incomeRows(
				withoutFourthQuarters([690, 710, 730], [760, 790, 810]),
				withoutFourthQuarters([88, 92, 96], [104, 110, 115]),
				withoutFourthQuarters([67, 70, 73], [79, 83, 87]),
				withoutFourthQuarters([153.2, 152.9, 152.6], [151.6, 151.2, 150.8]),
			),
		),
		yearToDate: table(
			income,
			YEAR_TO_DATE,
			incomeRows(
				millions(1400, 2130, 1550, 2360),
				millions(180, 276, 214, 329),
				millions(137, 210, 162, 249),
				millions(153.05, 152.9, 151.4, 151.2),
			),
		),
	};
	const balanceSheet: Statement = {
		annual: table(
			balance,
			{ periods: YEARS.map(yearEnd), documents: ANNUAL.documents },
			balanceRows(
				millions(800, 830, 870, 910, 950, 980, 1040, 1110, 1200, 1350),
				millions(2400, 2500, 2620, 2750, 2850, 2950, 3150, 3350, 3600, 3900),
			),
		),
		quarterly: table(
			balance,
			{
				periods: QUARTERLY.periods.map((period) =>
					instant(period.fiscalYear, period.fiscalQuarter, period.endsOn),
				),
				documents: QUARTERLY.documents,
			},
			balanceRows(
				millions(1120, 1150, 1180, 1200, 1250, 1280, 1310, 1350),
				millions(3400, 3460, 3530, 3600, 3700, 3750, 3820, 3900),
			),
		),
		yearToDate: null,
	};
	const cashFlowStatement: Statement = {
		annual: table(
			cashFlow,
			ANNUAL,
			cashFlowRows(
				millions(250, 262, 275, 290, 240, 305, 350, 390, 420, 480),
				millions(180, 188, 195, 205, 170, 215, 245, 275, 300, 330),
			),
		),
		quarterly: table(
			cashFlow,
			QUARTERLY,
			cashFlowRows(
				withFirstQuartersOnly(95, 110),
				withFirstQuartersOnly(68, 75),
			),
		),
		yearToDate: table(
			cashFlow,
			YEAR_TO_DATE,
			cashFlowRows(millions(195, 300, 225, 350), millions(140, 215, 155, 240)),
		),
	};
	return {
		income: incomeStatement,
		balance: balanceSheet,
		cashFlow: cashFlowStatement,
	};
}

/** The proxy statement filed in April of `year`, which reports the pay of the fiscal year before. */
function proxy(year: number): Filing {
	return filing(
		"DEF 14A",
		`0001999999-${String(year).slice(2)}-000014`,
		`${year}-04-10`,
		`${year} annual meeting`,
	);
}

const PROXY_2025 = proxy(2025);
const DIVIDEND_8K = filing(
	"8-K",
	"0001999999-26-000002",
	"2026-02-12",
	"12 Feb 2026",
);

/** A series of one figure for each fiscal year in `years`, each point from the 10-K of its year. */
function annualSeries(
	id: string,
	label: string,
	unit: Unit,
	values: readonly number[],
	line: string,
	xbrlTag: string,
	years: readonly number[] = YEARS,
): Series {
	const periods = years.map(fiscalYear);
	return {
		key: id.split(".")[1],
		label,
		unit,
		periods,
		points: periods.map((period, position) =>
			reported(
				`${id}.${periodId(period)}`,
				label,
				values[position],
				unit,
				period,
				tenK(period.fiscalYear),
				line,
				xbrlTag,
			),
		),
	};
}

/** The 10-year Treasury yield at each fiscal year end, FY2016 to FY2025. */
const TREASURY_AT_YEAR_ENDS = [
	0.0245, 0.024, 0.0269, 0.0192, 0.0093, 0.0152, 0.0388, 0.0388, 0.0458, 0.0457,
];

function buildValuation(): ValuationSection {
	const rates: MarketDataset = {
		kind: "market",
		name: "10-year Treasury yield, daily",
		asOf: date("2026-03-20"),
		url: "https://rates.example/DGS10",
	};
	const treasury = (key: string, value: number, period: Period) =>
		reported(
			`valuation.${key}.${periodId(period)}`,
			"10-year Treasury yield",
			value,
			"percent",
			period,
			rates,
			"Market yield, 10-year constant maturity",
			null,
		);
	const yearEnds = YEARS.map(yearEnd);
	return {
		treasuryYieldAtFiscalYearEnds: {
			key: "treasuryYieldAtFiscalYearEnds",
			label: "10-year Treasury yield at fiscal year end",
			unit: "percent",
			periods: yearEnds,
			points: yearEnds.map((period, position) =>
				treasury(
					"treasuryYieldAtFiscalYearEnds",
					TREASURY_AT_YEAR_ENDS[position],
					period,
				),
			),
		},
		treasuryYieldNow: treasury(
			"treasuryYieldNow",
			0.0425,
			instant(2026, null, "2026-03-20"),
		),
		sectorBenchmarks: [
			benchmark("priceToEarnings", [24, 31, 40], "valuation", "ratio"),
			benchmark("priceToFreeCashFlow", [22, 30, 41], "valuation", "ratio"),
			benchmark("priceToBook", [3.1, 4.6, 7.2], "valuation", "ratio"),
			benchmark("enterpriseValueToEbit", [18, 25, 33], "valuation", "ratio"),
		],
	};
}

/**
 * The dividend per share and the shares bought back and issued to staff,
 * FY2016 to FY2025. Each follows the cash flow lines of its year: dividends
 * paid over diluted shares, repurchases over the year-end price, and stock
 * plan proceeds over 60% of the year-end price.
 */
function buildShareholderReturns(): ShareholderReturnsSection {
	const base = [180, 188, 195, 205, 170, 215, 245, 275, 300, 330];
	const shares = [
		162, 161.2, 160.1, 159, 158.4, 157.3, 156, 154.2, 152.6, 151.1,
	];
	const equity = "Consolidated statements of shareholders' equity";
	const perYear = (share: number, divisor: (position: number) => number) =>
		base.map(
			(value, position) =>
				Math.round((value * share * 1_000) / divisor(position)) * 1_000,
		);
	return {
		dividendPerShare: annualSeries(
			"shareholderReturns.dividendPerShare",
			"Dividend per share declared",
			"usdPerShare",
			base.map(
				(value, position) =>
					Math.round(((value * 0.2) / shares[position]) * 100) / 100,
			),
			`${equity} › Dividends declared per share`,
			"us-gaap:CommonStockDividendsPerShareDeclared",
		),
		latestDividendDeclared: reported(
			"shareholderReturns.latestDividendDeclared.2026-02-12",
			"Latest dividend declared",
			0.12,
			"usdPerShare",
			instant(2026, null, "2026-02-12"),
			DIVIDEND_8K,
			"Item 8.01 › Quarterly dividend per share",
			null,
		),
		sharesRepurchased: annualSeries(
			"shareholderReturns.sharesRepurchased",
			"Shares bought back",
			"shares",
			perYear(0.3, (position) => PRICE_AT_YEAR_ENDS[position]),
			`${equity} › Repurchases of common stock, shares`,
			"us-gaap:StockRepurchasedDuringPeriodShares",
		),
		sharesIssuedToStaff: annualSeries(
			"shareholderReturns.sharesIssuedToStaff",
			"Shares issued to staff",
			"shares",
			perYear(0.05, (position) => PRICE_AT_YEAR_ENDS[position] * 0.6),
			`${equity} › Shares issued under stock plans`,
			"us-gaap:StockIssuedDuringPeriodSharesShareBasedCompensation",
		),
	};
}

/** The officers and directors with their shares and the date of their latest Form 4. They hold the 4.5M insider shares. */
const INSIDERS: [string, string, number, string][] = [
	["Dana Whitcombe", "Chief executive", 3_100_000, "2025-11-03"],
	["Ellis Marrow", "Chief financial officer", 900_000, "2025-08-15"],
	["Ruth Okafor", "Director", 500_000, "2025-05-20"],
];

function form4(filer: string, row: number, filedOn: string): Filing {
	const [, year, month, day] = filedOn.split("-").map((part) => part.slice(-2));
	return {
		...filing(
			"Form 4",
			`000666666${row}-${year}-00${month}${day}`,
			filedOn,
			filedOn,
		),
		filer,
	};
}

/** The insider holdings under the ids of `section`. The Relationships and Management copies hold the same rows. */
function insiderHoldings(
	section: "relationships" | "management",
): InsiderHolding[] {
	return INSIDERS.map(([name, role, shares, filedOn], row) => ({
		name,
		role,
		shares: reported(
			`${section}.insiders.${row}.shares`,
			`Shares held by ${name}`,
			shares,
			"shares",
			instant(2025, null, filedOn),
			form4(name, row, filedOn),
			"Table I › Amount beneficially owned following reported transactions",
			null,
		),
	}));
}

function buildRelationships(): RelationshipsSection {
	const fund = (name: string, row: number, now: number, before: number) => {
		const claim = (field: string, value: number, filed: Filing, at: Period) =>
			reported(
				`relationships.funds.${row}.${field}`,
				`Shares held by ${name}`,
				value,
				"shares",
				at,
				{ ...filed, filer: name },
				"Information table › Shares (sshPrnamt)",
				null,
			);
		return {
			fund: name,
			shares: claim(
				"shares",
				now,
				filing("13F-HR", `000555555${row}-25-000031`, "2025-11-14", "Q3 2025"),
				instant(2025, 3, "2025-09-30"),
			),
			sharesQuarterEarlier: claim(
				"sharesQuarterEarlier",
				before,
				filing("13F-HR", `000555555${row}-25-000021`, "2025-08-14", "Q2 2025"),
				instant(2025, 2, "2025-06-30"),
			),
		};
	};
	const subsidiary = (name: string, row: number, jurisdiction: string) => ({
		name,
		jurisdiction: reported(
			`relationships.subsidiaries.${row}.jurisdiction`,
			`Jurisdiction of ${name}`,
			jurisdiction,
			"text",
			null,
			TEN_K_2025,
			`Exhibit 21 › ${name} › Jurisdiction`,
			null,
		),
	});
	const stake = (
		company: string,
		ticker: Ticker | null,
		row: number,
		held: number,
		outstanding: number,
	) => ({
		company,
		ticker,
		sharesHeld: reported(
			`relationships.stakes.${row}.sharesHeld`,
			`Shares of ${company} held`,
			held,
			"shares",
			instant(2025, 3, "2025-09-30"),
			THIRTEEN_F,
			"Information table › Shares (sshPrnamt)",
			null,
		),
		sharesOutstanding: reported(
			`relationships.stakes.${row}.sharesOutstanding`,
			`Shares outstanding of ${company}`,
			outstanding,
			"shares",
			instant(2026, null, "2026-02-13"),
			peerTenK(company, row),
			"Cover page › Shares outstanding",
			"dei:EntityCommonStockSharesOutstanding",
		),
	});
	return {
		ownership: ownershipSummary("relationships"),
		funds: [
			fund("Harlow Index Trust", 0, 14_200_000, 13_900_000),
			fund("Pinecrest Advisors", 1, 9_800_000, 10_400_000),
		],
		insiders: insiderHoldings("relationships"),
		subsidiaries: [
			subsidiary("Quillvane Instruments GmbH", 0, "Germany"),
			subsidiary("Quillvane Sensors Ltd.", 1, "United Kingdom"),
		],
		stakes: [
			stake("Alder Controls", Ticker.parse("ALDR"), 0, 2_400_000, 48_000_000),
			stake("Brisk Metrology", null, 1, 1_100_000, 30_000_000),
		],
	};
}

function buildManagement(): ManagementSection {
	const person = (
		name: string,
		role: string,
		row: number,
		isDirector: boolean,
		since: string,
		independence: string,
	) => ({
		name,
		role,
		isDirector,
		since: reported(
			`management.people.${row}.since`,
			`${name}, in the role since`,
			date(since),
			"date",
			null,
			PROXY_2025,
			`Directors and executive officers › ${name}`,
			null,
		),
		independence: reported(
			`management.people.${row}.independence`,
			`Independence of ${name}`,
			independence,
			"text",
			null,
			PROXY_2025,
			"Corporate governance › Director independence",
			null,
		),
	});
	const pay = (year: number, amounts: [number, number, number, number]) => {
		const fields = ["salary", "bonus", "stockAwards", "other"] as const;
		const [salary, bonus, stockAwards, other] = fields.map((field, position) =>
			reported(
				`management.ceoPay.${field}.FY${year}`,
				`Chief executive pay, ${field}`,
				amounts[position],
				"usd",
				fiscalYear(year),
				proxy(year + 1),
				`Summary compensation table › ${field}`,
				null,
			),
		);
		return { fiscalYear: year, salary, bonus, stockAwards, other };
	};
	// The shares that insiders bought or sold in each year, each the sum of one Form 4.
	const trades = (key: string, label: string, values: [number, number]) => {
		const periods = [fiscalYear(2024), fiscalYear(2025)];
		return {
			key,
			label,
			unit: "shares" as const,
			periods,
			points: periods.map((period, position) => {
				const input = reported(
					`management.${key}.${periodId(period)}.forms.0`,
					label,
					values[position],
					"shares",
					period,
					form4(INSIDERS[position][0], position, `${period.fiscalYear}-06-02`),
					"Table I › Amount of securities acquired or disposed of",
					null,
				);
				return {
					...input,
					id: `management.${key}.${periodId(period)}`,
					source: {
						kind: "derived" as const,
						formula: `Sum of the shares in the Form 4 filings of FY${period.fiscalYear}`,
						inputs: [input] as [Claim],
					},
				};
			}),
		};
	};
	return {
		people: [
			person(
				"Dana Whitcombe",
				"Chief executive",
				0,
				true,
				"2019-04-01",
				"Not independent",
			),
			person("Ruth Okafor", "Director", 1, true, "2016-05-12", "Independent"),
		],
		ceoPay: [
			pay(2024, [950_000, 1_200_000, 6_500_000, 200_000]),
			pay(2025, [1_000_000, 1_400_000, 7_200_000, 250_000]),
		],
		insiders: insiderHoldings("management"),
		insiderSharesBought: trades(
			"insiderSharesBought",
			"Shares bought by insiders",
			[120_000, 60_000],
		),
		insiderSharesSold: trades(
			"insiderSharesSold",
			"Shares sold by insiders",
			[400_000, 250_000],
		),
	};
}

/** The filings of Quillvane, oldest first: the 10-Ks, the 10-Qs, the proxy statements, one 8-K and its own 13F. */
function buildFilings(): FilingsSection {
	const filings = [
		...ANNUAL.documents,
		...QUARTERLY.documents.filter((document) => document.form === "10-Q"),
		proxy(2025),
		proxy(2026),
		DIVIDEND_8K,
		THIRTEEN_F,
	];
	return {
		filings: filings.sort((first, second) =>
			first.filedOn.localeCompare(second.filedOn),
		),
	};
}

/**
 * The sections of Quillvane Instruments (QVAN), a made-up company for tests.
 * Its fiscal year ends on 31 December. The window matches the port contract:
 *
 * - the annual tables hold ten fiscal years, FY2016 to FY2025;
 * - the quarterly tables hold the eight quarters of FY2024 and FY2025;
 * - each point comes from one filing: a 10-K for each fiscal year and each
 *   fourth quarter, and a 10-Q for each other quarter.
 *
 * The data follows the rules of the company data model, so a test can read
 * each kind of figure:
 *
 * - the income statement has a `null` point at each fourth quarter, because no 10-Q reports it;
 * - the cash flow statement has `null` points at each second to fourth quarter;
 * - the income statement and the cash flow statement have a year-to-date
 *   table with the six-month and nine-month figures;
 * - the balance sheet has no `null` point, and holds each fiscal year end of
 *   FY2024 and FY2025 in both tables, with two encodings;
 * - for each flow line, the first three quarters and the derived fourth
 *   quarter add up to the fiscal year, in both fiscal years;
 * - each sector quartile is a derived claim over two peer claims;
 * - `profile.website` has no period;
 * - the Overview and Relationships ownership copies, and the Relationships
 *   and Management insider copies, hold the same figures under their own ids;
 * - the Valuation section holds a Treasury yield at each fiscal year end and
 *   one at the price date, 20 Mar 2026;
 * - one stake has no ticker, and its shares outstanding come from a filing of
 *   the target company.
 *
 * It uses its own company instead of MRDN, so a change to the sample data of
 * the app breaks no test that uses it.
 */
export const fakeCompanyReport: {
	readonly masthead: MastheadSection;
	readonly overview: OverviewSection;
	readonly financials: FinancialsSection;
	readonly valuation: ValuationSection;
	readonly shareholderReturns: ShareholderReturnsSection;
	readonly relationships: RelationshipsSection;
	readonly management: ManagementSection;
	readonly filings: FilingsSection;
} = buildReport();
