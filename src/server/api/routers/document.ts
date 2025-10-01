import { z } from "zod";
import {
	// createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { TRPCClientError } from "@trpc/client";
import { ApiError } from "next/dist/server/api-utils";
import { uploadSingleFile, saveMultipleFiles } from "@/helper/uploadFile";
import { Department, DocumentType } from "@/lib/utils";

export const allowedFileTypes = [
	"application/pdf",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"image/jpeg",
	"image/png",
	"image/jpg",
	"application/msword",
];

export const documentRouter = {
	upload: protectedProcedure
		.input(
			z.object({
				fileData: z.object({
					file: z.string(),
					fileName: z.string().min(1),
					fileType: z.enum([...allowedFileTypes] as [string, ...string[]]),
				}),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const documentUpload = await uploadSingleFile(input.fileData, "TMP");

			const res = {
				cloudinaryUrl: documentUpload.secure_url,
				documentId: documentUpload.public_id,
			};

			return res;
		}),

	bulkSave: protectedProcedure
		.input(
			z.object({
				data: z.array(
					z.object({
						documentId: z.string(),
						department: z.enum(
							Object.values(Department) as [string, ...string[]],
						),
						documentType: z.enum(
							Object.values(DocumentType) as [string, ...string[]],
						),
						summary: z.string(),
					}),
				),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			console.log(input.data);
			const res = await saveMultipleFiles(input.data, ctx.session.user.id);

			return res;
		}),
	getDocument: protectedProcedure
		.input(
			z
				.object({
					id: z.string().max(50),
				})
				.strict(),
		)
		.query(async ({ input }) => {
			const document = await db.document.findUnique({
				where: {
					id: input.id,
				},
			});
			if (!document) {
				throw new TRPCClientError("Document not found");
			}
			return document;
		}),
	getAiReport: protectedProcedure
		.input(
			z.object({
				url: z.string().url(),
			}),
		)
		.output(
			z.object({
				doc_type: z.string(),
				org_type: z.string(),
				shortSummary: z.string(),
				summary: z.array(z.string()),
			}),
		)
		.query(async ({ input }) => {
			try {
				const response = await fetch(
					"https://a64cdec17679.ngrok-free.app/process_url",
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${process.env.AI_API_KEY}`,
						},
						body: JSON.stringify({ url: input.url }),
					},
				);

				if (!response.ok) {
					throw new Error("Failed to fetch AI report");
				}

				const data = await response.json();
				return data.results[0];
			} catch (error) {
				throw new TRPCClientError("Error generating AI report");
			}
		}),
	list: protectedProcedure
		.input(
			z
				.object({
					query: z.string().min(1),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			try {
				if (!input?.query) {
					return await db.document.findMany({
						orderBy: { createdAt: "desc" },
					});
				}
				return await db.document.findMany({
					where: {
						OR: [
							{
								summary: {
									contains: input.query,
									mode: "insensitive",
								},
							},
							{
								title: {
									contains: input.query,
									mode: "insensitive",
								},
							},
							{
								docType: {
									contains: input.query,
									mode: "insensitive",
								},
							},
							{
								department: {
									contains: input.query,
									mode: "insensitive",
								},
							},
						],
					},
				});
			} catch (error) {
				throw new TRPCClientError("Error performing semantic search");
			}
		}),
};

export default documentRouter;
