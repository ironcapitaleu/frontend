/**
 * Makes the page match its print styles, for a story of the printed page.
 * A browser cannot switch to print media from a script, so this flips each
 * media rule of the loaded stylesheets instead: a `print` rule applies and a
 * `screen` rule stops, as when the browser prints. Use it as a story's
 * `beforeEach`. It returns the cleanup that restores every rule.
 */
export function emulatePrintMedia(): () => void {
	const changed: [MediaList, string][] = [];
	const visit = (rules: CSSRuleList) => {
		for (const rule of Array.from(rules)) {
			if (rule instanceof CSSMediaRule) {
				const text = rule.media.mediaText;
				const printed = text
					.replace(/\bprint\b/g, "all")
					.replace(/\bscreen\b/g, "not all");
				if (printed !== text) {
					changed.push([rule.media, text]);
					rule.media.mediaText = printed;
				}
			}
			if ("cssRules" in rule) visit(rule.cssRules as CSSRuleList);
		}
	};
	const flip = () => {
		for (const sheet of Array.from(document.styleSheets)) {
			// A stylesheet from another origin hides its rules and throws here.
			try {
				visit(sheet.cssRules);
			} catch {}
		}
	};
	flip();
	// Vite rewrites a stylesheet when the story loads new classes, which
	// brings back its media rules, so each rewrite flips them again.
	const observer = new MutationObserver(flip);
	observer.observe(document.head, {
		childList: true,
		subtree: true,
		characterData: true,
	});
	return () => {
		observer.disconnect();
		for (const [media, text] of changed) media.mediaText = text;
	};
}

/**
 * The printable area of A4 and Letter paper at 96 px to the inch, inside the
 * 12 mm margin of the print stylesheet. A story sets one as its viewport, so
 * the width queries match those of the printed page.
 */
export const PAPER_VIEWPORTS = {
	a4: {
		name: "A4 printable area",
		styles: { width: "703px", height: "1032px" },
		type: "other",
	},
	letter: {
		name: "Letter printable area",
		styles: { width: "725px", height: "965px" },
		type: "other",
	},
} as const;
