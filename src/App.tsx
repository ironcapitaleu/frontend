import { Route, Routes } from "react-router";

import Layout from "./components/Layout";
import AboutPage from "./pages/AboutPage";
import CompanySearch from "./pages/CompanySearch";
import ContactPage from "./pages/ContactPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import PrivacyPage from "./pages/PrivacyPage";
import PrivateDatabasePage from "./pages/PrivateDatabasePage";
import SitemapPage from "./pages/SitemapPage";
import StockScreener from "./pages/StockScreener";

/**
 * The application's route table.
 *
 * Why no router or providers here? They are supplied by the host — `main.tsx` in
 * production (`AuthProvider` + `BrowserRouter`) and the custom test `render`
 * (`AuthProvider` + `MemoryRouter`) — so `App` can be mounted on any route with
 * an injected auth gateway.
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
				<Route path="/private" element={<PrivateDatabasePage />} />
				<Route path="/privacy" element={<PrivacyPage />} />
				<Route path="/sitemap" element={<SitemapPage />} />
				<Route path="/screener" element={<StockScreener />} />
				<Route path="*" element={<NotFoundPage />} />
			</Route>
		</Routes>
	);
}

export default App;
