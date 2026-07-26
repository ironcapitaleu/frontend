import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
	it("should keep the last conflicting class when tailwind utilities collide", () => {
		const expectedResult = "px-4";

		const result = cn("px-2", "px-4");

		expect(result).toBe(expectedResult);
	});

	it("should drop falsy values when composing class names", () => {
		const expectedResult = "a c";

		const result = cn("a", false && "b", null, undefined, "c");

		expect(result).toBe(expectedResult);
	});

	it("should include only the truthy keys when given a conditional class object", () => {
		const expectedResult = "base active";

		const result = cn("base", { active: true, disabled: false });

		expect(result).toBe(expectedResult);
	});
});
