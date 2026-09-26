import { describe, expect, it } from "vitest";

import { renderHook } from "../test/render";
import { PrintProvider, usePrint } from "./PrintContext";

describe("usePrint", () => {
	it("should open the browser's print dialog when used outside a PrintProvider", () => {
		const opened: string[] = [];
		const browserPrint = window.print;
		window.print = () => opened.push("dialog");
		const { result: hook } = renderHook(() => usePrint());

		const expectedResult = ["dialog"];

		hook.current();
		window.print = browserPrint;
		const result = opened;

		expect(result).toEqual(expectedResult);
	});

	it("should return the provider's print function when used under a PrintProvider", () => {
		const print = () => {};

		const expectedResult = print;

		const { result: hook } = renderHook(() => usePrint(), {
			wrapper: ({ children }) => (
				<PrintProvider print={print}>{children}</PrintProvider>
			),
		});
		const result = hook.current;

		expect(result).toBe(expectedResult);
	});
});
