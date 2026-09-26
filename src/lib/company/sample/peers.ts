import type { MetricKey, SectorBenchmark, Unit } from "../types";
import { atLeastOne, derived, filing, reported } from "./sources";

/** The number of made-up peers in the MRDN peer group. */
const PEER_COUNT = 61;
const PEER_GROUP = "US-listed semiconductor companies";

/**
 * The lowest peer, the lower quartile, the median, the upper quartile and the
 * highest peer of one metric.
 */
export type Spread = readonly [number, number, number, number, number];

/**
 * Builds the quartiles of one metric over 61 made-up peers. The peer figures
 * rise in straight steps between the five points of `spread`, so the 16th,
 * 31st and 46th peer hold the quartiles and the median. Each peer figure comes
 * from the latest 10-K of that peer, so the Overview and the Valuation
 * benchmarks read the same peer filings. `inText` is the name as a sentence
 * prints it, such as `operating margin` for `Operating margin`.
 */
export function sectorBenchmark(
	section: "overview" | "valuation",
	metric: MetricKey,
	name: string,
	spread: Spread,
	unit: Unit,
	inText: string = name.toLowerCase(),
): SectorBenchmark {
	const quarter = (PEER_COUNT - 1) / 4;
	const peers = Array.from({ length: PEER_COUNT }, (_, rank) => {
		const step = Math.min(Math.floor(rank / quarter), 3);
		const fraction = (rank - step * quarter) / quarter;
		const value =
			Math.round(
				(spread[step] + (spread[step + 1] - spread[step]) * fraction) * 10_000,
			) / 10_000;
		const peer = `Semiconductor peer ${rank + 1}`;
		const document = filing(
			"10-K",
			`000900${String(rank + 1).padStart(4, "0")}-26-000001`,
			"2026-03-20",
			"Latest fiscal year",
			peer,
		);
		return reported(
			{
				id: `${section}.sectorBenchmarks.${metric}.peers.${rank}`,
				label: `${name}, ${peer}`,
				value,
				unit,
				period: null,
			},
			document,
			{ path: `Peer figure › ${name}`, xbrlTag: null },
		);
	});
	const quartile = (
		field: "lowerQuartile" | "median" | "upperQuartile",
		title: string,
		position: number,
	) =>
		derived(
			{
				id: `${section}.sectorBenchmarks.${metric}.${field}`,
				label: `Sector ${inText}, ${title.toLowerCase()}`,
				value: peers[position].value,
				unit,
				period: null,
			},
			`${title} of ${inText} across ${PEER_COUNT} ${PEER_GROUP}`,
			atLeastOne(peers, `the peers of ${metric}`),
		);
	return {
		metric,
		peerGroup: PEER_GROUP,
		peerCount: PEER_COUNT,
		lowerQuartile: quartile("lowerQuartile", "Lower quartile", quarter),
		median: quartile("median", "Median", 2 * quarter),
		upperQuartile: quartile("upperQuartile", "Upper quartile", 3 * quarter),
	};
}
