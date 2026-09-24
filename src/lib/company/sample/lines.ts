import type { FinancialsSection, LineKey, Unit } from "../types";
import type { LineRecord } from "./sources";

/** One of the three statements of the Financials section. */
export type StatementKey = keyof FinancialsSection;

/** A line record of a statement line, with the label, unit and indent the table shows. */
export interface StatementLineRecord extends LineRecord {
	readonly statement: StatementKey;
	readonly label: string;
	readonly unit: Unit;
	readonly level: number;
}

const TITLES: Record<StatementKey, string> = {
	income: "Consolidated statements of income",
	balance: "Consolidated balance sheets",
	cashFlow: "Consolidated statements of cash flows",
};

function line(
	statement: StatementKey,
	label: string,
	printed: string,
	xbrlTag: string,
	level: number,
	unit: Unit = "usd",
): StatementLineRecord {
	const path = `${TITLES[statement]} › ${printed}`;
	return { statement, label, unit, level, path, xbrlTag };
}

/** The line record of each statement line: its statement, label and XBRL tag. */
export const statementLines: Record<LineKey, StatementLineRecord> = {
	revenue: line("income", "Revenue", "Revenue", "us-gaap:Revenues", 0),
	operatingIncome: line(
		"income",
		"Operating income",
		"Operating income",
		"us-gaap:OperatingIncomeLoss",
		1,
	),
	netIncome: line(
		"income",
		"Net income",
		"Net income",
		"us-gaap:NetIncomeLoss",
		1,
	),
	dilutedEps: line(
		"income",
		"Diluted EPS",
		"Net income per share, diluted",
		"us-gaap:EarningsPerShareDiluted",
		2,
		"usdPerShare",
	),
	dilutedShares: line(
		"income",
		"Diluted shares",
		"Weighted average shares, diluted",
		"us-gaap:WeightedAverageNumberOfDilutedSharesOutstanding",
		2,
		"shares",
	),
	totalCurrentAssets: line(
		"balance",
		"Total current assets",
		"Total current assets",
		"us-gaap:AssetsCurrent",
		1,
	),
	totalAssets: line(
		"balance",
		"Total assets",
		"Total assets",
		"us-gaap:Assets",
		0,
	),
	totalCurrentLiabilities: line(
		"balance",
		"Total current liabilities",
		"Total current liabilities",
		"us-gaap:LiabilitiesCurrent",
		1,
	),
	totalLiabilities: line(
		"balance",
		"Total liabilities",
		"Total liabilities",
		"us-gaap:Liabilities",
		0,
	),
	shareholdersEquity: line(
		"balance",
		"Shareholders' equity",
		"Total shareholders' equity",
		"us-gaap:StockholdersEquity",
		0,
	),
	cashAndShortTermInvestments: line(
		"balance",
		"Cash and short-term investments",
		"Cash, cash equivalents and marketable securities",
		"us-gaap:CashCashEquivalentsAndShortTermInvestments",
		2,
	),
	shortTermDebt: line(
		"balance",
		"Short-term debt",
		"Short-term debt",
		"us-gaap:DebtCurrent",
		2,
	),
	longTermDebt: line(
		"balance",
		"Long-term debt",
		"Long-term debt",
		"us-gaap:LongTermDebtNoncurrent",
		1,
	),
	operatingCashFlow: line(
		"cashFlow",
		"Operating cash flow",
		"Net cash provided by operating activities",
		"us-gaap:NetCashProvidedByUsedInOperatingActivities",
		0,
	),
	capitalExpenditure: line(
		"cashFlow",
		"Capital expenditure",
		"Purchases of property and equipment",
		"us-gaap:PaymentsToAcquirePropertyPlantAndEquipment",
		1,
	),
	dividendsPaid: line(
		"cashFlow",
		"Dividends paid",
		"Dividends paid",
		"us-gaap:PaymentsOfDividends",
		1,
	),
	shareRepurchases: line(
		"cashFlow",
		"Share repurchases",
		"Repurchases of common stock",
		"us-gaap:PaymentsForRepurchaseOfCommonStock",
		1,
	),
	shareIssuanceProceeds: line(
		"cashFlow",
		"Proceeds from stock plans",
		"Proceeds related to employee stock plans",
		"us-gaap:ProceedsFromStockPlans",
		1,
	),
	shareBasedCompensation: line(
		"cashFlow",
		"Stock-based pay",
		"Stock-based compensation expense",
		"us-gaap:ShareBasedCompensation",
		1,
	),
};
