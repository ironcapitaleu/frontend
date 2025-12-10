import React from "react";
import { Link } from "react-router-dom";

const HomePage: React.FC = () => {
	return (
		<div className="container">
			{/* Hero Section */}
			<section className="py-20 text-center fade-in">
				<h1 className="h1 mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
					Premium Investment Partnership
				</h1>
				<p className="body-large text-secondary mb-8 max-w-3xl mx-auto">
					Iron Capital combines advanced analytics with strategic investment
					insights to deliver exceptional returns for our partners. Access
					professional-grade tools and research that power informed investment
					decisions.
				</p>
				<div className="flex flex-col sm:flex-row gap-4 justify-center">
					<Link to="/screener" className="btn btn-primary">
						Explore Stock Screener
					</Link>
					<Link to="/about" className="btn btn-glass">
						Learn More
					</Link>
				</div>
			</section>

			{/* Features Grid */}
			<section className="py-16 slide-up">
				<h2 className="h2 text-center mb-12">Investment Tools & Analytics</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{/* Stock Screener Card */}
					<Link
						to="/screener"
						className="card glass hover:scale-105 transition-all duration-300 block"
					>
						<div className="mb-4">
							<div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-4">
								<svg
									className="w-6 h-6 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									/>
								</svg>
							</div>
							<h3 className="h3 mb-2">Stock Screener</h3>
							<p className="text-secondary">
								Advanced filtering and analysis tools to identify investment
								opportunities based on fundamentals, technicals, and market
								data.
							</p>
						</div>
					</Link>

					{/* Company Search Card */}
					<Link
						to="/search"
						className="card glass hover:scale-105 transition-all duration-300 block"
					>
						<div className="mb-4">
							<div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-4">
								<svg
									className="w-6 h-6 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								</svg>
							</div>
							<h3 className="h3 mb-2">Company Search</h3>
							<p className="text-secondary">
								Comprehensive company research platform with financial data,
								news, and analysis for informed investment decisions.
							</p>
						</div>
					</Link>

					{/* Analytics Card */}
					<div className="card glass">
						<div className="mb-4">
							<div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-4">
								<svg
									className="w-6 h-6 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
							</div>
							<h3 className="h3 mb-2">Portfolio Analytics</h3>
							<p className="text-secondary">
								Real-time portfolio tracking, risk assessment, and performance
								analytics to optimize your investment strategy.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Stats Section */}
			<section className="py-16">
				<div className="glass-strong p-8 rounded-3xl">
					<h2 className="h2 text-center mb-12">Partnership Performance</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
						<div>
							<div className="h1 text-primary mb-2">15.8%</div>
							<p className="text-secondary">Average Annual Return</p>
						</div>
						<div>
							<div className="h1 text-primary mb-2">€2.4B</div>
							<p className="text-secondary">Assets Under Management</p>
						</div>
						<div>
							<div className="h1 text-primary mb-2">500+</div>
							<p className="text-secondary">Active Partners</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20 text-center">
				<div className="glass p-12 rounded-3xl max-w-4xl mx-auto">
					<h2 className="h2 mb-4">Ready to Start Investing?</h2>
					<p className="body-large text-secondary mb-8">
						Join our exclusive investment partnership and gain access to
						institutional-grade research and investment opportunities.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link to="/contact" className="btn btn-primary">
							Get Started
						</Link>
						<Link to="/about" className="btn btn-glass">
							Learn More About Us
						</Link>
					</div>
				</div>
			</section>
		</div>
	);
};

export default HomePage;
