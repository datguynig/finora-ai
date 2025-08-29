import { Transaction, Scenario } from "@/types/finance";
import { groupByMonth } from "@/lib/metrics";

export type ForecastPoint = { month: string; inflow: number; outflow: number; net: number; balance: number };

export function computeBaselineMonthly(transactions: Transaction[]) {
	const byMonth = groupByMonth(transactions);
	const months = Array.from(byMonth.keys()).sort();
	const last3 = months.slice(-3);
	const monthlyIn = last3.map((m) => (byMonth.get(m) || []).filter((t) => t.amount > 0).reduce((a, b) => a + Math.abs(b.amount), 0));
	const monthlyOut = last3.map((m) => (byMonth.get(m) || []).filter((t) => t.amount < 0).reduce((a, b) => a + Math.abs(b.amount), 0));
	const avgIn = average(monthlyIn);
	const avgOut = average(monthlyOut);
	return { avgIn, avgOut };
}

export function project(transactions: Transaction[], months: number, scenario: Scenario, startingBalance?: number): ForecastPoint[] {
	const { avgIn, avgOut } = computeBaselineMonthly(transactions);
	let inflow = avgIn;
	const outflow = applyScenarioToOutflow(avgOut, scenario);
	let balance = startingBalance ?? transactions.reduce((a, b) => a + b.amount, 0);
	const startKey = nextMonthKey(currentMonthKey());
	const points: ForecastPoint[] = [];
	let key = startKey;
	for (let i = 0; i < months; i++) {
		if (i > 0) inflow = inflow * (1 + scenario.revenueMonthlyGrowthPct / 100);
		const net = inflow - outflow;
		balance += net;
		points.push({ month: key, inflow, outflow, net, balance });
		key = nextMonthKey(key);
	}
	return points;
}

function applyScenarioToOutflow(avgOut: number, scenario: Scenario) {
	const saasReduction = avgOut * (scenario.saasReductionPct / 100) * 0.15;
	return Math.max(0, avgOut - saasReduction);
}

function average(arr: number[]) {
	if (!arr.length) return 0;
	return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function currentMonthKey() {
	const now = new Date();
	return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function nextMonthKey(key: string) {
	const [y, m] = key.split("-").map((s) => Number(s));
	const date = new Date(Date.UTC(y, m - 1, 1));
	date.setUTCMonth(date.getUTCMonth() + 1);
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

