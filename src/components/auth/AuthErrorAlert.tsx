import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * A destructive alert with the message of a failed sign-in step. Renders
 * nothing when `message` is `null`.
 */
export function AuthErrorAlert({ message }: { message: string | null }) {
	if (!message) {
		return null;
	}
	return (
		<Alert variant="destructive">
			<AlertDescription>{message}</AlertDescription>
		</Alert>
	);
}
