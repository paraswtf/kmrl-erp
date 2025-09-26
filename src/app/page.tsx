import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";

export default async function Home() {
	const session = await auth();

	if (session?.user) {
		void api.user?.getCurrentUser.prefetch();
	}

	return (
		<HydrateClient>
			<main className="flex min-h-screen w-full text-white">Home</main>
		</HydrateClient>
	);
}
