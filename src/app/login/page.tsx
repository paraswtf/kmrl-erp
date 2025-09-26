import React from "react";
import { IconBrandGoogle } from "@tabler/icons-react";
import Logo from "../../components/logo";
import { signIn } from "@/server/auth";
// import router from "next/router";

export default async function SignupFormDemo() {
	//Check session and redirect if already logged in
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#fffce9] to-[#ffe8c2] text-white">
			<div className="mx-auto w-full max-w-md rounded-none bg-white p-4 shadow-input dark:bg-black md:rounded-2xl md:p-8">
				<Logo width={128} />
				<h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
					Welcome to KMRL Document Management System
				</h2>
				<p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
					Login to this website using your Google Workspace account.
				</p>

				<div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

				<div className="flex flex-col space-y-4">
					<form
						action={async () => {
							"use server";
							await signIn("google", { callbackUrl: "/" });
						}}
					>
						<button
							className="group/btn relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black shadow-input dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)]"
							type="submit"
						>
							<IconBrandGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
							<span className="text-sm text-neutral-700 dark:text-neutral-300">
								Google
							</span>
							<BottomGradient />
						</button>
					</form>
				</div>
			</div>
		</main>
	);
}

const BottomGradient = () => {
	return (
		<>
			<span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
			<span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
		</>
	);
};
