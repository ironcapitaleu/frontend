import { Link } from "react-router-dom";

function HeroSection() {
	return (
		<section className="flex flex-col items-center justify-center px-6 py-20 border-b border-border/50 text-center">
			<div className="max-w-prose flex flex-col gap-3">
				<h1 className="font-classic font-semibold text-4xl md:text-5xl text-foreground">
					Privacy Policy
				</h1>
				<p className="text-sm text-muted-foreground">
					Last updated: 18 March 2026
				</p>
			</div>
		</section>
	);
}

function WhoWeAreSection() {
	return (
		<section className="flex flex-col items-center px-6 py-16 border-t border-border/50">
			<div className="max-w-prose flex flex-col gap-6 w-full">
				<h2 className="font-classic font-semibold text-2xl text-foreground">
					Who We Are
				</h2>
				<p className="font-classic text-muted-foreground leading-relaxed">
					Iron Capital is the data controller responsible for the personal data
					you provide through this website. We are based in Zürich, Switzerland.
					You can reach us at{" "}
					<a
						href="mailto:contact@ironcapital.eu"
						className="underline hover:text-foreground transition-colors"
					>
						contact@ironcapital.eu
					</a>
					.
				</p>
			</div>
		</section>
	);
}

function DataWeCollectSection() {
	return (
		<section className="flex flex-col items-center px-6 py-16 border-t border-border/50">
			<div className="max-w-prose flex flex-col gap-6 w-full">
				<h2 className="font-classic font-semibold text-2xl text-foreground">
					Data We Collect
				</h2>
				<p className="font-classic text-muted-foreground leading-relaxed">
					When you submit our{" "}
					<Link
						to="/contact"
						className="underline hover:text-foreground transition-colors"
					>
						contact form
					</Link>
					, we collect the following personal data:
				</p>
				<ul className="font-classic text-muted-foreground leading-relaxed list-disc pl-5 flex flex-col gap-2">
					<li>
						<strong className="text-foreground font-medium">Full name</strong> —
						to address you by name in our reply.
					</li>
					<li>
						<strong className="text-foreground font-medium">
							Email address
						</strong>{" "}
						— to send you a response.
					</li>
					<li>
						<strong className="text-foreground font-medium">
							Message content
						</strong>{" "}
						— the subject and body of your inquiry.
					</li>
				</ul>
				<p className="font-classic text-muted-foreground leading-relaxed">
					We do not collect any personal data through other sections of this
					website unless you explicitly provide it.
				</p>
			</div>
		</section>
	);
}

function PurposeSection() {
	return (
		<section className="flex flex-col items-center px-6 py-16 border-t border-border/50">
			<div className="max-w-prose flex flex-col gap-6 w-full">
				<h2 className="font-classic font-semibold text-2xl text-foreground">
					Purpose & Legal Basis
				</h2>
				<p className="font-classic text-muted-foreground leading-relaxed">
					We process your data solely to respond to your inquiry. The legal
					basis for this processing is your explicit consent, given when you
					check the consent checkbox on the contact form (Art. 6(1)(a) GDPR and
					nDSG Art. 31).
				</p>
				<p className="font-classic text-muted-foreground leading-relaxed">
					You may withdraw your consent at any time by contacting us at{" "}
					<a
						href="mailto:contact@ironcapital.eu"
						className="underline hover:text-foreground transition-colors"
					>
						contact@ironcapital.eu
					</a>
					. Withdrawal does not affect the lawfulness of any processing carried
					out before the withdrawal.
				</p>
			</div>
		</section>
	);
}

