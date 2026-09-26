import { createContext, useContext, type ReactNode } from "react";

/** Opens the browser's print dialog. The module creates it once, so its identity stays the same. */
const browserPrint = () => window.print();

const PrintContext = createContext<() => void>(browserPrint);

/**
 * Gives its subtree the function that opens the print dialog. The Export
 * button of the company page calls it.
 *
 * Why a provider? Without one, the page calls `window.print()`. A test
 * passes its own `print` and sees the page call it, so no test opens a
 * dialog or needs `vi.mock`.
 */
export function PrintProvider({
	children,
	print,
}: {
	children: ReactNode;
	print: () => void;
}) {
	return (
		<PrintContext.Provider value={print}>{children}</PrintContext.Provider>
	);
}

/** Returns the print function of the nearest {@link PrintProvider}, or `window.print()`. */
export function usePrint(): () => void {
	return useContext(PrintContext);
}
