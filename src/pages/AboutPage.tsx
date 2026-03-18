function StatementSection() {
	return (
		<section className="flex flex-col items-center justify-center px-6 py-24 text-center">
			<p className="font-classic text-5xl md:text-7xl font-medium leading-tight max-w-4xl text-foreground text-center">
				Every successful investment begins with a deep understanding of the
				business.
			</p>
		</section>
	);
}

function PhilosophySection() {
	return (
		<section className="flex flex-col items-center px-6 py-16 border-t border-border/50">
			<div className="max-w-prose flex flex-col gap-6 text-center">
				<h1 className="font-classic font-semibold">Timeless Principles</h1>
				<p className="font-classic text-muted-foreground leading-relaxed">
					Everything we do is grounded in principles that have endured through
					time and continue to guide our judgment about the future.
				</p>
				<p className="font-classic text-muted-foreground leading-relaxed">
					It is rarely wise to project the past into the future. But the past
					does contain something valuable: patterns that refuse to change. Human
					behavior, incentives, and the fundamental drivers of value have
					persisted across decades and centuries. We study these — and only
					these. Markets shift, industries transform, technologies disrupt — but
					the forces that govern how businesses create and destroy value
					persist.
				</p>
				<p className="font-classic text-muted-foreground leading-relaxed">
					We dedicate ourselves to these principles and apply them with patience
					and discipline.
				</p>
			</div>
		</section>
	);
}

function SecurityAnalysisSection() {
	return (
		<section className="flex flex-col items-center px-6 py-16 border-t border-border/50">
			<div className="max-w-prose flex flex-col gap-6 text-center">
				<h1 className="font-classic font-semibold">Security Analysis</h1>
				<p className="font-classic text-muted-foreground leading-relaxed">
					A security is not a blinking number on a screen — it represents a
					claim on a real business, with real economics, real risks, and a real
					future.
				</p>
				<p className="font-classic text-muted-foreground leading-relaxed">
					The discipline of security analysis, as practiced by its earliest and
					most rigorous thinkers, asks one central question: what is this
					business actually worth? Answering it demands patience, accounting
					literacy, and a refusal to confuse price with value.
				</p>
			</div>
		</section>
	);
}

function MethodSection() {
	return (
		<section className="flex flex-col items-center px-6 py-16 border-t border-border/50">
			<div className="max-w-prose flex flex-col gap-8 text-center">
				<h1 className="font-classic font-semibold">Our Method</h1>
				<div className="flex flex-col gap-5 text-muted-foreground">
					<p className="font-classic text-muted-foreground leading-relaxed">
						We build tools for people who want to understand businesses — their
						economics, their competitive positions, their capital allocation,
						and their long-term prospects.
					</p>
					<p className="font-classic leading-relaxed">
						Information and facts about a company — not a ticker symbol.
					</p>
					<p className="font-classic leading-relaxed">
						Financial data rooted in accounting fundamentals, not price
						movements.
					</p>
					<p className="font-classic leading-relaxed">
						A consistent framework for thinking about business quality, year
						after year.
					</p>
				</div>
			</div>
		</section>
	);
}

function AboutPage() {
	return (
		<>
			<StatementSection />
			<PhilosophySection />
			<SecurityAnalysisSection />
			<MethodSection />
		</>
	);
}

export default AboutPage;
