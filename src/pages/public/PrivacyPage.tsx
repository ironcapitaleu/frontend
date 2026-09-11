import { Link } from "react-router";

import { Heading } from "@/components/ui/heading";
import { Container, Section } from "@/components/ui/section";
import { Text, TextLink } from "@/components/ui/text";

function HeroSection() {
	return (
		<Section spacing="lg" divider="bottom" className="text-center">
			<Container className="flex flex-col gap-3">
				<Heading level={1} variant="page">
					Privacy Policy
				</Heading>
				<Text font="sans" size="sm">
					Last updated: 18 March 2026
				</Text>
			</Container>
		</Section>
	);
}

function WhoWeAreSection() {
	return (
		<Section divider="top">
			<Container className="flex flex-col gap-6">
				<Heading variant="section">Who We Are</Heading>
				<Text>
					Iron Capital is the data controller responsible for the personal data
					you provide through this website. We are based in Zürich, Switzerland.
					You can reach us at{" "}
					<TextLink href="mailto:contact@ironcapital.eu">
						contact@ironcapital.eu
					</TextLink>
					.
				</Text>
			</Container>
		</Section>
	);
}

function DataWeCollectSection() {
	return (
		<Section divider="top">
			<Container className="flex flex-col gap-6">
				<Heading variant="section">Data We Collect</Heading>
				<Text>
					When you submit our{" "}
					<TextLink render={<Link to="/contact" />}>contact form</TextLink>, we
					collect the following personal data:
				</Text>
				<Text render={<ul />} className="list-disc pl-5 flex flex-col gap-2">
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
				</Text>
				<Text>
					We do not collect any personal data through other sections of this
					website unless you explicitly provide it.
				</Text>
			</Container>
		</Section>
	);
}

function PurposeSection() {
	return (
		<Section divider="top">
			<Container className="flex flex-col gap-6">
				<Heading variant="section">Purpose & Legal Basis</Heading>
				<Text>
					We process your data solely to respond to your inquiry. The legal
					basis for this processing is your explicit consent, given when you
					check the consent checkbox on the contact form (Art. 6(1)(a) GDPR and
					nDSG Art. 31).
				</Text>
				<Text>
					You may withdraw your consent at any time by contacting us at{" "}
					<TextLink href="mailto:contact@ironcapital.eu">
						contact@ironcapital.eu
					</TextLink>
					. Withdrawal does not affect the lawfulness of any processing carried
					out before the withdrawal.
				</Text>
			</Container>
		</Section>
	);
}

function ThirdPartyProcessorsSection() {
	return (
		<Section divider="top">
			<Container className="flex flex-col gap-6">
				<Heading variant="section">Third-Party Processors</Heading>
				<Text>
					We use the following third-party services to operate the contact form:
				</Text>
				<div className="flex flex-col gap-5">
					<div className="flex flex-col gap-2">
						<Heading level={3} variant="subsection">
							Resend
						</Heading>
						<Text size="sm">
							We use{" "}
							<TextLink
								href="https://resend.com"
								target="_blank"
								rel="noopener noreferrer"
							>
								Resend
							</TextLink>{" "}
							to deliver your message to our inbox. Your name, email address,
							and message are transmitted to Resend's servers. Resend processes
							data under standard contractual clauses (SCCs) where applicable.
							See the{" "}
							<TextLink
								href="https://resend.com/legal/privacy-policy"
								target="_blank"
								rel="noopener noreferrer"
							>
								Resend Privacy Policy
							</TextLink>{" "}
							for full details.
						</Text>
					</div>
					<div className="flex flex-col gap-2">
						<Heading level={3} variant="subsection">
							Cloudflare Turnstile
						</Heading>
						<Text size="sm">
							We use{" "}
							<TextLink
								href="https://www.cloudflare.com/products/turnstile/"
								target="_blank"
								rel="noopener noreferrer"
							>
								Cloudflare Turnstile
							</TextLink>{" "}
							to protect the contact form from automated submissions. Turnstile
							may process your IP address and browser signals (user agent,
							interaction patterns) for bot detection purposes. No CAPTCHA image
							is shown. Turnstile does not have access to your name, email, or
							message content. Cloudflare's own retention practices are governed
							by the{" "}
							<TextLink
								href="https://www.cloudflare.com/privacypolicy/"
								target="_blank"
								rel="noopener noreferrer"
							>
								Cloudflare Privacy Policy
							</TextLink>
							, which we do not control.
						</Text>
					</div>
				</div>
			</Container>
		</Section>
	);
}

function RetentionSection() {
	return (
		<Section divider="top">
			<Container className="flex flex-col gap-6">
				<Heading variant="section">Data Retention</Heading>
				<Text>
					We retain the personal data you submit through the contact form for a
					maximum of{" "}
					<strong className="text-foreground font-medium">90 days</strong> from
					the date of submission. After this period, we permanently delete the
					data from our systems (inbox and any copies). This period covers the
					data that Iron Capital directly holds. Third-party processors listed
					above retain data according to their own policies, which we do not
					control.
				</Text>
			</Container>
		</Section>
	);
}

function YourRightsSection() {
	return (
		<Section divider="top">
			<Container className="flex flex-col gap-6">
				<Heading variant="section">Your Rights</Heading>
				<Text>
					Under the GDPR and the Swiss Federal Act on Data Protection (nDSG),
					you have the following rights regarding your personal data:
				</Text>
				<Text render={<ul />} className="list-disc pl-5 flex flex-col gap-2">
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
						<TextLink
							href="https://www.edoeb.admin.ch"
							target="_blank"
							rel="noopener noreferrer"
						>
							FDPIC
						</TextLink>
						) or your local EU supervisory authority.
					</li>
				</Text>
			</Container>
		</Section>
	);
}

function ContactSection() {
	return (
		<Section divider="top">
			<Container className="flex flex-col gap-6">
				<Heading variant="section">Contact Us</Heading>
				<Text>
					For any questions about this Privacy Policy or to exercise your data
					rights, please contact us at{" "}
					<TextLink href="mailto:contact@ironcapital.eu">
						contact@ironcapital.eu
					</TextLink>
					.
				</Text>
			</Container>
		</Section>
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
