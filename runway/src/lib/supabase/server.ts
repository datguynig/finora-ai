import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function createSupabaseServerClient() {
	const cookieStore = await cookies();
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
	return createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			get(name: string) {
				return cookieStore.get(name)?.value;
			},
			set(_name: string, _value: string, _options: CookieOptions) {},
			remove(_name: string, _options: CookieOptions) {},
		},
	});
}

