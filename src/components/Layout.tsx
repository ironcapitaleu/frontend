import type React from "react";
import { Outlet } from "react-router-dom";
import Footer from "./Footer.tsx";
import Header from "./Header.tsx";

const Layout: React.FC = () => {
	return (
		<div className="min-h-screen flex flex-col">
			<Header />
			<main className="flex-1 flex flex-col">
				<Outlet />
			</main>
			<Footer />
		</div>
	);
};

export default Layout;
