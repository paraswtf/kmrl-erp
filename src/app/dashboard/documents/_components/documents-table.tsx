"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	IconEdit,
	IconFilePlus,
	IconFiles,
	IconGripVertical,
	IconTrash,
	IconUserShield,
	IconUsersPlus,
} from "@tabler/icons-react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { Button, buttonVariants } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Sortable,
	SortableDragHandle,
	SortableItem,
} from "@/components/ui/sortable";
import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useEffect } from "react";
import RoleDeleteDialog from "./document-delete-dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "next/dist/server/api-utils";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import React from "react";
import { useDebounce } from "@/components/ui/fancy-multi-select";
import { LinkPreview } from "@/components/ui/link-preview";

export function DocumentsTable() {
	const [searchQuery, setSearchQuery] = React.useState("");
	const debouncedSearchQuery = useDebounce(searchQuery, 300);

	const { data, status } = api.document.list.useQuery(
		debouncedSearchQuery
			? {
					query: debouncedSearchQuery,
				}
			: undefined,
	);

	return (
		<div className="flex flex-col gap-4">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink href="/dashboard/documents">
							Documents
						</BreadcrumbLink>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<Card>
				<div className="flex flex-col items-center gap-4 sm:flex-row">
					<CardHeader className="w-full flex-col items-start gap-4 space-y-0 sm:flex-row sm:items-center">
						<div className="flex flex-1 flex-col gap-1.5">
							<CardTitle>Documents</CardTitle>
							<CardDescription>
								Centralized access to uploaded documents with easy search and
								context, so you spend less time hunting files and more time
								acting on insights.
							</CardDescription>
						</div>
						<Link
							href={"/dashboard/documents/upload"}
							className={buttonVariants({ variant: "outline", size: "sm" })}
						>
							<IconFilePlus className="size-4" aria-hidden="true" />
							<span className="mr-2 font-normal">Upload Documents</span>
						</Link>
					</CardHeader>
				</div>
				<CardContent>
					<Input
						placeholder="Search documents..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Type</TableHead>
								<TableHead>Department</TableHead>
								<TableHead>Summary</TableHead>
								<TableHead className="text-right"></TableHead>
								<TableHead className="text-right"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data ? (
								data.map((doc, i) => (
									<TableRow key={i}>
										<TableCell>{doc.docType}</TableCell>
										<TableCell>{doc.department}</TableCell>
										<TableCell className="whitespace-pre">
											{doc.summary}
										</TableCell>
										<TableCell className="whitespace-pre">
											<LinkPreview
												url={doc.cloudinaryUrl}
												className="font-medium underline"
												isStatic
												imageSrc={
													doc.cloudinaryUrl
														.replace("/upload/", "/upload/w_400/pg_1/")
														.split(".")
														.slice(0, -1)
														.join(".") + ".jpg"
												}
											>
												View file
											</LinkPreview>
										</TableCell>
										<TableCell className="text-right">
											<Button variant="ghost" size="sm">
												<IconEdit className="size-4" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												className="text-red-600"
											>
												<IconTrash className="size-4" />
											</Button>
										</TableCell>
									</TableRow>
								))
							) : (
								<div></div>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
