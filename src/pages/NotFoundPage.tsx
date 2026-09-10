import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

function NotFoundPage() {
	return (
		<div className="flex-1 flex items-center justify-center px-4">
			<section className="flex flex-col items-center text-center max-w-2xl mx-auto">
				<span className="text-8xl md:text-9xl font-serif font-bold text-foreground/10 mb-4 select-none">
					404
				</span>

				<Heading level={1} variant="hero" className="mb-4">
					The page you're looking for can't be found.
				</Heading>

				<Text font="sans" size="lg" className="mb-8">
					It might have been moved or deleted. Let's get you back on track.
				</Text>

				<Button
					size="lg"
					variant="outline"
					className="px-8 tracking-wide"
					render={<Link to="/" />}
				>
					Return to homepage
				</Button>
			</section>
		</div>
	);
}

export default NotFoundPage;
