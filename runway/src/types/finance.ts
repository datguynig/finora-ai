export type Transaction = {
	id: string;
	date: string; // ISO string
	description: string;
	vendor: string;
	amount: number; // negative for outflow, positive for inflow
	category: Category;
	isRecurring: boolean;
};

export type Category =
	| "Revenue"
	| "Salaries"
	| "Contractors"
	| "Rent"
	| "SaaS"
	| "Cloud"
	| "Marketing"
	| "Travel"
	| "Office"
	| "Taxes"
	| "Fees"
	| "Transfer"
	| "Other"
	| "Uncategorized";

export type Scenario = {
	revenueMonthlyGrowthPct: number; // e.g., 10 => +10% m/m
	saasReductionPct: number; // e.g., 20 => -20% on SaaS
};

export type Metrics = {
	currentBalance: number;
	trailingMonthlyBurn: number; // avg outflow / month over trailing 3 complete months
	netBurn: number; // outflow - inflow per month (avg trailing 3 months)
	runwayMonths: number | null; // null => infinite or non-applicable
};

