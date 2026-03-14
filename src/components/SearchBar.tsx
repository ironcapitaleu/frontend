import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

function SearchBar() {
	return (
		<div className="relative w-full max-w-xl">
			<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
			<Input
				type="search"
				placeholder="Search companies, tickers, funds…"
				className="h-12 pl-10 pr-4 text-base rounded-xl"
				readOnly
				aria-label="Search"
			/>
		</div>
	);
}

export default SearchBar;
