import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import StockScreener from "./pages/StockScreener";
import CompanySearch from "./pages/CompanySearch";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import PrivateDatabasePage from "./pages/PrivateDatabasePage";
import SupabaseTestPage from "./pages/SupabaseTestPage";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
	return (
		<AuthProvider>
			<Router>
				<Routes>
					<Route path="/" element={<Layout />}>
						<Route index element={<HomePage />} />
						<Route path="/screener" element={<StockScreener />} />
						<Route path="/search" element={<CompanySearch />} />
						<Route path="/about" element={<AboutPage />} />
						<Route path="/contact" element={<ContactPage />} />
						<Route path="/login" element={<LoginPage />} />
						<Route path="/private" element={<PrivateDatabasePage />} />
						<Route path="/supabase" element={<SupabaseTestPage />} />
					</Route>
				</Routes>
			</Router>
		</AuthProvider>
	);
}

export default App;
