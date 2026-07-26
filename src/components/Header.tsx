import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router";

const NAV_LINKS = [
	{ label: "Home", to: "/" },
	{ label: "Screener", to: "/screener" },
	{ label: "API", to: "/api" },
	{ label: "About", to: "/about" },
	{ label: "Contact", to: "/contact" },
	{ label: "Sign in", to: "/login" },
] as const;

function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(min-width: 768px)");
		const handleChange = (e: MediaQueryListEvent) => {
			if (e.matches) setIsMenuOpen(false);
		};
		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	return (
		<header className="border-b border-border">
			<div className="max-w-6xl mx-auto px-4">
				<nav
					aria-label="Main navigation"
					className="flex items-center justify-between h-16"
				>
					<Link to="/" aria-label="Iron Capital home">
						<img
							src="/icon.svg"
							alt="Iron Capital"
							className="w-9 h-9 rounded-full object-cover"
						/>
					</Link>

					{/* Desktop nav */}
					<ul className="hidden md:flex items-center gap-6 list-none m-0 p-0">
						{NAV_LINKS.map(({ label, to }) => (
							<li key={to}>
								<NavLink
									to={to}
									className={({ isActive }) =>
										isActive
											? "text-sm text-foreground transition-colors"
											: "text-sm text-muted-foreground hover:text-foreground transition-colors"
									}
								>
									{label}
								</NavLink>
							</li>
						))}
					</ul>

					{/* Hamburger button */}
					<button
						type="button"
						aria-label={isMenuOpen ? "Close menu" : "Open menu"}
						aria-expanded={isMenuOpen}
						aria-controls="mobile-menu"
						onClick={() => setIsMenuOpen((prev) => !prev)}
						className="md:hidden flex items-center justify-center w-11 h-11 text-muted-foreground hover:text-foreground transition-colors"
					>
						{isMenuOpen ? <X size={22} /> : <Menu size={22} />}
					</button>
				</nav>
			</div>

			{/* Mobile menu */}
			<nav
				id="mobile-menu"
				aria-label="Mobile navigation"
				{...(!isMenuOpen && { inert: true })}
				className={`mobile-menu md:hidden border-t border-border${isMenuOpen ? " open" : ""}`}
			>
				<ul className="flex flex-col list-none m-0 p-0 overflow-hidden">
					{NAV_LINKS.map(({ label, to }) => (
						<li key={to}>
							<NavLink
								to={to}
								onClick={() => setTimeout(() => setIsMenuOpen(false), 300)}
								className={({ isActive }) =>
									`block px-6 py-4 text-sm transition-colors ${
										isActive
											? "text-foreground"
											: "text-muted-foreground hover:text-foreground"
									}`
								}
							>
								{label}
							</NavLink>
						</li>
					))}
				</ul>
			</nav>
		</header>
	);
}

export default Header;
