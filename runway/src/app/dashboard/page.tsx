import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import UploadAndDashboard from "@/app/dashboard/upload-and-dashboard";

export default async function DashboardPage() {
	const supabase = await createSupabaseServerClient();
	const { data } = await supabase.auth.getUser();
	if (!data.user) {
		redirect("/sign-in");
	}
	return (
		<div className="p-6">
			<h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
			<UploadAndDashboard />
		</div>
	);
}

