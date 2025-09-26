import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Props {
	roleId: string;
	name: string;
	children: React.ReactNode;
}

export default function RoleDeleteDialog(props: Props) {
	const { toast } = useToast();
	const [open, setOpen] = useState(false);
	const utils = api.useUtils();
	// Mutation to delete the role
	const deleteRole = api.role.delete.useMutation({
		onSuccess: async () => {
			await utils.role.list.invalidate();
			setOpen(false);
			toast({
				title: "Role deleted",
				description: "The role has been successfully deleted.",
			});
		},
		onMutate: () => {
			toast({
				title: "Deleting role...",
				description: "The role is being deleted.",
			});
		},
		onError: () => {
			toast({
				title: "Error deleting role",
				description: "There was an error deleting the role.",
				variant: "destructive",
			});
		},
	});
	const { roleId, name, children } = props;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Are you absolutely sure?</DialogTitle>
					<DialogDescription>
						This action cannot be undone. This will permanently delete the
						following role.
					</DialogDescription>
				</DialogHeader>

				{name}
				<DialogDescription>
					<Button
						onClick={() => deleteRole.mutate(roleId)}
						variant="destructive"
						disabled={deleteRole.isPending}
					>
						{deleteRole.isPending ? "Deleting..." : "Delete Role"}
					</Button>
				</DialogDescription>
			</DialogContent>
		</Dialog>
	);
}
