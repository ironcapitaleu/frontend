import { Ticker } from "../domain/ticker";
import { MERIDIAN_TICKER } from "./sample/masthead";

/**
 * Tells whether the sample adapter serves `ticker`. `sampleCompanyGateway`
 * asks it before it serves a section, so this is the one list of the
 * companies that have a page.
 */
export function servesTicker(ticker: Ticker): boolean {
	return ticker.equals(MERIDIAN_TICKER);
}

/**
 * Tells whether `/companies/:symbol` shows a company for `symbol`. The
 * screener asks it without reaching into the gateway. A symbol that
 * `Ticker.parse` rejects has no page.
 */
export function hasCompanyPage(symbol: string): boolean {
	return Ticker.isValid(symbol) && servesTicker(Ticker.parse(symbol));
}
