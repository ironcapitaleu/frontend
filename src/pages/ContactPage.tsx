import React, { useState } from "react";

interface ContactForm {
	name: string;
	email: string;
	company: string;
	phone: string;
	investmentAmount: string;
	message: string;
	newsletter: boolean;
}

const ContactPage: React.FC = () => {
	const [form, setForm] = useState<ContactForm>({
		name: "",
		email: "",
		company: "",
		phone: "",
		investmentAmount: "",
		message: "",
		newsletter: false,
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value, type } = e.target;
		setForm((prev) => ({
			...prev,
			[name]:
				type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		// Simulate form submission
		await new Promise((resolve) => setTimeout(resolve, 2000));

		setIsSubmitting(false);
		setIsSubmitted(true);
	};

	if (isSubmitted) {
		return (
			<div className="container py-8">
				<div className="max-w-2xl mx-auto text-center">
					<div className="glass p-12 rounded-xl fade-in">
						<div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
							<svg
								className="w-8 h-8 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<h1 className="h1 mb-4">Thank You!</h1>
						<p className="body-large text-secondary mb-8">
							We've received your inquiry and will be in touch within 24 hours.
							Our team will review your information and prepare a customized
							consultation.
						</p>
						<button
							onClick={() => {
								setIsSubmitted(false);
								setForm({
									name: "",
									email: "",
									company: "",
									phone: "",
									investmentAmount: "",
									message: "",
									newsletter: false,
								});
							}}
							className="btn btn-primary"
						>
							Send Another Message
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container py-8">
			{/* Hero Section */}
			<div className="text-center mb-12 fade-in">
				<h1 className="h1 mb-6">Contact Iron Capital</h1>
				<p className="body-large text-secondary max-w-3xl mx-auto">
					Ready to start your investment journey? Get in touch with our team to
					discuss how we can help you achieve your financial goals.
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Contact Form */}
				<div className="lg:col-span-2">
					<form
						onSubmit={handleSubmit}
						className="glass p-8 rounded-xl slide-up"
					>
						<h2 className="h2 mb-6">Get Started Today</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
							<div>
								<label
									htmlFor="name"
									className="block text-sm font-semibold mb-2"
								>
									Full Name *
								</label>
								<input
									type="text"
									id="name"
									name="name"
									required
									className="input"
									placeholder="Your full name"
									value={form.name}
									onChange={handleChange}
								/>
							</div>
							<div>
								<label
									htmlFor="email"
									className="block text-sm font-semibold mb-2"
								>
									Email Address *
								</label>
								<input
									type="email"
									id="email"
									name="email"
									required
									className="input"
									placeholder="your.email@example.com"
									value={form.email}
									onChange={handleChange}
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
							<div>
								<label
									htmlFor="company"
									className="block text-sm font-semibold mb-2"
								>
									Company (Optional)
								</label>
								<input
									type="text"
									id="company"
									name="company"
									className="input"
									placeholder="Your company name"
									value={form.company}
									onChange={handleChange}
								/>
							</div>
							<div>
								<label
									htmlFor="phone"
									className="block text-sm font-semibold mb-2"
								>
									Phone Number
								</label>
								<input
									type="tel"
									id="phone"
									name="phone"
									className="input"
									placeholder="+1 (555) 123-4567"
									value={form.phone}
									onChange={handleChange}
								/>
							</div>
						</div>

						<div className="mb-6">
							<label
								htmlFor="investmentAmount"
								className="block text-sm font-semibold mb-2"
							>
								Intended Investment Amount
							</label>
							<select
								id="investmentAmount"
								name="investmentAmount"
								className="input"
								value={form.investmentAmount}
								onChange={handleChange}
							>
								<option value="">Select range</option>
								<option value="50k-250k">€50,000 - €250,000</option>
								<option value="250k-500k">€250,000 - €500,000</option>
								<option value="500k-1m">€500,000 - €1,000,000</option>
								<option value="1m-5m">€1,000,000 - €5,000,000</option>
								<option value="5m+">€5,000,000+</option>
							</select>
						</div>

						<div className="mb-6">
							<label
								htmlFor="message"
								className="block text-sm font-semibold mb-2"
							>
								Message
							</label>
							<textarea
								id="message"
								name="message"
								rows={6}
								className="input resize-y"
								placeholder="Tell us about your investment goals and any questions you have..."
								value={form.message}
								onChange={handleChange}
							></textarea>
						</div>

						<div className="mb-6">
							<label className="flex items-center gap-3">
								<input
									type="checkbox"
									name="newsletter"
									className="w-4 h-4 rounded border-glass-border bg-glass-bg"
									checked={form.newsletter}
									onChange={handleChange}
								/>
								<span className="text-sm text-secondary">
									I would like to receive market insights and investment updates
								</span>
							</label>
						</div>

						<button
							type="submit"
							disabled={isSubmitting || !form.name || !form.email}
							className="btn btn-primary w-full"
						>
							{isSubmitting ? (
								<div className="flex items-center gap-2">
									<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									Sending...
								</div>
							) : (
								"Send Message"
							)}
						</button>

						<p className="text-xs text-tertiary mt-4">
							By submitting this form, you agree to our privacy policy and terms
							of service. We will only use your information to respond to your
							inquiry.
						</p>
					</form>
				</div>

				{/* Contact Information */}
				<div className="space-y-6">
					{/* Office Info */}
					<div className="glass p-6 rounded-xl">
						<h3 className="h3 mb-4">European Headquarters</h3>
						<div className="space-y-4">
							<div className="flex items-start gap-3">
								<div className="w-6 h-6 mt-1">
									<svg
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										className="text-primary"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
										/>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
										/>
									</svg>
								</div>
								<div>
									<p className="font-semibold text-primary">Address</p>
									<p className="text-secondary">
										Bahnhofstrasse 45
										<br />
										8001 Zurich, Switzerland
									</p>
								</div>
							</div>

							<div className="flex items-start gap-3">
								<div className="w-6 h-6 mt-1">
									<svg
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										className="text-primary"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
										/>
									</svg>
								</div>
								<div>
									<p className="font-semibold text-primary">Phone</p>
									<p className="text-secondary">+41 44 123 4567</p>
								</div>
							</div>

							<div className="flex items-start gap-3">
								<div className="w-6 h-6 mt-1">
									<svg
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										className="text-primary"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
										/>
									</svg>
								</div>
								<div>
									<p className="font-semibold text-primary">Email</p>
									<p className="text-secondary">contact@ironcapital.eu</p>
								</div>
							</div>
						</div>
					</div>

					{/* Business Hours */}
					<div className="glass p-6 rounded-xl">
						<h3 className="h3 mb-4">Business Hours</h3>
						<div className="space-y-2">
							<div className="flex justify-between">
								<span className="text-secondary">Monday - Friday</span>
								<span className="text-primary font-semibold">9:00 - 18:00</span>
							</div>
							<div className="flex justify-between">
								<span className="text-secondary">Saturday</span>
								<span className="text-primary font-semibold">
									10:00 - 14:00
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-secondary">Sunday</span>
								<span className="text-tertiary">Closed</span>
							</div>
						</div>
						<p className="text-xs text-tertiary mt-4">
							CET/CEST timezone. Emergency contact available 24/7 for existing
							partners.
						</p>
					</div>

					{/* Quick Links */}
					<div className="glass p-6 rounded-xl">
						<h3 className="h3 mb-4">Quick Actions</h3>
						<div className="space-y-3">
							<a href="/screener" className="btn btn-glass w-full text-left">
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									/>
								</svg>
								Try Stock Screener
							</a>
							<a href="/search" className="btn btn-glass w-full text-left">
								<svg
									className="w-5 h-5"
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
								Company Research
							</a>
							<a href="/about" className="btn btn-glass w-full text-left">
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								Learn More About Us
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ContactPage;
