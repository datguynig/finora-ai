import { Transaction, Category } from "@/types/finance";

export function normalizeVendor(raw: string): string {
	const base = raw.toLowerCase();
	return base
		.replace(/\s+/g, " ")
		.replace(/pos\s+purchase|card\s+payment|online\s+payment/gi, "")
		.replace(/\d{4,}/g, "")
		.trim();
}

export function parseAmount(value: string): number {
	const s = value.replace(/[,£$]/g, "").trim();
	const n = Number(s);
	return isNaN(n) ? 0 : n;
}

export function inferSign(amount: number, debit?: string, credit?: string): number {
	if (debit && debit.length > 0) return -Math.abs(parseAmount(debit));
	if (credit && credit.length > 0) return Math.abs(parseAmount(credit));
	return amount;
}

export function initialCategory(description: string, vendor: string, amount: number): Category {
	const d = `${description} ${vendor}`.toLowerCase();
	if (/stripe|shopify|invoice|customer|payment received/.test(d) && amount > 0) return "Revenue";
	if (/aws|gcp|azure|digitalocean/.test(d)) return "Cloud";
	if (/slack|notion|figma|atlassian|google workspace|microsoft 365|github|linear/.test(d)) return "SaaS";
	if (/rent|wework|office/.test(d)) return "Rent";
	if (/hmrc|irs|tax/.test(d)) return "Taxes";
	if (/advert|ads|google ads|facebook ads|linkedin ads/.test(d)) return "Marketing";
	if (/uber|train|rail|air|hotel|booking/.test(d)) return "Travel";
	if (/transfer|internal/.test(d)) return "Transfer";
	return amount < 0 ? "Other" : "Uncategorized";
}

export function normalizeCsvRecord(record: Record<string, string>): Transaction | null {
	const keys = Object.fromEntries(Object.keys(record).map((k) => [k.toLowerCase().trim(), k]));
	const dateKey = keys["date"] || keys["transaction date"] || keys["posted date"] || keys["value date"] || keys["booking date"];
	const descKey = keys["description"] || keys["details"] || keys["narrative"] || keys["merchant"] || keys["memo"] || keys["reference"] || keys["payee"];
	const amountKey = keys["amount"] || keys["value"] || keys["amt"];
	const debitKey = keys["debit"] || keys["out"] || keys["withdrawal"] || keys["debit amount"] || keys["debits"];
	const creditKey = keys["credit"] || keys["in"] || keys["deposit"] || keys["credit amount"] || keys["credits"];

	if (!dateKey || !descKey || (!amountKey && !debitKey && !creditKey)) return null;

	const rawDate = record[dateKey];
	const isoDate = toIsoDate(rawDate);
	const description = record[descKey] ?? "";
	const vendor = normalizeVendor(description);
	const baseAmount = amountKey ? parseAmount(record[amountKey]) : 0;
	const amount = inferSign(baseAmount, debitKey ? record[debitKey] : undefined, creditKey ? record[creditKey] : undefined);
	const category = initialCategory(description, vendor, amount);

	return {
		id: `${isoDate}-${hash(description)}-${Math.round(amount * 100)}`,
		date: isoDate,
		description,
		vendor,
		amount,
		category,
		isRecurring: false,
	};
}

export function toIsoDate(raw: string): string {
	const d = new Date(raw);
	if (!isNaN(d.getTime())) return d.toISOString();
	const ddmmyyyy = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
	if (ddmmyyyy) {
		const [, dStr, mStr, yStr] = ddmmyyyy;
		const yyyy = yStr.length === 2 ? `20${yStr}` : yStr;
		const dt = new Date(Number(yyyy), Number(mStr) - 1, Number(dStr));
		return dt.toISOString();
	}
	return new Date().toISOString();
}

function hash(input: string): number {
	let h = 0;
	for (let i = 0; i < input.length; i++) {
		h = Math.imul(31, h) + input.charCodeAt(i);
	}
	return h >>> 0;
}

