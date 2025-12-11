import type React from "react";

const AboutPage: React.FC = () => {
	return (
		<div className="container py-8">
			{/* Hero Section */}
			<section className="text-center mb-16 fade-in">
				<h1 className="h1 mb-6">About Iron Capital</h1>
				<p className="body-large text-secondary max-w-4xl mx-auto mb-8">
					Iron Capital is a premier investment partnership dedicated to
					delivering exceptional returns through strategic analysis,
					cutting-edge technology, and disciplined risk management. Founded on
					principles of transparency and excellence.
				</p>
			</section>

			{/* Mission & Vision */}
			<section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
				<div className="glass p-8 rounded-xl slide-up">
					<div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-6">
						<svg
							className="w-6 h-6 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
					</div>
					<h2 className="h2 mb-4">Our Mission</h2>
					<p className="text-secondary">
						To democratize institutional-grade investment research and provide
						our partners with the tools and insights needed to make informed
						investment decisions in today's complex financial markets.
					</p>
				</div>

				<div className="glass p-8 rounded-xl slide-up">
					<div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-6">
						<svg
							className="w-6 h-6 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
							/>
						</svg>
					</div>
					<h2 className="h2 mb-4">Our Vision</h2>
					<p className="text-secondary">
						To become Europe's leading investment partnership by combining
						traditional investment wisdom with innovative technology, creating
						sustainable wealth for our partners while maintaining the highest
						ethical standards.
					</p>
				</div>
			</section>

			{/* Our Approach */}
			<section className="mb-16">
				<h2 className="h2 text-center mb-12">Our Investment Approach</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="glass p-6 rounded-xl text-center">
						<div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
							<svg
								className="w-8 h-8 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								/>
							</svg>
						</div>
						<h3 className="h3 mb-4">Data-Driven Analysis</h3>
						<p className="text-secondary">
							We leverage advanced analytics and quantitative models to identify
							market opportunities and assess risk across all asset classes.
						</p>
					</div>

					<div className="glass p-6 rounded-xl text-center">
						<div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
							<svg
								className="w-8 h-8 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								/>
							</svg>
						</div>
						<h3 className="h3 mb-4">Risk Management</h3>
						<p className="text-secondary">
							Comprehensive risk assessment and portfolio diversification
							strategies protect capital while maximizing potential returns.
						</p>
					</div>

					<div className="glass p-6 rounded-xl text-center">
						<div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center">
							<svg
								className="w-8 h-8 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
								/>
							</svg>
						</div>
						<h3 className="h3 mb-4">Long-term Focus</h3>
						<p className="text-secondary">
							We prioritize sustainable, long-term growth over short-term gains,
							building wealth through patient and strategic investing.
						</p>
					</div>
				</div>
			</section>

			{/* Team Section */}
			<section className="mb-16">
				<h2 className="h2 text-center mb-12">Leadership Team</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					<div className="glass p-6 rounded-xl text-center">
						<div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
							<span className="text-2xl font-bold text-white">JD</span>
						</div>
						<h3 className="h3 mb-2">John Doe</h3>
						<p className="text-primary font-semibold mb-3">
							Founding Partner & CEO
						</p>
						<p className="text-secondary text-sm">
							15+ years in institutional asset management. Former Goldman Sachs
							executive with expertise in global equity markets and alternative
							investments.
						</p>
					</div>

					<div className="glass p-6 rounded-xl text-center">
						<div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
							<span className="text-2xl font-bold text-white">SM</span>
						</div>
						<h3 className="h3 mb-2">Sarah Miller</h3>
						<p className="text-primary font-semibold mb-3">
							Chief Investment Officer
						</p>
						<p className="text-secondary text-sm">
							PhD in Finance from London School of Economics. Specialized in
							quantitative analysis and risk management with 12 years at
							BlackRock.
						</p>
					</div>

					<div className="glass p-6 rounded-xl text-center">
						<div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
							<span className="text-2xl font-bold text-white">MJ</span>
						</div>
						<h3 className="h3 mb-2">Michael Johnson</h3>
						<p className="text-primary font-semibold mb-3">
							Head of Technology
						</p>
						<p className="text-secondary text-sm">
							Former quantitative researcher at Two Sigma. Leads our technology
							infrastructure and algorithmic trading systems development.
						</p>
					</div>
				</div>
			</section>

			{/* Performance History */}
			<section className="mb-16">
				<div className="glass p-8 rounded-xl">
					<h2 className="h2 text-center mb-8">Track Record</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						<div className="text-center p-6 glass-strong rounded-xl">
							<div className="h1 text-primary mb-2">15.8%</div>
							<p className="text-secondary font-semibold">Avg Annual Return</p>
							<p className="text-xs text-tertiary mt-1">Since inception 2018</p>
						</div>
						<div className="text-center p-6 glass-strong rounded-xl">
							<div className="h1 text-primary mb-2">€2.4B</div>
							<p className="text-secondary font-semibold">
								Assets Under Management
							</p>
							<p className="text-xs text-tertiary mt-1">As of Q4 2024</p>
						</div>
						<div className="text-center p-6 glass-strong rounded-xl">
							<div className="h1 text-primary mb-2">0.75%</div>
							<p className="text-secondary font-semibold">Management Fee</p>
							<p className="text-xs text-tertiary mt-1">
								Competitive industry rates
							</p>
						</div>
						<div className="text-center p-6 glass-strong rounded-xl">
							<div className="h1 text-primary mb-2">500+</div>
							<p className="text-secondary font-semibold">Active Partners</p>
							<p className="text-xs text-tertiary mt-1">
								Institutions & individuals
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Values */}
			<section className="mb-16">
				<h2 className="h2 text-center mb-12">Our Values</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="glass p-6 rounded-xl">
						<h3 className="h3 mb-4 text-primary">Transparency</h3>
						<p className="text-secondary">
							We believe in complete transparency with our partners. All fees,
							performance metrics, and investment strategies are clearly
							communicated and regularly reported.
						</p>
					</div>
					<div className="glass p-6 rounded-xl">
						<h3 className="h3 mb-4 text-primary">Excellence</h3>
						<p className="text-secondary">
							We strive for excellence in everything we do, from research and
							analysis to client service and technology innovation.
						</p>
					</div>
					<div className="glass p-6 rounded-xl">
						<h3 className="h3 mb-4 text-primary">Integrity</h3>
						<p className="text-secondary">
							We operate with the highest ethical standards, always putting our
							partners' interests first and maintaining fiduciary
							responsibility.
						</p>
					</div>
					<div className="glass p-6 rounded-xl">
						<h3 className="h3 mb-4 text-primary">Innovation</h3>
						<p className="text-secondary">
							We continuously innovate our investment processes and technology
							to stay ahead of market changes and deliver superior results.
						</p>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="text-center glass p-12 rounded-xl">
				<h2 className="h2 mb-4">Partner With Us</h2>
				<p className="body-large text-secondary mb-8 max-w-3xl mx-auto">
					Join our exclusive partnership and benefit from institutional-grade
					investment management, advanced analytics, and personalized service.
				</p>
				<div className="flex flex-col sm:flex-row gap-4 justify-center">
					<a href="/contact" className="btn btn-primary">
						Schedule a Consultation
					</a>
					<a href="/screener" className="btn btn-glass">
						Explore Our Tools
					</a>
				</div>
			</section>
		</div>
	);
};

export default AboutPage;
