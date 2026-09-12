/// <reference types="vitest/config" />
import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vite";

const dirname =
	typeof __dirname !== "undefined"
		? __dirname
		: path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@": path.resolve(dirname, "./src"),
		},
	},
	test: {
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/**/*.{ts,tsx}"],
			exclude: [
				"src/**/*.test.{ts,tsx}",
				"src/**/*.stories.{ts,tsx}",
				"src/test/**",
			],
			// The coverage gate. These floors measure layer 1 only — `test:ci`
			// runs the `unit` project, so `ui/*` primitives covered by Storybook
			// play tests count as uncovered here and hold the global numbers
			// down. The floors sit just below the current baseline: they hold the
			// line against regressions without blocking unrelated PRs. Ratchet
			// them upward as coverage grows — never downward to make a red build
			// pass.
			thresholds: {
				statements: 66,
				branches: 57,
				functions: 58,
				lines: 65,
			},
		},
		projects: [
			{
				extends: true,
				test: {
					name: "unit",
					include: ["src/**/*.test.{ts,tsx}"],
					environment: "jsdom",
					setupFiles: ["./src/test/setup.ts"],
					globals: true,
				},
			},
			{
				extends: true,
				// The visual regression helper (.storybook/utils/visualSnapshot.ts)
				// runs in the browser, where `import.meta.env` carries only the
				// VITE_-prefixed variables. This hands the VISUAL flag across that
				// boundary for the `storybook` project alone, so the app bundle never
				// sees it. Without the flag the helper returns straight away and
				// `npm run test:storybook` behaves exactly as it did before.
				define: {
					"import.meta.env.VISUAL": JSON.stringify(process.env.VISUAL ?? ""),
				},
				plugins: [
					// The plugin will run tests for the stories defined in your Storybook config
					// See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
					storybookTest({
						configDir: path.join(dirname, ".storybook"),
					}),
				],
				test: {
					name: "storybook",
					browser: {
						enabled: true,
						headless: true,
						// The tester runs inside an iframe on a Playwright page. When a
						// story asks for a viewport larger than that page, the iframe is
						// scaled down to fit and the screenshot records the scaled
						// pixels: Playwright's default page is 1280 by 720, which turned
						// a 1440 by 900 capture into 1152 by 720 and a 390 by 844 one
						// into 333 by 720. Downscaling blurs an image, which is the
						// opposite of what a pixel comparison needs.
						//
						// This page is larger than every viewport in
						// .storybook/utils/visualSnapshot.ts, so each capture is one to
						// one. Raise it before adding a viewport bigger than this.
						provider: playwright({
							contextOptions: { viewport: { width: 1600, height: 1000 } },
						}),
						instances: [
							{
								browser: "chromium",
							},
						],
					},
					setupFiles: [".storybook/vitest.setup.ts"],
				},
			},
		],
	},
});
