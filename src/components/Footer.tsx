import { Link } from "react-router-dom";

function Footer() {
	return (
		<footer className="border-t border-border/50">
			<div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-center gap-4">
				<span className="text-sm text-muted-foreground">
					© {new Date().getFullYear()} Iron Capital. All rights reserved.
				</span>
				<Link
					to="/sitemap"
					className="text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					Sitemap
				</Link>
			</div>
		</footer>
	);
}

export default Footer;
