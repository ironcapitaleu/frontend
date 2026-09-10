import SearchBar from "@/components/SearchBar";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

function HeroSection() {
	return (
		<section className="flex flex-col items-center gap-8 text-center w-full max-w-3xl">
			<div className="flex flex-col items-center">
				<Heading level={1} variant="hero">
					Iron Capital
				</Heading>
				<Text font="sans" tone="muted" className="text-center max-w-sm">
					Research businesses.
				</Text>
			</div>
			<SearchBar />
		</section>
	);
}

function HomePage() {
	return (
		<div className="flex-1 flex items-center justify-center px-4">
			<HeroSection />
		</div>
	);
}

export default HomePage;
