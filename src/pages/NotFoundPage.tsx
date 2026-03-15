import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import HeaderV2 from "@/components/HeaderV2";

function NotFoundPage() {
	return (
		<div className="min-h-screen flex flex-col bg-[#0B0F19]">
			{" "}
			{/* Assuming your dark bg */}
			<HeaderV2 />
			<main className="flex-1 flex items-center justify-center px-4">
				<section className="flex flex-col items-center text-center max-w-2xl mx-auto">
					<span className="text-8xl md:text-[120px] font-serif font-bold text-white/10 mb-4 select-none">
						404
					</span>

					<h1 className="font-serif md:text-5xl font-medium tracking-tight mb-4">
						The page you're looking for can't be found.
					</h1>

					<p className="text-gray-400 text-lg mb-8">
						It might have been moved or deleted. Let's get you back on track.
					</p>

					<Button
						variant="outline"
						className="px-8 py-6 text-base tracking-wide transition-all hover:bg-white hover:text-black"
						render={<Link to="/" />}
					>
						Return to homepage
					</Button>
				</section>
			</main>
			<Footer />
		</div>
	);
}

export default NotFoundPage;
