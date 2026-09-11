import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { SITEMAP_MEMBERS, discoverPageModules } from "./sitemap";

// The path part of every <loc> in public/sitemap.xml, sorted. The XML lists
// absolute URLs, so the origin is stripped to compare paths against the registry.
function sitemapXmlPaths(): string[] {
	const xml = readFileSync("public/sitemap.xml", "utf8");
	const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
		(match) => new URL(match[1]).pathname,
	);
	return paths.sort();
}

describe("sitemap consistency", () => {
	it("should register every discovered page module and no phantom pages", () => {
		const expectedResult = SITEMAP_MEMBERS.map(
			(member) => member.module,
		).sort();

		const result = discoverPageModules();

		expect(result).toEqual(expectedResult);
	});

	it("should list exactly the registered page paths in the sitemap xml", () => {
		const expectedResult = SITEMAP_MEMBERS.map((member) => member.path).sort();

		const result = sitemapXmlPaths();

		expect(result).toEqual(expectedResult);
	});
});
