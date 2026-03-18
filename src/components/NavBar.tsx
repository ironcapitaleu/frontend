import { Link, NavLink } from "react-router-dom";

const NAV_LINKS = [
	{ label: "Home", to: "/" },
	{ label: "Screener", to: "/screener" },
	{ label: "API", to: "/api" },
	{ label: "About", to: "/about" },
] as const;

function NavBar() {
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

					<ul className="flex items-center gap-6 list-none m-0 p-0">
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
				</nav>
			</div>
		</header>
	);
}

export default NavBar;
