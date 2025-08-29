import { Transaction } from "@/types/finance";

export function detectRecurring(transactions: Transaction[]): Transaction[] {
	const byVendor = new Map<string, Transaction[]>();
	for (const t of transactions) {
		const key = `${t.vendor}`;
		const arr = byVendor.get(key) ?? [];
		arr.push(t);
		byVendor.set(key, arr);
	}
	for (const arr of byVendor.values()) {
		arr.sort((a, b) => a.date.localeCompare(b.date));
		if (arr.length < 3) continue;
		const amounts = arr.map((t) => Math.abs(t.amount));
		const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
		const variance = amounts.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / amounts.length;
		const std = Math.sqrt(variance);
		const consistent = std / (mean || 1) < 0.2;
		if (!consistent) continue;
		for (const t of arr) t.isRecurring = true;
	}
	return transactions;
}

