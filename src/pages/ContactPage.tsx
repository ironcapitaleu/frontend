import type React from "react";
import { useState } from "react";

import { Turnstile } from "@marsidev/react-turnstile";
import { Mail, MapPin, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ContactDetailProps {
	icon: React.ReactNode;
	value: string;
}

function ContactDetail({ icon, value }: ContactDetailProps) {
	return (
		<div className="flex items-center gap-3">
			<span className="text-muted-foreground">{icon}</span>
			<span className="text-sm text-muted-foreground">{value}</span>
		</div>
	);
}

interface ContactFormState {
	fullName: string;
	email: string;
	subject: string;
	message: string;
}

function ContactForm() {
	const [form, setForm] = useState<ContactFormState>({
		fullName: "",
		email: "",
		subject: "",
		message: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [emailError, setEmailError] = useState<string | null>(null);
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

	const isValidEmail = (value: string) =>
		/^[^\s@.]([^\s@]*[^\s@.])?@[^\s@]+\.[a-zA-Z]{2,}$/.test(value);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleEmailBlur = () => {
		setEmailError(
			form.email && !isValidEmail(form.email)
				? "Please enter a valid email address."
				: null,
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isValidEmail(form.email)) {
			setEmailError("Please enter a valid email address.");
			return;
		}
		setIsSubmitting(true);

		try {
			// TODO: wire up to third-party service (Resend, Formspree, EmailJS)
			// TODO: [SECURITY] Send `turnstileToken` in the payload and verify server-side via
			//   POST https://challenges.cloudflare.com/turnstile/v0/siteverify
			//   with your secret key — client-side token presence alone is NOT sufficient protection.
			await new Promise((resolve) => setTimeout(resolve, 1500));
			setIsSubmitted(true);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isSubmitted) {
		return (
			<div className="flex flex-col gap-4 py-12">
				<h3 className="text-xl font-semibold text-foreground">
					Message sent.
				</h3>
				<p className="text-sm text-muted-foreground">
					We'll be in touch within 24 hours.
				</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-6">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
				<div className="flex flex-col gap-2">
					<Label htmlFor="fullName">Full Name</Label>
					<Input
						id="fullName"
						name="fullName"
						type="text"
						required
						placeholder="Jane Doe"
						value={form.fullName}
						onChange={handleChange}
					/>
				</div>
				<div className="flex flex-col gap-2">
					<Label htmlFor="email">Email</Label>
					<Input
						id="email"
						name="email"
						type="email"
						required
						placeholder="jane@company.com"
						value={form.email}
						onChange={handleChange}
						onBlur={handleEmailBlur}
						aria-invalid={emailError !== null}
					/>
					{emailError && (
						<p className="text-xs text-destructive">{emailError}</p>
					)}
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="subject">Subject</Label>
				<Select
					value={form.subject}
					onValueChange={(value) =>
						setForm((prev) => ({ ...prev, subject: value ?? "" }))
					}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select a topic" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="investment-inquiry">
							Investment Inquiry
						</SelectItem>
						<SelectItem value="api-support">API Support</SelectItem>
						<SelectItem value="general">General</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="message">Message</Label>
				<Textarea
					id="message"
					name="message"
					rows={5}
					required
					placeholder="How can we help?"
					value={form.message}
					onChange={handleChange}
				/>
			</div>

			<div className="hidden">
				<Turnstile
					siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA"}
					onSuccess={(token) => setTurnstileToken(token)}
					onExpire={() => setTurnstileToken(null)}
					onError={() => setTurnstileToken(null)}
				/>
			</div>

			<div className="flex justify-end">
				<Button type="submit" disabled={isSubmitting || turnstileToken === null}>
					{isSubmitting ? "Sending..." : "Send message"}
				</Button>
			</div>
		</form>
	);
}

function ContactPage() {
	return (
		<div className="flex-1 bg-background">
			<div className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
				<div className="flex flex-col gap-10">
					<div className="flex flex-col gap-4">
						<h1 className="font-classic text-4xl md:text-5xl font-semibold text-foreground leading-tight">
							Get in touch
						</h1>
						<p className="text-muted-foreground text-base leading-relaxed max-w-sm">
							Have a question about our screener or API? Fill out the form and
							our team will get back to you within 24 hours.
						</p>
					</div>

					<div className="flex flex-col gap-4">
						<ContactDetail
							icon={<MapPin size={18} />}
							value="Zürich, Switzerland"
						/>
						<ContactDetail
							icon={<Phone size={18} />}
							value="+41 44 123 4567"
						/>
						<ContactDetail
							icon={<Mail size={18} />}
							value="hello@ironcapital.com"
						/>
					</div>
				</div>

				<ContactForm />
			</div>
		</div>
	);
}

export default ContactPage;
