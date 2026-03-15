function Footer() {
	return (
		<footer className="border-t border-border/50">
			<div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-center">
				<span className="text-sm text-muted-foreground">
					© {new Date().getFullYear()} Iron Capital. All rights reserved.
				</span>
			</div>
		</footer>
	);
}

export default Footer;
