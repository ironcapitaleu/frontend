import { Route, Routes } from "react-router";

import Layout from "./components/Layout";
import CompanyPage from "./pages/company/CompanyPage";
import AboutPage from "./pages/public/AboutPage";
import CompanySearch from "./pages/public/CompanySearch";
import ContactPage from "./pages/public/ContactPage";
import HomePage from "./pages/public/HomePage";
import LoginPage from "./pages/internal/LoginPage";
import NotFoundPage from "./pages/internal/NotFoundPage";
import PrivacyPage from "./pages/public/PrivacyPage";
import SitemapPage from "./pages/public/SitemapPage";
import StockScreener from "./pages/public/StockScreener";

/**
 * The application's route table.
 *
 * Why no router or providers here? They are supplied by the host — `main.tsx` in
 * production (`AuthProvider`, `CompanyGatewayProvider` and `BrowserRouter`) and
 * the custom test `render` (the same providers with a `MemoryRouter`) — so `App`
 * can be mounted on any route with an injected auth gateway and company gateway.
 */
function App() {
	return (
		<Routes>
			<Route path="/" element={<Layout />}>
				<Route index element={<HomePage />} />
				<Route path="/search" element={<CompanySearch />} />
				<Route path="/contact" element={<ContactPage />} />
				<Route path="/login" element={<LoginPage />} />
				<Route path="/about" element={<AboutPage />} />
				<Route path="/privacy" element={<PrivacyPage />} />
				<Route path="/sitemap" element={<SitemapPage />} />
				<Route path="/screener" element={<StockScreener />} />
				<Route path="/companies/:symbol" element={<CompanyPage />} />
				<Route path="/companies/:symbol/:tab" element={<CompanyPage />} />
				<Route path="*" element={<NotFoundPage />} />
			</Route>
		</Routes>
	);
}

export default App;
