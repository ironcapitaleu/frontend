import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

function NotFoundPage() {
	return (
		<div className="min-h-screen flex flex-col">
			<Header />
			<main className="flex-1 flex items-center justify-center px-4">
				<section className="flex flex-col items-center text-center max-w-2xl mx-auto">
					<span className="text-8xl md:text-[120px] font-serif font-bold text-foreground/10 mb-4 select-none">
						404
					</span>

					<h1 className="font-serif md:text-5xl font-medium tracking-tight mb-4">
						The page you're looking for can't be found.
					</h1>

					<p className="text-muted-foreground text-lg mb-8">
						It might have been moved or deleted. Let's get you back on track.
					</p>

					<Button
						size="lg"
						variant="outline"
						className="px-8 tracking-wide"
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
