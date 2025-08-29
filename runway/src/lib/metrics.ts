import { Transaction, Metrics } from "@/types/finance";

export function computeMetrics(transactions: Transaction[]): Metrics {
	const now = new Date();
	const byMonth = groupByMonth(transactions);
	const lastCompleteMonths = getLastCompleteMonths(now, 3);
	const monthly = lastCompleteMonths.map((k) => byMonth.get(k) ?? []);
	const inflows = monthly.map((arr) => arr.filter((t) => t.amount > 0).reduce((a, b) => a + b.amount, 0));
	const outflows = monthly.map((arr) => arr.filter((t) => t.amount < 0).reduce((a, b) => a + Math.abs(b.amount), 0));
	const avgIn = inflows.length ? average(inflows) : 0;
	const avgOut = outflows.length ? average(outflows) : 0;
	const netBurn = Math.max(0, avgOut - avgIn);
	const currentBalance = transactions.reduce((a, b) => a + b.amount, 0);
	const trailingMonthlyBurn = avgOut;
	const runwayMonths = netBurn <= 0 ? null : currentBalance <= 0 ? 0 : currentBalance / netBurn;
	return { currentBalance, trailingMonthlyBurn, netBurn, runwayMonths };
}

export function groupByMonth(transactions: Transaction[]): Map<string, Transaction[]> {
	const map = new Map<string, Transaction[]>();
	for (const t of transactions) {
		const d = new Date(t.date);
		const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
		const arr = map.get(key) ?? [];
		arr.push(t);
		map.set(key, arr);
	}
	return map;
}

function getLastCompleteMonths(now: Date, count: number): string[] {
	const months: string[] = [];
	const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
	date.setUTCMonth(date.getUTCMonth() - 1);
	for (let i = 0; i < count; i++) {
		months.push(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`);
		date.setUTCMonth(date.getUTCMonth() - 1);
	}
	return months.reverse();
}

function average(arr: number[]): number {
	return arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
}

