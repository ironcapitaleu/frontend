import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/react-vite";
import { vi } from "vitest";
import * as projectAnnotations from "./preview";

// Supabase reads these at module load and throws when they are absent, so any
// story that imports app code touching the auth context (LoginPage) fails to
// import without them. Stub them the same way the unit setup does; the stories
// inject fake gateways, so no story ever talks to Supabase.
vi.stubEnv("VITE_SUPABASE_URL", "https://stub.supabase.co");
vi.stubEnv("VITE_SUPABASE_ANON_KEY", "stub-anon-key");

// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);
