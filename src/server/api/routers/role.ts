import { z } from "zod";

import {
	// createTRPCRouter,
	protectedProcedure,
	// publicProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { ApiError } from "next/dist/server/api-utils";
import { TRPCClientError } from "@trpc/client";

export const roleRouter = {
	getRole: protectedProcedure
		.input(
			z
				.object({
					id: z.string().max(50),
				})
				.strict(),
		)
		.query(async ({ input }) => {
			const role = await db.role.findUnique({
				where: {
					id: input.id,
				},
				include: {
					users: {
						select: {
							email: true,
							id: true,
						},
					},
				},
			});
			return role;
		}),
	list: protectedProcedure.query(async ({}) => {
		const roles = await db.role.findMany({
			orderBy: { position: "asc" },
		});
		return roles;
	}),
	create: protectedProcedure
		.input(
			z.object({
				name: z.string().max(50),
				permissions: z.number().optional(),
				user_ids: z.array(z.string()).optional(),
			}),
		)
		.mutation(async ({ input }) => {
			return await db.role
				.findMany({
					orderBy: {
						position: "desc",
					},
					take: 1,
				})
				.then((d) =>
					db.role.create({
						data: {
							name: input.name,
							permissions: input.permissions,
							position: (d[0]?.position ?? 0) + 1,
							...(input.user_ids
								? {
										users: {
											connect: input.user_ids?.map((id) => ({ id })),
										},
									}
								: {}),
						},
					}),
				);
		}),
	update: protectedProcedure
		.input(
			z
				.object({
					id: z.string(),
					name: z.string().optional(),
					permissions: z.number().optional(),
					user_ids: z.array(z.string()).optional(),
				})
				.strict(),
		)
		.mutation(async ({ input }) => {
			return await db.role
				.update({
					where: { id: input.id },
					data: {
						name: input.name,
						permissions: input.permissions,
						users: {
							set: input.user_ids?.map((id) => ({ id })),
						},
					},
				})
				.then((d) => {
					return d;
				});
		}),
	reorder: protectedProcedure
		.input(
			z.object({
				initialState: z.array(
					z.object({
						roleId: z.string(),
						name: z.string(),
					}),
				),
				updatedState: z.array(
					z.object({
						roleId: z.string(),
						name: z.string(),
					}),
				),
			}),
		)
		.mutation(async ({ input }) => {
			//Check if initial order matches the one in db else return error
			const roles = await db.role.findMany({
				orderBy: { position: "asc" },
			});

			if (
				roles.map((r) => r.id).join(",") !==
				input.initialState.map((r) => r.roleId).join(",")
			) {
				throw new TRPCClientError(
					"Initial state does not match current state",
					{
						cause: new ApiError(
							400,
							"Initial state does not match current state",
						),
					},
				);
			}

			//Update positions in a transaction
			await db.$transaction(
				input.updatedState.map((role, index) =>
					db.role.update({
						where: { id: role.roleId },
						data: { position: index + 1 },
					}),
				),
			);
		}),
	delete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
		const deleted = await db.role.delete({ where: { id: input } });

		//Update positions of all roles after the deleted role
		await db.role.updateMany({
			where: {
				position: {
					gt: deleted.position,
				},
			},
			data: {
				position: {
					decrement: 1,
				},
			},
		});

		return { deleted };
	}),
};

export default roleRouter;
