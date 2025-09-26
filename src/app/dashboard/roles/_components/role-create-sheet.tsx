"use client";
import React, { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import FancyMultiSelect from "@/components/ui/fancy-multi-select";
import { api } from "@/trpc/react";
import { useToast } from "@/hooks/use-toast";
import UserPermissions from "@/lib/UserPermissions";
import { Skeleton } from "@/components/ui/skeleton";

import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

const formSchema = z.object({
	name: z.string().min(1),
	permissions: z.array(z.object({ label: z.string(), value: z.number() })),
	users: z.array(z.object({ label: z.string(), value: z.string() })),
});

interface Props {
	roleId?: string;
	children: React.ReactNode;
}

function RolesCreateSheet(props: Props) {
	const { roleId, children } = props;
	const [open, setOpen] = useState(false);

	const utils = api.useUtils();
	const { data, status } = roleId
		? api.role.getRole.useQuery({ id: roleId })
		: {};

	const defaultValues = {
		name: data?.name ?? "",
		permissions: data?.permissions
			? new UserPermissions(data?.permissions).toArray().map((p) => ({
					label: p,
					value: UserPermissions.Flags[p as keyof UserPermissions["Flags"]],
				}))
			: [],
		users: data?.users.map((u) => ({ label: u.email, value: u.id })) ?? [],
	};

	const createOrUpdateRole = api.role[roleId ? "update" : "create"].useMutation(
		{
			onMutate: () => {
				toast({
					title: roleId ? "Updating role..." : "Creating role...",
					description: roleId
						? "The role is being updated."
						: "The role is being created.",
				});
			},
			onSuccess: (data) => {
				//Invalidate the list query to get the updated data
				utils.role.list.invalidate().catch(console.error);

				if (roleId)
					utils.role.getRole
						.invalidate({
							id: roleId,
						})
						.catch(console.error);

				//Reset the form
				form.reset();

				//Close the form
				setOpen(false);

				//Show a toast
				toast({
					title: `Role ${roleId ? "updated" : "created"}`,
					description: `"${data.name}" was ${roleId ? "updated" : "created"} successfully.`,
					variant: "default",
				});
			},
		},
	);
	const { toast } = useToast();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues,
		values: defaultValues,
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		const submitData: {
			id: string;
			name: string;
			user_ids: string[];
			permissions: number;
		} = {
			id: roleId!,
			name: values.name,
			user_ids: values.users.map((u) => u.value),
			permissions: values.permissions.reduce((acc, v) => acc | v.value, 0),
		};
		createOrUpdateRole.mutate(submitData);
	}

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger>{children}</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>{roleId ? "Edit" : "Create a new"} role</SheetTitle>
					<SheetDescription>
						Roles can be used to give users access to different resources on the
						app
					</SheetDescription>
				</SheetHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Role Name</FormLabel>
									<FormControl>
										<Input
											placeholder="System Admin"
											{...field}
											disabled={status === "pending"}
										/>
									</FormControl>
									<FormDescription>This is the role name</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="permissions"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Permissions</FormLabel>
									<FormControl>
										<FancyMultiSelect
											options={UserPermissions.allFlagsToKeyValueArray().map(
												([k, v]) => ({ label: k, value: v }),
											)}
											placeholder="Select permissions"
											selectFirstItem={false}
											badgeProps={{
												variant: "outline",
												className: "font-medium",
											}}
											{...field}
											disabled={status === "pending"}
										/>
									</FormControl>
									<FormDescription>
										These are the permissions for the role
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="users"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Select Users</FormLabel>
									<FormControl>
										<FancyMultiSelect
											disabled={status === "pending"}
											selectFirstItem={false}
											placeholder="Select users"
											triggerSearchOnFocus
											loadingIndicator={
												<div className="flex flex-col py-1">
													<div className="w-[calc(w-full - m-1)] flex h-8 flex-shrink-0 items-center p-3 py-4 font-normal">
														<Skeleton className="flex h-3 w-[60%] flex-shrink-0 rounded-sm text-sm font-normal"></Skeleton>
													</div>
													<div className="w-[calc(w-full - m-1)] flex h-8 flex-shrink-0 items-center p-3 py-4 font-normal">
														<Skeleton className="flex h-3 w-[80%] flex-shrink-0 rounded-sm text-sm font-normal"></Skeleton>
													</div>
													<div className="w-[calc(w-full - m-1)] flex h-8 flex-shrink-0 items-center p-3 py-4 font-normal">
														<Skeleton className="flex h-3 w-[70%] flex-shrink-0 rounded-sm text-sm font-normal"></Skeleton>
													</div>
													<div className="w-[calc(w-full - m-1)] flex h-8 flex-shrink-0 items-center p-3 py-4 font-normal">
														<Skeleton className="flex h-3 w-[50%] flex-shrink-0 rounded-sm text-sm font-normal"></Skeleton>
													</div>
												</div>
											}
											emptyIndicator={
												<p className="flex h-8 w-full flex-shrink-0 items-center justify-center rounded-sm text-sm font-normal">
													no results found.
												</p>
											}
											onSearch={(emailSearchTerm) =>
												utils.user.listUsers
													.fetch({
														emailSearchTerm,
														excludeIds: form
															.getValues("users")
															.map((u) => u.value),
													})
													.then((d) =>
														d.data.map((u) => ({
															label: u.email,
															value: u.id,
														})),
													)
											}
											badgeProps={{
												variant: "outline",
												className: "font-medium",
											}}
											{...field}
										/>
									</FormControl>
									<FormDescription>Assign users to the role</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex space-x-2">
							<Button
								type="submit"
								size="sm"
								disabled={createOrUpdateRole.isPending}
							>
								{roleId ? "Update role" : "Create new role"}
							</Button>
							<Button
								type="reset"
								onClick={() => form.reset()}
								size="sm"
								variant="outline"
							>
								Reset
							</Button>
						</div>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}

export default RolesCreateSheet;
