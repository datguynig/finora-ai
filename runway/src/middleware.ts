import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

	const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			get(name: string) {
				return request.cookies.get(name)?.value;
			},
			set(name: string, value: string, options: CookieOptions) {
				request.cookies.set({ name, value, ...options });
			},
			remove(name: string, options: CookieOptions) {
				request.cookies.set({ name, value: "", ...options });
			},
		},
	});

	const { data } = await supabase.auth.getUser();
	const isAuth = Boolean(data.user);
	const isAuthRoute = request.nextUrl.pathname.startsWith("/sign-in");
	if (!isAuth && !isAuthRoute && request.nextUrl.pathname.startsWith("/dashboard")) {
		const url = request.nextUrl.clone();
		url.pathname = "/sign-in";
		return NextResponse.redirect(url);
	}
	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*"],
};

