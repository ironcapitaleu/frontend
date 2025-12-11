import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock environment variables
vi.stubGlobal("import.meta", {
	env: {
		VITE_SUPABASE_URL: "https://mock.supabase.co",
		VITE_SUPABASE_ANON_KEY: "mock-key",
	},
});
