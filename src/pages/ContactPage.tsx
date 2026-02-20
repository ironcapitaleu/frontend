import { useState } from "react";

import { CheckCircle, Mail, MapPin, Phone } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface ContactForm {
	name: string;
	email: string;
	company: string;
	phone: string;
	message: string;
}

interface ContactInfoProps {
	icon: React.ReactNode;
	title: string;
	content: string;
}

function ContactInfo({ icon, title, content }: ContactInfoProps) {
	return (
		<div>
			{icon}
			<div>
				<p>{title}</p>
				<p>{content}</p>
			</div>
		</div>
	);
}

function SuccessMessage({ onReset }: { onReset: () => void }) {
	return (
		<Card>
			<CardHeader>
				<CheckCircle />
				<CardTitle>Thank You!</CardTitle>
				<CardDescription>
					We've received your inquiry and will be in touch within 24 hours. Our
					team will review your information and prepare a customized
					consultation.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button onClick={onReset}>Send Another Message</Button>
			</CardContent>
		</Card>
	);
}

function ContactPage() {
	const [form, setForm] = useState<ContactForm>({
		name: "",
		email: "",
		company: "",
		phone: "",
		message: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setForm((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);

		try {
			// Simulate form submission
			await new Promise((resolve) => setTimeout(resolve, 2000));
			setIsSubmitted(true);
		} catch (_err) {
			setError("Failed to send message. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetForm = () => {
		setIsSubmitted(false);
		setForm({
			name: "",
			email: "",
			company: "",
			phone: "",
			message: "",
		});
	};

	if (isSubmitted) {
		return (
			<main>
				<SuccessMessage onReset={resetForm} />
			</main>
		);
	}

	return (
		<main>
			<section>
				<h1>Contact Iron Capital</h1>
				<p>
					Ready to start your investment journey? Get in touch with our team to
					discuss how we can help you achieve your financial goals.
				</p>
			</section>

			<Separator />

			<section>
				<Card>
					<CardHeader>
						<CardTitle>Get Started Today</CardTitle>
						<CardDescription>
							Fill out the form below and we'll get back to you within 24 hours.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit}>
							<div>
								<Label htmlFor="name">Full Name</Label>
								<Input
									id="name"
									name="name"
									type="text"
									required
									placeholder="Your full name"
									value={form.name}
									onChange={handleChange}
								/>
							</div>

							<div>
								<Label htmlFor="email">Email Address</Label>
								<Input
									id="email"
									name="email"
									type="email"
									required
									placeholder="you@example.com"
									value={form.email}
									onChange={handleChange}
								/>
							</div>

							<div>
								<Label htmlFor="company">Company (Optional)</Label>
								<Input
									id="company"
									name="company"
									type="text"
									placeholder="Your company name"
									value={form.company}
									onChange={handleChange}
								/>
							</div>

							<div>
								<Label htmlFor="phone">Phone Number (Optional)</Label>
								<Input
									id="phone"
									name="phone"
									type="tel"
									placeholder="+1 (555) 123-4567"
									value={form.phone}
									onChange={handleChange}
								/>
							</div>

							<div>
								<Label htmlFor="message">Message</Label>
								<Textarea
									id="message"
									name="message"
									placeholder="Tell us about your investment goals..."
									value={form.message}
									onChange={handleChange}
								/>
							</div>

							{error && (
								<Alert variant="destructive">
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							<Button
								type="submit"
								disabled={isSubmitting || !form.name || !form.email}
							>
								{isSubmitting ? "Sending..." : "Send Message"}
							</Button>
						</form>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Contact Information</CardTitle>
					</CardHeader>
					<CardContent>
						<ContactInfo
							icon={<MapPin />}
							title="Address"
							content="Bahnhofstrasse 10, 8001 Zürich, Switzerland"
						/>
						<ContactInfo
							icon={<Phone />}
							title="Phone"
							content="+41 44 123 4567"
						/>
						<ContactInfo
							icon={<Mail />}
							title="Email"
							content="partners@ironcapital.ch"
						/>
					</CardContent>
				</Card>
			</section>
		</main>
	);
}

export default ContactPage;
