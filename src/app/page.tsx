import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function Home() {
	const session = await auth();

	if (session?.user) {
		void api.user?.getCurrentUser.prefetch();
	}

	redirect("/dashboard/documents");

	return (
		<HydrateClient>
			<main className="flex min-h-screen w-full text-white">Home</main>
		</HydrateClient>
	);
}
