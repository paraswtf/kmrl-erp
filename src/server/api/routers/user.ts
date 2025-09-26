import { z } from "zod";

import {
	// createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";

export const userRouter = {
	getCurrentUser: publicProcedure.query(async ({ ctx }) => {
		return { data: ctx.session?.user };
	}),
	fetchUserByEmail: protectedProcedure
		.input(
			z.object({
				email: z.string().email(),
			}),
		)
		.query(async ({ input }) => {
			const user = await db.user.findUnique({
				where: {
					email: input.email,
				},
			});
			return { data: user };
		}),
	listUsers: protectedProcedure
		.input(
			z.object({
				emailSearchTerm: z.string().optional(),
				limit: z.number().optional(),
				excludeEmails: z.array(z.string()).optional(),
				excludeIds: z.array(z.string()).optional(),
			}),
		)
		.query(async ({ input }) => {
			const users = await db.user.findMany({
				where: input.emailSearchTerm
					? {
							email: {
								startsWith: input.emailSearchTerm,
								notIn: input.excludeEmails,
							},
							id: {
								notIn: input.excludeIds,
							},
						}
					: undefined,
				take: input.limit ?? 10,
			});
			return { data: users };
		}),
};

export default userRouter;
