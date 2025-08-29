"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";
import { normalizeCsvRecord } from "@/lib/normalize";
import { detectRecurring } from "@/lib/recurring";
import { computeMetrics } from "@/lib/metrics";
import type { Transaction, Category, Scenario } from "@/types/finance";
import { project } from "@/lib/forecast";

const defaultScenario: Scenario = { revenueMonthlyGrowthPct: 0, saasReductionPct: 0 };

export default function UploadAndDashboard() {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [scenario, setScenario] = useState<Scenario>(defaultScenario);

	const metrics = useMemo(() => computeMetrics(transactions), [transactions]);
	const forecast = useMemo(() => project(transactions, 12, scenario), [transactions, scenario]);

	function handleCsvFile(file: File) {
		Papa.parse<Record<string, string>>(file, {
			header: true,
			skipEmptyLines: true,
			worker: true,
			complete: (result) => {
				const rows = result.data;
				const txns: Transaction[] = [];
				for (const r of rows) {
					const t = normalizeCsvRecord(r);
					if (t) txns.push(t);
				}
				setTransactions(detectRecurring(txns));
			},
		});
	}

	function updateCategory(id: string, category: Category) {
		setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, category } : t)));
	}

	return (
		<div className="space-y-6">
			<div className="flex gap-3 items-center">
				<input type="file" accept=".csv" onChange={(e) => e.target.files && handleCsvFile(e.target.files[0])} />
				<div className="text-sm text-gray-500">CSV only for MVP. PDF coming soon.</div>
			</div>

			{transactions.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<StatCard label="Current balance" value={metrics.currentBalance} />
					<StatCard label="Trailing monthly burn" value={metrics.trailingMonthlyBurn} />
					<StatCard label="Runway (months)" value={metrics.runwayMonths ?? Infinity} format={(v)=> (v===Infinity?"∞":v.toFixed(1))} />
				</div>
			)}

			{transactions.length > 0 && (
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2">
						<ForecastChart data={forecast} />
					</div>
					<div>
						<ScenarioControls scenario={scenario} onChange={setScenario} />
					</div>
				</div>
			)}

			{transactions.length > 0 && (
				<div className="overflow-auto border rounded">
					<table className="min-w-full text-sm">
						<thead className="bg-gray-50">
							<tr>
								<th className="text-left p-2">Date</th>
								<th className="text-left p-2">Vendor</th>
								<th className="text-right p-2">Amount</th>
								<th className="text-left p-2">Category</th>
							</tr>
						</thead>
						<tbody>
							{transactions.slice(0, 100).map((t) => (
								<tr key={t.id} className="border-t">
									<td className="p-2 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
									<td className="p-2">{t.vendor || t.description}</td>
									<td className="p-2 text-right">{formatCurrency(t.amount)}</td>
									<td className="p-2">
										<CategorySelect value={t.category} onChange={(c) => updateCategory(t.id, c)} />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

function StatCard({ label, value, format }: { label: string; value: number; format?: (v:number)=>string }) {
	const text = format ? format(value) : formatCurrency(value);
	return (
		<div className="p-4 border rounded">
			<div className="text-xs uppercase text-gray-500">{label}</div>
			<div className="text-xl font-semibold">{text}</div>
		</div>
	);
}

function CategorySelect({ value, onChange }: { value: Category; onChange: (c: Category) => void }) {
	const options: Category[] = ["Revenue","Salaries","Contractors","Rent","SaaS","Cloud","Marketing","Travel","Office","Taxes","Fees","Transfer","Other","Uncategorized"];
	return (
		<select className="border px-2 py-1 rounded" value={value} onChange={(e) => onChange(e.target.value as Category)}>
			{options.map((opt) => (
				<option key={opt} value={opt}>{opt}</option>
			))}
		</select>
	);
}

function ForecastChart({ data }: { data: { month: string; inflow: number; outflow: number; net: number; balance: number }[] }) {
	if (data.length === 0) return null;
	const maxBalance = Math.max(...data.map((d) => d.balance), 1);
	const width = 600, height = 220, padding = 30;
	const points = data.map((d, i) => {
		const x = padding + (i * (width - padding * 2)) / (data.length - 1);
		const y = height - padding - (d.balance / maxBalance) * (height - padding * 2);
		return `${x},${y}`;
	}).join(" ");
	return (
		<div className="border rounded p-3">
			<div className="text-sm font-medium mb-2">12-month balance projection</div>
			<svg width={width} height={height} className="w-full h-auto">
				<polyline fill="none" stroke="#111" strokeWidth="2" points={points} />
			</svg>
			<div className="text-xs text-gray-500 mt-2">Assumes baseline from last 3 complete months; scenario controls adjust revenue and SaaS.</div>
		</div>
	);
}

function ScenarioControls({ scenario, onChange }: { scenario: Scenario; onChange: (s: Scenario) => void }) {
	return (
		<div className="p-3 border rounded space-y-3">
			<div className="font-medium">Scenario</div>
			<label className="block text-sm">Revenue growth % / month</label>
			<input type="range" min={-50} max={100} value={scenario.revenueMonthlyGrowthPct} onChange={(e)=> onChange({ ...scenario, revenueMonthlyGrowthPct: Number(e.target.value) })} className="w-full" />
			<div className="text-xs text-gray-600">{scenario.revenueMonthlyGrowthPct}%</div>
			<label className="block text-sm mt-2">Reduce SaaS by %</label>
			<input type="range" min={0} max={100} value={scenario.saasReductionPct} onChange={(e)=> onChange({ ...scenario, saasReductionPct: Number(e.target.value) })} className="w-full" />
			<div className="text-xs text-gray-600">{scenario.saasReductionPct}%</div>
		</div>
	);
}

function formatCurrency(n: number) {
	return new Intl.NumberFormat(undefined, { style: "currency", currency: "GBP", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(n);
}

