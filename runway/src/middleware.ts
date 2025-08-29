import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Temporarily disabled middleware: short-circuit next()
export async function middleware(_request: NextRequest) {
	return NextResponse.next();
}

export const config = {
	matcher: [],
};

