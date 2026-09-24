import { Text } from "@/components/ui/text";
import { COMPANY_TABS } from "../../../lib/company/tabs";
import type { TabKey } from "../../../lib/company/types";

/**
 * The empty state of a tab whose ticket has not filled it yet. It reads the
 * label from `COMPANY_TABS`, so a renamed tab needs no edit here.
 */
export function EmptyPanel({ tab }: { tab: TabKey }) {
	const label = COMPANY_TABS.find(({ key }) => key === tab)?.label;
	return (
		<Text font="sans" size="lg" className="text-left">
			The {label} tab has no content yet.
		</Text>
	);
}
