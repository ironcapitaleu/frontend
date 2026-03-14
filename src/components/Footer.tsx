function Footer() {
	return (
		<footer className="border-t border-border">
			<div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
				<span className="text-sm font-medium">Iron Capital</span>
				<span className="text-sm text-muted-foreground">
					© {new Date().getFullYear()} Iron Capital. All rights reserved.
				</span>
			</div>
		</footer>
	);
}

export default Footer;
