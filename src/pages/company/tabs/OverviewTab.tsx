import { Text } from "@/components/ui/text";
import type { Ticker } from "../../../lib/domain/ticker";

/** The Overview tab of the company page. It stays empty until its tab ticket fills it. */
export function OverviewTab(_: { ticker: Ticker }) {
	return (
		<Text font="sans" size="lg" className="text-left">
			The Overview tab has no content yet.
		</Text>
	);
}
