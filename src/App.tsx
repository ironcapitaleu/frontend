import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import CompanySearch from "./pages/CompanySearch";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import PrivateDatabasePage from "./pages/PrivateDatabasePage";
import { AuthProvider } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import SitemapPage from "./pages/SitemapPage";

function App() {
	return (
		<AuthProvider>
			<Router>
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/" element={<Layout />}>
						<Route path="/search" element={<CompanySearch />} />
						<Route path="/contact" element={<ContactPage />} />
						<Route path="/login" element={<LoginPage />} />
						<Route path="/about" element={<AboutPage />} />
						<Route path="/private" element={<PrivateDatabasePage />} />
						<Route path="/sitemap" element={<SitemapPage />} />
						<Route path="*" element={<NotFoundPage />} />
					</Route>
				</Routes>
			</Router>
		</AuthProvider>
	);
}

export default App;
