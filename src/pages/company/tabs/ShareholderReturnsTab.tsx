import { Text } from "@/components/ui/text";
import type { Ticker } from "../../../lib/domain/ticker";

/** The Shareholder returns tab of the company page. It stays empty until its tab ticket fills it. */
export function ShareholderReturnsTab(_: { ticker: Ticker }) {
	return (
		<Text font="sans" size="lg" className="text-left">
			The Shareholder returns tab has no content yet.
		</Text>
	);
}
