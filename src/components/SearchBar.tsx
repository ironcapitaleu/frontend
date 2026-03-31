import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

function SearchBar() {
	return (
		<div className="relative w-full max-w-xl group">
			<div className="absolute -inset-0.5 rounded-xl bg-linear-to-r from-blue-500 via-purple-500 to-blue-500 opacity-60 blur-md transition duration-500 group-hover:opacity-100 group-focus-within:opacity-100 animate-gradient-flow pointer-events-none" />
			<div className="relative flex items-center bg-background rounded-xl border border-muted/30">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
				<Input
					type="search"
					placeholder="Search companies, tickers, funds…"
					className="h-12 pl-10 pr-4 text-18 bg-transparent border-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
					aria-label="Search"
				/>
			</div>
		</div>
	);
}

export default SearchBar;
