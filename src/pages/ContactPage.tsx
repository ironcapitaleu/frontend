import type React from "react";
import { useRef, useState } from "react";

import { Turnstile } from "@marsidev/react-turnstile";
import type { TurnstileInstance } from "@marsidev/react-turnstile";
import { Mail, MapPin, Send } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogAction,
} from "@/components/ui/alert-dialog";
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
	privacyConsent: boolean;
}

const SUBJECTS = ["General", "Technical"] as const;

function ContactForm() {
	const [form, setForm] = useState<ContactFormState>({
		fullName: "",
		email: "",
		subject: "",
		message: "",
		privacyConsent: false,
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const [errors, setErrors] = useState<{
		fullName?: string;
		email?: string;
		subject?: string;
		message?: string;
		privacyConsent?: string;
	}>({});
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
	const turnstileRef = useRef<TurnstileInstance>(null);
	const [isShaking, setIsShaking] = useState(false);

	const triggerShake = () => {
		setIsShaking(true);
		setTimeout(() => setIsShaking(false), 400); // 400ms matches the CSS animation duration
	};

	const isValidEmail = (value: string) =>
		/^[^\s@.]([^\s@]*[^\s@.])?@[^\s@]+\.[a-zA-Z]{2,}$/.test(value);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
		if (errors[name as keyof typeof errors]) {
			setErrors((prev) => ({ ...prev, [name]: undefined }));
		}
	};

	const handleBlur = (
		field: Exclude<keyof ContactFormState, "privacyConsent">,
	) => {
		if (!hasAttemptedSubmit) return;

		if (!form[field]?.trim()) {
			const emptyMessages: Record<
				Exclude<keyof ContactFormState, "privacyConsent">,
				string
			> = {
				fullName: "Please enter your full name.",
				email: "Please enter your email.",
				subject: "Please select a subject.",
				message: "Please enter a message.",
			};
			setErrors((prev) => ({
				...prev,
				[field]: emptyMessages[field],
			}));
		} else if (field === "email" && !isValidEmail(form.email)) {
			setErrors((prev) => ({
				...prev,
				email: "Please enter a valid email address.",
			}));
		} else if (field === "message" && form.message.trim().length < 10) {
			setErrors((prev) => ({
				...prev,
				message: "Message must be at least 10 characters.",
			}));
		} else {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		setHasAttemptedSubmit(true);

		const newErrors: typeof errors = {};

		if (!form.fullName.trim())
			newErrors.fullName = "Please enter your full name.";

		if (!form.email.trim()) newErrors.email = "Please enter your email.";
		else if (!isValidEmail(form.email))
			newErrors.email = "Please enter a valid email address.";

		if (!form.subject?.trim()) newErrors.subject = "Please select a subject.";

		if (!form.message.trim()) newErrors.message = "Please enter a message.";
		else if (form.message.trim().length < 10)
			newErrors.message = "Message must be at least 10 characters.";

		if (!form.privacyConsent)
			newErrors.privacyConsent =
				"Please accept the Privacy Policy to continue.";

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			triggerShake();
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

	const handleReset = () => {
		setIsSubmitted(false);
		setForm({
			fullName: "",
			email: "",
			subject: "",
			message: "",
			privacyConsent: false,
		});
		setErrors({});
		setHasAttemptedSubmit(false);
		setTurnstileToken(null);
		turnstileRef.current?.reset();
	};

	return (
		<>
			<form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
					<div className="flex flex-col gap-2">
						<Label htmlFor="fullName">Full Name</Label>
						<Input
							id="fullName"
							name="fullName"
							type="text"
							required
							placeholder="Full Name"
							value={form.fullName}
							onChange={handleChange}
							onBlur={() => handleBlur("fullName")}
							aria-invalid={!!errors.fullName}
							className={
								isShaking && errors.fullName ? "animate-shake-invalid" : ""
							}
						/>
						{errors.fullName && (
							<p className="text-xs text-destructive">{errors.fullName}</p>
						)}
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							name="email"
							type="email"
							required
							placeholder="name@example.com"
							value={form.email}
							onChange={handleChange}
							onBlur={() => handleBlur("email")}
							aria-invalid={!!errors.email}
							className={
								isShaking && errors.email ? "animate-shake-invalid" : ""
							}
						/>
						{errors.email && (
							<p className="text-xs text-destructive">{errors.email}</p>
						)}
					</div>
				</div>

				<div className="flex flex-col gap-2">
					<Label htmlFor="subject">Subject</Label>
					<Select
						value={form.subject || ""}
						onValueChange={(value) => {
							setForm((prev) => ({ ...prev, subject: value ?? "" }));
							if (errors.subject) {
								setErrors((prev) => ({ ...prev, subject: undefined }));
							}
						}}
					>
						<SelectTrigger
							id="subject"
							className={`w-full ${isShaking && errors.subject ? "animate-shake-invalid" : ""}`}
							aria-invalid={!!errors.subject}
							onBlur={() => handleBlur("subject")}
						>
							<SelectValue placeholder="Select a topic" />
						</SelectTrigger>
						<SelectContent>
							{SUBJECTS.map((item) => (
								<SelectItem key={item} value={item}>
									{item}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{errors.subject && (
						<p className="text-xs text-destructive">{errors.subject}</p>
					)}
				</div>
				<div className="flex flex-col gap-2">
					<Label htmlFor="message">Message</Label>
					<Textarea
						id="message"
						name="message"
						rows={4}
						required
						placeholder="Provide details about your inquiry."
						value={form.message}
						onChange={handleChange}
						onBlur={() => handleBlur("message")}
						aria-invalid={!!errors.message}
						className={
							isShaking && errors.message ? "animate-shake-invalid" : ""
						}
					/>
					{errors.message && (
						<p className="text-xs text-destructive">{errors.message}</p>
					)}
				</div>

				<div className="hidden">
					<Turnstile
						ref={turnstileRef}
						siteKey={
							import.meta.env.VITE_TURNSTILE_SITE_KEY ??
							"1x00000000000000000000AA"
						}
						onSuccess={(token) => setTurnstileToken(token)}
						onExpire={() => setTurnstileToken(null)}
						onError={() => setTurnstileToken(null)}
					/>
				</div>

				<div
					className={`flex items-start gap-3 ${isShaking && errors.privacyConsent ? "animate-shake-invalid" : ""}`}
				>
					<input
						type="checkbox"
						id="privacyConsent"
						checked={form.privacyConsent}
						onChange={(e) => {
							setForm((prev) => ({
								...prev,
								privacyConsent: e.target.checked,
							}));
							if (e.target.checked) {
								setErrors((prev) => ({
									...prev,
									privacyConsent: undefined,
								}));
							}
						}}
						className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
						aria-invalid={!!errors.privacyConsent}
					/>
					<div className="flex flex-col gap-1">
						<label
							htmlFor="privacyConsent"
							className="text-sm text-muted-foreground cursor-pointer leading-snug"
						>
							I have read and accept the{" "}
							<Link
								to="/privacy"
								className="underline hover:text-foreground transition-colors"
							>
								Privacy Policy
							</Link>{" "}
							and consent to Iron Capital processing my data to handle this
							inquiry.
						</label>
						{errors.privacyConsent && (
							<p className="text-xs text-destructive">
								{errors.privacyConsent}
							</p>
						)}
					</div>
				</div>

				<div className="mt-2 w-full">
					<Button
						type="submit"
						disabled={isSubmitting || turnstileToken === null}
						className="w-full h-11 px-6 gap-2 text-base font-medium btn-tactile"
					>
						<Send size={18} />
						{isSubmitting ? "Sending..." : "Send message"}
					</Button>
				</div>
			</form>

			<AlertDialog
				open={isSubmitted}
				onOpenChange={(open) => {
					if (!open) handleReset();
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Message sent</AlertDialogTitle>
						<AlertDialogDescription>
							We'll be in touch with you soon.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction
							onClick={() => {
								handleReset();
							}}
							className="cursor-pointer"
						>
							Close
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

function ContactPage() {
	return (
		<div className="flex-1 bg-background">
			<div className="max-w-6xl mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
				<div className="flex flex-col gap-10">
					<div className="flex flex-col gap-4">
						<h1 className="font-classic text-4xl md:text-5xl font-semibold text-foreground leading-tight">
							Get in touch
						</h1>
						<p className="text-muted-foreground text-base leading-relaxed max-w-sm">
							Connect with our team for questions about our tools. We typically
							respond within 24 hours.
						</p>
					</div>

					<div className="flex flex-col gap-4">
						<ContactDetail
							icon={<MapPin size={18} />}
							value="Zürich, Switzerland"
						/>
						<ContactDetail
							icon={<Mail size={18} />}
							value="contact@ironcapital.eu"
						/>
					</div>
				</div>

				<ContactForm />
			</div>
		</div>
	);
}

export default ContactPage;
