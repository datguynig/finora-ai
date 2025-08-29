import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");
	const cookieStore = cookies();

	if (!code) {
		return NextResponse.redirect(new URL("/sign-in?error=missing_code", request.url));
	}

	const redirectResponse = NextResponse.redirect(new URL("/dashboard", request.url));

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				get(name: string) {
					return cookieStore.get(name)?.value;
				},
				set(name: string, value: string, options: CookieOptions) {
					redirectResponse.cookies.set({ name, value, ...options });
				},
				remove(name: string, options: CookieOptions) {
					redirectResponse.cookies.set({ name, value: "", ...options, maxAge: 0 });
				},
			},
		}
	);

	const { error } = await supabase.auth.exchangeCodeForSession(code);
	if (error) {
		return NextResponse.redirect(new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, request.url));
	}

	return redirectResponse;
}

