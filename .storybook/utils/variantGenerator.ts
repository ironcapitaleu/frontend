/**
 * Extract variant options from a CVA variants object
 * @example
 * const variants = extractVariants(buttonVariants);
 * // Returns: { variant: ['default', 'destructive', ...], size: ['default', 'sm', ...] }
 */
export function extractVariants<T extends (...args: unknown[]) => unknown>(
	cvaFunction: T,
): Record<string, string[]> {
	// Access the CVA config through the function's toString or stored metadata
	// This is a runtime extraction approach
	const config = (
		cvaFunction as unknown as {
			config?: { variants?: Record<string, Record<string, unknown>> };
		}
	).config;

	if (!config?.variants) {
		return {};
	}

	const result: Record<string, string[]> = {};

	for (const [key, value] of Object.entries(config.variants)) {
		if (typeof value === "object" && value !== null) {
			result[key] = Object.keys(value);
		}
	}

	return result;
}

/**
 * Generate argTypes for Storybook controls from CVA variants
 * @example
 * argTypes: generateArgTypes(buttonVariants)
 */
export function generateArgTypes<T extends Record<string, unknown>>(
	variants: T,
): Record<keyof T, { control: "select"; options: string[] }> {
	const argTypes: Record<string, { control: "select"; options: string[] }> = {};

	for (const [key, options] of Object.entries(variants)) {
		if (Array.isArray(options)) {
			argTypes[key] = {
				control: "select",
				options,
			};
		}
	}

	return argTypes as Record<keyof T, { control: "select"; options: string[] }>;
}

/**
 * Generate individual stories for each variant combination
 * Useful for creating a showcase of all variants
 */
export function generateVariantStories<TProps extends Record<string, unknown>>(
	variantKey: string,
	variants: string[],
	baseArgs?: Partial<TProps>,
): Record<string, { args: Partial<TProps> }> {
	const stories: Record<string, { args: Partial<TProps> }> = {};

	for (const variant of variants) {
		const storyName = variant.charAt(0).toUpperCase() + variant.slice(1);
		stories[storyName] = {
			args: {
				...baseArgs,
				[variantKey]: variant,
			} as Partial<TProps>,
		};
	}

	return stories;
}

/**
 * Capitalize first letter of string for story naming
 */
export function toStoryName(str: string): string {
	return str
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join("");
}
