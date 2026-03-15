import Footer from "@/components/Footer";
import Header from "@/components/Header";

function StatementSection() {
	return (
		<section className="flex flex-col items-center justify-center px-6 py-24 text-center">
			<p className="font-classic text-5xl md:text-7xl font-medium leading-tight max-w-4xl text-foreground">
				Every great investment begins with understanding the business.
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
					Modern finance has grown fluent in the language of tickers and
					targets, of momentum and multiples. Iron Capital is built in
					deliberate opposition to that. We believe that a security is not a
					blinking number — it is a fractional ownership stake in a real
					business, with real customers, real costs, and a real future.
				</p>
				<p className="text-muted-foreground leading-relaxed">
					The discipline of security analysis, as practiced by its earliest and
					most rigorous thinkers, asks one central question: what is this
					business actually worth? Answering it requires patience, accounting
					literacy, and a refusal to confuse price with value. That is the
					standard we hold ourselves to.
				</p>
				<p className="text-muted-foreground leading-relaxed">
					We are not building tools for traders. We are building tools for
					people who want to understand businesses — their economics, their
					competitive positions, their capital allocation, and their long-run
					prospects.
				</p>
			</div>
		</section>
	);
}

function CapabilitiesSection() {
	return (
		<section className="flex flex-col items-center px-6 py-16 border-t border-border/50">
			<div className="max-w-prose flex flex-col gap-8 text-center">
				<h1 className="font-classic font-semibold">What it gives you</h1>
				<div className="flex flex-col gap-5 text-muted-foreground">
					<p className="leading-relaxed">
						Information and facts about a company — not a ticker symbol.
					</p>
					<p className="leading-relaxed">
						Financial data rooted in accounting fundamentals, not price
						momentum.
					</p>
					<p className="leading-relaxed">
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
		<div className="min-h-screen flex flex-col">
			<Header />
			<main className="flex-1 flex flex-col">
				<StatementSection />
				<PhilosophySection />
				<CapabilitiesSection />
			</main>
			<Footer />
		</div>
	);
}

export default AboutPage;
