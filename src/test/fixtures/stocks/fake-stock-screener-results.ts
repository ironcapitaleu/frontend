import type { Stock } from "../../../pages/StockScreener.logic";

/**
 * A fixed, deliberately-shaped universe of securities for screener tests. Its
 * properties are chosen so behaviour can be asserted against known rows rather
 * than against whatever data the page happens to ship:
 *
 * - symbols are alphabetical (ALFA … OMEGA), so a descending sort is easy to predict;
 * - Alfa, Gamma and Omega trade within 20% of their 52-week low; Beta and Delta do not;
 * - Gamma leaves several metrics unavailable (`null`), exercising the "—" cells;
 * - market caps span the trillions, billions, millions and plain-number formats.
 *
 * Inject it with `<StockScreener stocks={fakeStockScreenerResults} />` so a test
 * owns its data and stays green when the shipped placeholder list changes.
 */
export const fakeStockScreenerResults: readonly Stock[] = [
	{
		symbol: "ALFA",
		name: "Alfa Corp.",
		sector: "Technology",
		country: "US",
		price: 100,
		marketCap: 2_000_000_000_000,
		changePercent1M: -5.0,
		peRatio: 20,
		priceToCash: 10,
		priceToFcf: 15,
		quickRatio: 1.2,
		currentRatio: 1.5,
		buybackYield: 2.0,
		dividendYield: 1.0,
		weekLow52: 90,
		weekHigh52: 160,
	},
	{
		symbol: "BETA",
		name: "Beta Industries",
		sector: "Energy",
		country: "DE",
		price: 200,
		marketCap: 500_000_000_000,
		changePercent1M: 3.5,
		peRatio: 12,
		priceToCash: 8,
		priceToFcf: 11,
		quickRatio: 0.9,
		currentRatio: 1.1,
		buybackYield: 4.0,
		dividendYield: 3.0,
		weekLow52: 100,
		weekHigh52: 260,
	},
	{
		symbol: "GAMMA",
		name: "Gamma Holdings",
		sector: "Finance",
		country: "US",
		price: 50,
		marketCap: 9_000_000_000,
		changePercent1M: -1.0,
		peRatio: null,
		priceToCash: null,
		priceToFcf: null,
		quickRatio: null,
		currentRatio: null,
		buybackYield: null,
		dividendYield: null,
		weekLow52: 45,
		weekHigh52: 80,
	},
	{
		symbol: "DELTA",
		name: "Delta Motors",
		sector: "Technology",
		country: "DE",
		price: 300,
		marketCap: 750_000_000,
		changePercent1M: 0.0,
		peRatio: 40,
		priceToCash: 30,
		priceToFcf: 45,
		quickRatio: 2.0,
		currentRatio: 2.5,
		buybackYield: 0.5,
		dividendYield: 0.2,
		weekLow52: 100,
		weekHigh52: 360,
	},
	{
		symbol: "OMEGA",
		name: "Omega Energy",
		sector: "Energy",
		country: "US",
		price: 12,
		marketCap: 800_000,
		changePercent1M: -8.0,
		peRatio: 6,
		priceToCash: 4,
		priceToFcf: 7,
		quickRatio: 0.7,
		currentRatio: 1.0,
		buybackYield: 5.0,
		dividendYield: 6.0,
		weekLow52: 11,
		weekHigh52: 20,
	},
];
