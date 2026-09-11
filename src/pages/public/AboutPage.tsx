import { Heading } from "@/components/ui/heading";
import { Container, Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";

function StatementSection() {
	return (
		<Section spacing="xl" className="text-center">
			<Text
				size="display"
				tone="foreground"
				className="mx-auto max-w-4xl text-center"
			>
				Every successful investment begins with a deep understanding of the
				business.
			</Text>
		</Section>
	);
}

function PhilosophySection() {
	return (
		<Section divider="top">
			<Container className="flex flex-col gap-6 text-center">
				<Heading level={1} variant="feature">
					Timeless Principles
				</Heading>
				<Text>
					Everything we do is grounded in principles that have endured through
					time and continue to guide our judgment about the future.
				</Text>
				<Text>
					It is rarely wise to project the past into the future. But the past
					does contain something valuable: patterns that refuse to change. Human
					behavior, incentives, and the fundamental drivers of value have
					persisted across decades and centuries. We study these — and only
					these. Markets shift, industries transform, technologies disrupt — but
					the forces that govern how businesses create and destroy value
					persist.
				</Text>
				<Text>
					We dedicate ourselves to these principles and apply them with patience
					and discipline.
				</Text>
			</Container>
		</Section>
	);
}

function SecurityAnalysisSection() {
	return (
		<Section divider="top">
			<Container className="flex flex-col gap-6 text-center">
				<Heading level={1} variant="feature">
					Security Analysis
				</Heading>
				<Text>
					A security is not a blinking number on a screen — it represents a
					claim on a real business, with real economics, real risks, and a real
					future.
				</Text>
				<Text>
					The discipline of security analysis, as practiced by its earliest and
					most rigorous thinkers, asks one central question: what is this
					business actually worth? Answering it demands patience, accounting
					literacy, and a refusal to confuse price with value.
				</Text>
			</Container>
		</Section>
	);
}

function MethodSection() {
	return (
		<Section divider="top">
			<Container className="flex flex-col gap-8 text-center">
				<Heading level={1} variant="feature">
					Our Method
				</Heading>
				<div className="flex flex-col gap-5">
					<Text>
						We build tools for people who want to understand businesses — their
						economics, their competitive positions, their capital allocation,
						and their long-term prospects.
					</Text>
					<Text>
						Information and facts about a company — not a ticker symbol.
					</Text>
					<Text>
						Financial data rooted in accounting fundamentals, not price
						movements.
					</Text>
					<Text>
						A consistent framework for thinking about business quality, year
						after year.
					</Text>
				</div>
			</Container>
		</Section>
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
