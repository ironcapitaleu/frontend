import { expect, vi } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// Mock environment variables
vi.stubGlobal("import.meta", {
	env: {
		VITE_SUPABASE_URL: "https://mock.supabase.co",
		VITE_SUPABASE_ANON_KEY: "mock-key",
	},
});
