import { describe, expect, it } from "vitest";

import { render, renderHook, screen } from "../test/render";
import { useThemeContext } from "./ThemeContext";

function ChoiceProbe() {
	const { choice } = useThemeContext();
	return <p>{choice}</p>;
}

describe("useThemeContext", () => {
	it("should throw a guidance error when used outside a ThemeProvider", () => {
		const expectedResult =
			"useThemeContext must be used within a ThemeProvider";

		const result = () => renderHook(() => useThemeContext());

		expect(result).toThrow(expectedResult);
	});

	it("should expose the current theme choice to a consumer under the provider", () => {
		render(<ChoiceProbe />);

		const expectedResult = "system";

		const result = screen.getByText(expectedResult);

		expect(result).toHaveTextContent(expectedResult);
	});
});
