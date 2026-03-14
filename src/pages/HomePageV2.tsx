import Footer from "@/components/Footer";
import HeaderV2 from "@/components/HeaderV2";
import SearchBar from "@/components/SearchBar";

function HeroSection() {
	return (
		<section className="flex flex-col items-center gap-4 text-center">
			<h1>Iron Capital</h1>
			<p className="text-muted-foreground text-center mb-0 max-w-sm">
				Research businesses.
			</p>
			<SearchBar />
		</section>
	);
}

function HomePageV2() {
	return (
		<div className="min-h-screen flex flex-col">
			<HeaderV2 />
			<main className="flex-1 flex items-center justify-center px-4">
				<HeroSection />
			</main>
			<Footer />
		</div>
	);
}

export default HomePageV2;