function ThirdPartyProcessorsSection() {
	return (
		<section className="flex flex-col items-center px-6 py-16 border-t border-border/50">
			<div className="max-w-prose flex flex-col gap-6 w-full">
				<h2 className="font-classic font-semibold text-2xl text-foreground">
					Third-Party Processors
				</h2>
				<p className="font-classic text-muted-foreground leading-relaxed">
					We use the following third-party services to operate the contact form:
				</p>
				<div className="flex flex-col gap-5">
					<div className="flex flex-col gap-2">
						<h3 className="font-classic font-medium text-foreground">Resend</h3>
						<p className="font-classic text-sm text-muted-foreground leading-relaxed">
							We use{" "}
							<a
								href="https://resend.com"
								target="_blank"
								rel="noopener noreferrer"
								className="underline hover:text-foreground transition-colors"
							>
								Resend
							</a>{" "}
							to deliver your message to our inbox. Your name, email address,
							and message are transmitted to Resend's servers. Resend processes
							data under standard contractual clauses (SCCs) where applicable.
							See the{" "}
							<a
								href="https://resend.com/legal/privacy-policy"
								target="_blank"
								rel="noopener noreferrer"
								className="underline hover:text-foreground transition-colors"
							>
								Resend Privacy Policy
							</a>{" "}
							for full details.
						</p>
					</div>
					<div className="flex flex-col gap-2">
						<h3 className="font-classic font-medium text-foreground">
							Cloudflare Turnstile
						</h3>
						<p className="font-classic text-sm text-muted-foreground leading-relaxed">
							We use{" "}
							<a
								href="https://www.cloudflare.com/products/turnstile/"
								target="_blank"
								rel="noopener noreferrer"
								className="underline hover:text-foreground transition-colors"
							>
								Cloudflare Turnstile
							</a>{" "}
							to protect the contact form from automated submissions. Turnstile
							may process your IP address and browser signals (user agent,
							interaction patterns) for bot detection purposes. No CAPTCHA image
							is shown. See the{" "}
							<a
								href="https://www.cloudflare.com/privacypolicy/"
								target="_blank"
								rel="noopener noreferrer"
								className="underline hover:text-foreground transition-colors"
							>
								Cloudflare Privacy Policy
							</a>{" "}
							for full details.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}

function RetentionSection() {
	return (
		<section className="flex flex-col items-center px-6 py-16 border-t border-border/50">
			<div className="max-w-prose flex flex-col gap-6 w-full">
				<h2 className="font-classic font-semibold text-2xl text-foreground">
					Data Retention
				</h2>
				<p className="font-classic text-muted-foreground leading-relaxed">
					We retain the personal data you submit through the contact form for a
					maximum of{" "}
					<strong className="text-foreground font-medium">6 months</strong> from
					the date of submission. After this period, your data is permanently
					deleted.
				</p>
			</div>
		</section>
	);
}

function YourRightsSection() {
	return (
		<section className="flex flex-col items-center px-6 py-16 border-t border-border/50">
			<div className="max-w-prose flex flex-col gap-6 w-full">
				<h2 className="font-classic font-semibold text-2xl text-foreground">
					Your Rights
				</h2>
				<p className="font-classic text-muted-foreground leading-relaxed">
					Under the GDPR and the Swiss Federal Act on Data Protection (nDSG),
					you have the following rights regarding your personal data:
				</p>
				<ul className="font-classic text-muted-foreground leading-relaxed list-disc pl-5 flex flex-col gap-2">
					<li>
						<strong className="text-foreground font-medium">Access</strong> —
						request a copy of the data we hold about you.
					</li>
					<li>
						<strong className="text-foreground font-medium">
							Rectification
						</strong>{" "}
						— ask us to correct inaccurate or incomplete data.
					</li>
					<li>
						<strong className="text-foreground font-medium">Erasure</strong> —
						request deletion of your data ("right to be forgotten").
					</li>
					<li>
						<strong className="text-foreground font-medium">Restriction</strong>{" "}
						— ask us to limit how we use your data.
					</li>
					<li>
						<strong className="text-foreground font-medium">Portability</strong>{" "}
						— receive your data in a structured, machine-readable format.
					</li>
					<li>
						<strong className="text-foreground font-medium">Objection</strong> —
						object to the processing of your data.
					</li>
					<li>
						<strong className="text-foreground font-medium">
							Lodge a complaint
						</strong>{" "}
						— file a complaint with the Swiss Federal Data Protection and
						Information Commissioner (
						<a
							href="https://www.edoeb.admin.ch"
							target="_blank"
							rel="noopener noreferrer"
							className="underline hover:text-foreground transition-colors"
						>
							FDPIC
						</a>
						) or your local EU supervisory authority.
					</li>
				</ul>
			</div>
		</section>
	);
}

function ContactSection() {
	return (
		<section className="flex flex-col items-center px-6 py-16 border-t border-border/50">
			<div className="max-w-prose flex flex-col gap-6 w-full">
				<h2 className="font-classic font-semibold text-2xl text-foreground">
					Contact Us
				</h2>
				<p className="font-classic text-muted-foreground leading-relaxed">
					For any questions about this Privacy Policy or to exercise your data
					rights, please contact us at{" "}
					<a
						href="mailto:contact@ironcapital.eu"
						className="underline hover:text-foreground transition-colors"
					>
						contact@ironcapital.eu
					</a>
					.
				</p>
			</div>
		</section>
	);
}

function PrivacyPage() {
	return (
		<>
			<HeroSection />
			<WhoWeAreSection />
			<DataWeCollectSection />
			<PurposeSection />
			<ThirdPartyProcessorsSection />
			<RetentionSection />
			<YourRightsSection />
			<ContactSection />
		</>
	);
}

export default PrivacyPage;
