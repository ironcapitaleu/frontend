/**
 * Reads how a `fill="end"` slider paints the cover on its rejected side:
 * the alpha of the cover's background color, drawn on a canvas, and whether
 * the `input` tint layer is present as a background image. A slider test
 * asserts both, since an opaque cover with no tint does not match an empty
 * track either.
 */
export function readSliderCover(root: HTMLElement): {
	alpha: number | string;
	tint: boolean;
} {
	const indicator = root.querySelector<HTMLElement>(
		'[data-slot="slider-track"][data-fill="end"] [data-slot="slider-indicator"]',
	);
	const context = document.createElement("canvas").getContext("2d");
	if (!indicator || !context) {
		return { alpha: "cover missing", tint: false };
	}
	const style = getComputedStyle(indicator);
	// An unparseable color leaves `fillStyle` untouched, so start transparent
	// rather than letting the opaque black default pass the alpha check.
	context.fillStyle = "rgba(0, 0, 0, 0)";
	context.fillStyle = style.backgroundColor;
	context.fillRect(0, 0, 1, 1);
	return {
		alpha: context.getImageData(0, 0, 1, 1).data[3],
		tint: style.backgroundImage.includes("linear-gradient"),
	};
}
