import SearchBar from "@/components/SearchBar";

function HeroSection() {
	return (
		<section className="flex flex-col items-center gap-8 text-center w-full max-w-3xl">
			<div className="flex flex-col items-center">
				<h1>Iron Capital</h1>
				<p className="text-muted-foreground text-center mb-0 max-w-sm">
					Research businesses.
				</p>
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
