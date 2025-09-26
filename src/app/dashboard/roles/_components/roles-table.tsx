"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
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
import RoleDeleteDialog from "./role-delete-dialog";
import { cn } from "@/lib/utils";
import RolesCreateSheet from "./role-create-sheet";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "next/dist/server/api-utils";

const schema = z.object({
	roles: z.array(
		z
			.object({
				roleId: z.string(),
				name: z.string(),
			})
			.strict(),
	),
});

type Schema = z.infer<typeof schema>;

export function RolesTable() {
	const { data, status } = api.role.list.useQuery();

	//Implement move after query and deleted roles query
	//Move after should be a queue of moves all sent at once on confirmation

	const form = useForm<Schema>({
		resolver: zodResolver(schema),
		values: {
			roles:
				data?.map((r) => ({
					roleId: r.id,
					name: r.name,
				})) ?? [],
		},
	});

	const { fields, move } = useFieldArray({
		control: form.control,
		name: "roles",
	});

	const utils = api.useUtils();
	const { toast } = useToast();
	const reorderRoles = api.role.reorder.useMutation({
		onSuccess: async () => {
			// Invalidate the roles query to refetch the updated list
			await utils.role.list.invalidate();
			toast({
				title: "Roles reordered",
				description: "The roles have been reordered successfully.",
			});
		},
		onError: (error) => {
			if ((error.shape?.code ?? 400) == 400)
				utils.role.list.invalidate().catch(console.error);

			toast({
				title: "Error reordering roles",
				description: error.message,
				variant: "destructive",
			});
		},
	});

	useEffect(() => {
		window.addEventListener("beforeunload", alertUser);
		return () => {
			window.removeEventListener("beforeunload", alertUser);
		};
	}, []);

	const alertUser = (e: WindowEventMap["beforeunload"]) => {
		if (form.formState.isDirty) {
			e.preventDefault();
			e.returnValue = "";
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink href="/dashboard/roles">Roles</BreadcrumbLink>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			<Card>
				<div className="flex flex-col items-center gap-4 sm:flex-row">
					<CardHeader className="w-full flex-col items-start gap-4 space-y-0 sm:flex-row sm:items-center">
						<div className="flex flex-1 flex-col gap-1.5">
							<CardTitle>Roles</CardTitle>
							<CardDescription>
								The roles define access to the application. Each role has a set
								of permissions that can be assigned to users. You can reorder
								them by dragging the grip icon. This affects the role heirarchy.
							</CardDescription>
						</div>
						<RolesCreateSheet>
							<div
								className={buttonVariants({ variant: "outline", size: "sm" })}
							>
								<IconUsersPlus className="size-4" aria-hidden="true" />
								<span className="mr-2 font-normal">Create role</span>
							</div>
						</RolesCreateSheet>
					</CardHeader>
				</div>
				<CardContent>
					<Form {...form}>
						<form className="flex w-full flex-col gap-4">
							<Sortable
								value={fields}
								onMove={({ activeIndex, overIndex }) =>
									move(activeIndex, overIndex)
								}
								overlay={
									<div className="grid w-full grid-cols-[auto,0fr,0fr,0fr] items-center gap-2">
										<div className="h-8 rounded-md bg-primary/10" />
										<div
											className={cn(
												buttonVariants({
													variant: "outline",
													size: "sm",
												}),
												"border-transparent bg-primary/10 text-transparent",
											)}
										>
											<IconUserShield className="size-4" aria-hidden="true" />
											<span className="mr-2 font-normal">Edit</span>
										</div>
										<div
											className={cn(
												buttonVariants({
													variant: "outline",
													size: "sm",
												}),
												"border-transparent bg-primary/10 text-transparent",
											)}
										>
											<IconTrash className="size-4" aria-hidden="true" />
										</div>
										<div className="size-8 shrink-0 rounded-md bg-primary/10" />
									</div>
								}
							>
								{status === "pending" ? (
									<div className="flex w-full flex-col gap-2">
										<div className="grid w-full grid-cols-[auto,0fr,0fr] items-center gap-2">
											<Skeleton className="h-8 rounded-sm"></Skeleton>
											<Skeleton className="size-8 shrink-0 rounded-sm"></Skeleton>
											<Skeleton className="size-8 shrink-0 rounded-sm"></Skeleton>
										</div>
										<div className="grid w-full grid-cols-[auto,0fr,0fr] items-center gap-2">
											<Skeleton className="h-8 rounded-sm"></Skeleton>
											<Skeleton className="size-8 shrink-0 rounded-sm"></Skeleton>
											<Skeleton className="size-8 shrink-0 rounded-sm"></Skeleton>
										</div>
										<div className="grid w-full grid-cols-[auto,0fr,0fr] items-center gap-2">
											<Skeleton className="h-8 rounded-sm"></Skeleton>
											<Skeleton className="size-8 shrink-0 rounded-sm"></Skeleton>
											<Skeleton className="size-8 shrink-0 rounded-sm"></Skeleton>
										</div>
									</div>
								) : (
									<div className="flex w-full flex-col gap-2">
										{fields.map((field, index) => (
											<SortableItem key={field.id} value={field.id} asChild>
												<div className="grid grid-cols-[auto,0fr,0fr,0fr] items-center gap-2">
													<FormField
														control={form.control}
														name={`roles.${index}.name`}
														render={({ field }) => (
															<FormItem>
																<FormControl>
																	<Input className="h-8" {...field} disabled />
																</FormControl>
															</FormItem>
														)}
													/>
													<RolesCreateSheet roleId={field.roleId}>
														<div
															className={buttonVariants({
																variant: "outline",
																size: "sm",
															})}
														>
															<IconUserShield
																className="size-4"
																aria-hidden="true"
															/>
															<span className="mr-2 font-normal">Edit</span>
														</div>
													</RolesCreateSheet>
													<RoleDeleteDialog
														roleId={field.roleId}
														name={field.name}
													>
														<div
															className={buttonVariants({
																size: "sm",
																variant: "outline",
															})}
														>
															<IconTrash
																className="size-4"
																aria-hidden="true"
															/>
														</div>
													</RoleDeleteDialog>
													<SortableDragHandle
														variant="outline"
														size="icon"
														className="size-8 shrink-0"
													>
														<IconGripVertical
															className="size-4"
															aria-hidden="true"
														/>
													</SortableDragHandle>
												</div>
											</SortableItem>
										))}
									</div>
								)}
							</Sortable>
							{/* <Button
								size="sm"
								className="w-fit"
								disabled={!form.formState.isDirty}
							>
								Submit
							</Button> */}
						</form>
					</Form>
				</CardContent>
			</Card>
			{form.formState.isDirty && (
				<div className="pt-40">
					<Card className="fixed bottom-8">
						<CardHeader>
							<CardTitle>Careful!</CardTitle>
							<CardDescription>
								You have unsaved changes for roles. Save them to avoid losing
								them.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex gap-2">
							<Button
								size="sm"
								onClick={() => {
									reorderRoles.mutate({
										initialState: form.formState.defaultValues!.roles as {
											roleId: string;
											name: string;
										}[],
										updatedState: form.getValues().roles,
									});
								}}
							>
								Save changes
							</Button>
							<Button size="sm" variant="outline" onClick={() => form.reset()}>
								Reset changes
							</Button>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
