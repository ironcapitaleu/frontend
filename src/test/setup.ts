import { expect, vi } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

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

// Mock environment variables
vi.stubGlobal("import.meta", {
	env: {
		VITE_SUPABASE_URL: "https://mock.supabase.co",
		VITE_SUPABASE_ANON_KEY: "mock-key",
	},
});
