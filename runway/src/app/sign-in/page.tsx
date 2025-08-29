"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignInPage() {
	const [email, setEmail] = useState("");
	const [sent, setSent] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSendLink(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		const supabase = createSupabaseBrowserClient();
		const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo: `${siteUrl}/auth/callback`,
			},
		});
		if (error) setError(error.message);
		else setSent(true);
	}

	return (
		<div className="min-h-[80vh] flex items-center justify-center">
			<form onSubmit={handleSendLink} className="w-full max-w-md space-y-4 p-6 border rounded-lg">
				<h1 className="text-xl font-semibold">Sign in</h1>
				<p className="text-sm text-gray-500">We will send you a magic link.</p>
				<input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="you@company.com"
					className="w-full border px-3 py-2 rounded"
					required
				/>
				<button type="submit" className="w-full bg-black text-white py-2 rounded disabled:opacity-60" disabled={!email}>
					Send magic link
				</button>
				{sent && <p className="text-green-600 text-sm">Check your email for the sign-in link.</p>}
				{error && <p className="text-red-600 text-sm">{error}</p>}
			</form>
		</div>
	);
}

