import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import App from "./App.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error('Root element with id "root" not found in the HTML.');
}
createRoot(rootElement).render(
	<StrictMode>
		<ThemeProvider>
			<AuthProvider>
				<BrowserRouter>
					<App />
				</BrowserRouter>
			</AuthProvider>
		</ThemeProvider>
	</StrictMode>,
);
