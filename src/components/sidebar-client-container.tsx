"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "./sidebar";
import {
	IconArrowLeft,
	IconBrandTabler,
	IconFile,
	IconFiles,
	IconSettings,
	IconUserBolt,
	IconUserCog,
} from "@tabler/icons-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import SymbiLogo from "./logo";
import { signOut } from "next-auth/react";
import { Skeleton } from "./ui/skeleton";

interface Props {
	children: React.ReactNode;
}
export function SidebarClientContainer(props: Props) {
	const { data: currentUser, isLoading } = api.user.getCurrentUser.useQuery();
	const links = [
		{
			label: "Dashboard",
			href: "/dashboard",
			icon: (
				<IconBrandTabler className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
			),
		},
		{
			label: "Roles",
			href: "/dashboard/roles",
			icon: (
				<IconUserCog className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
			),
		},
		{
			label: "Documents",
			href: "/dashboard/documents",
			icon: (
				<IconFiles className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
			),
		},
		{
			label: "Logout",
			href: "#",
			onclick: () => signOut(),
			icon: (
				<IconArrowLeft className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
			),
		},
	];
	const [open, setOpen] = useState(false);
	return (
		<div
			className={cn(
				"mx-auto flex w-full flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800 md:flex-row",
				"h-screen", // for your use case, use `h-screen` instead of `h-[60vh]`
			)}
		>
			<Sidebar open={open} setOpen={setOpen}>
				<SidebarBody className="justify-between gap-10">
					<div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
						{open ? <Logo /> : <LogoIcon />}
						<div className="mt-8 flex flex-col gap-2">
							{links.map((link, idx) => (
								<SidebarLink
									key={idx}
									link={link}
									onClick={link.onclick ?? (() => setOpen(false))}
								/>
							))}
						</div>
					</div>
					<div>
						<SidebarLink
							link={{
								label: isLoading ? (
									<Skeleton className="h-4 w-32 flex-shrink-0 rounded-sm"></Skeleton>
								) : (
									(currentUser?.data?.name ?? "UNKNOWN USER")
								),
								href: "#",
								icon: isLoading ? (
									<Skeleton className="h-7 w-7 flex-shrink-0 rounded-full"></Skeleton>
								) : (
									<Image
										src={
											currentUser?.data?.image ?? "https://picsum.photos/200"
										}
										className="h-7 w-7 flex-shrink-0 rounded-full"
										width={50}
										height={50}
										alt="Avatar"
									/>
								),
							}}
						/>
					</div>
				</SidebarBody>
			</Sidebar>
			{props.children}
		</div>
	);
}
export const Logo = () => {
	return (
		<Link
			href="#"
			className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
		>
			<SymbiLogo width={26} />
			<motion.span
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="whitespace-pre font-medium text-black dark:text-white"
			>
				KMRL Portal
			</motion.span>
		</Link>
	);
};
export const LogoIcon = () => {
	return (
		<Link
			href="#"
			className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
		>
			<SymbiLogo width={26} />
		</Link>
	);
};
