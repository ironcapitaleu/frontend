import * as matchers from "@testing-library/jest-dom/matchers";
import { expect, vi } from "vitest";

expect.extend(matchers);

// Supabase reads these at module load and throws when they are absent. Stub them
// on `import.meta.env` so the real client (and its gateway adapter) can be
// imported in tests; the fakes injected via the custom render mean no test ever
// actually talks to Supabase.
vi.stubEnv("VITE_SUPABASE_URL", "https://stub.supabase.co");
vi.stubEnv("VITE_SUPABASE_ANON_KEY", "stub-anon-key");

// jsdom does not implement window.matchMedia — provide a no-op stub
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});
