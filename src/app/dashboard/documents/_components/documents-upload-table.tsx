"use client";

import React, { useRef, useState } from "react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconTrash } from "@tabler/icons-react";
import { FilePlus2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react"; // your TRPC hooks
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Department, DocumentType } from "@/lib/utils";
import { allowedFileTypes } from "@/server/api/routers/document";
import { LinkPreview } from "@/components/ui/link-preview";

/**
 * Zod schema (using nativeEnum to match original)
 */
const formSchema = z.object({
	documents: z.array(
		z.object({
			documentId: z.string().optional(),
			documentType: z.nativeEnum(DocumentType).optional(),
			department: z.nativeEnum(Department).optional(),
			summary: z.string().min(1).optional(),
			fileUrl: z.string().optional(),
		}),
	),
});

const readFileAsBase64 = (file: File) =>
	new Promise<{
		file: string;
		fileName: string;
		fileType: (typeof allowedFileTypes)[number];
	}>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const data =
				typeof reader.result === "string"
					? (reader.result.split(",")[1] ?? "")
					: "";
			resolve({
				file: data,
				fileName: file.name,
				fileType: file.type as (typeof allowedFileTypes)[number],
			});
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});

type FormValues = z.infer<typeof formSchema>;

/**
 * Helpers to coerce enum values to strings for Select and back again.
 * Select wants strings; form state should keep the original enum value.
 */
const enumToString = (v: unknown) =>
	v === undefined || v === null ? "" : String(v);
const stringToEnum = <T extends string | number>(
	enumObj: Record<string, T>,
	s: string,
): T | undefined => {
	if (!s) return undefined;
	for (const k of Object.keys(enumObj)) {
		const val = enumObj[k] as unknown as T;
		if (String(val) === s) return val;
	}
	return undefined;
};

export function DocumentsUploadTable() {
	const { toast } = useToast();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			documents: [
				{
					documentId: undefined,
					documentType: undefined,
					department: undefined,
					summary: "",
					fileUrl: undefined,
				},
			],
		},
		mode: "onChange",
	});

	const { control, setValue, watch, getValues } = form;
	const { fields, append, remove } = useFieldArray({
		name: "documents",
		control,
	});

	const [uploading, setUploading] = useState<Record<string, boolean>>({});

	const uploadMutation = api.document.upload.useMutation();
	const bulkSave = api.document.bulkSave.useMutation();
	const utils = api.useUtils();

	// file input refs per row so we can trigger click programmatically
	const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

	const handleFileChange = async (file: File | null, rowIndex: number) => {
		if (!file) return;
		const rowKey = fields[rowIndex]!.id;
		try {
			setUploading((s) => ({ ...s, [rowKey]: true }));

			// convert to base64 payload (your backend expects this shape)
			const fileData = await readFileAsBase64(file);

			const payload = await uploadMutation.mutateAsync({ fileData });

			if (!payload?.documentId)
				throw new Error("No documentId returned from upload API");

			if (payload.cloudinaryUrl) {
				const aiData = await utils.document.getAiReport.fetch({
					url: payload.cloudinaryUrl,
				});

				// map/normalize and set values if AI provided them
				const mapToEnumValue = <T extends Record<string, string>>(
					en: T,
					v?: string,
				) => {
					if (!v) return undefined;
					const normalized = v.trim().toLowerCase();
					for (const key of Object.keys(en)) {
						const enumVal = (en as any)[key] as string;
						if (enumVal.toString().toLowerCase() === normalized)
							return enumVal as any;
					}
					for (const key of Object.keys(en)) {
						const enumVal = (en as any)[key] as string;
						if (
							enumVal.toString().toLowerCase().includes(normalized) ||
							normalized.includes(enumVal.toString().toLowerCase())
						)
							return enumVal as any;
					}
					return undefined;
				};

				if (aiData) {
					// const mappedDocType = mapToEnumValue(
					// 	DocumentType as any,
					// 	aiData.doc_type,
					// );
					const mappedDocType =
						DocumentType[aiData.doc_type as keyof typeof DocumentType];
					const mappedDept = mapToEnumValue(Department as any, aiData.org_type);
					const mappedSummary = aiData.shortSummary ?? aiData.summary ?? "";

					console.log(
						"AI data mapped",
						aiData,
						mappedDocType,
						mappedDept,
						mappedSummary,
					);

					if (mappedDocType) {
						setValue(`documents.${rowIndex}.documentType`, mappedDocType, {
							shouldDirty: true,
							shouldTouch: true,
						});
					}
					if (mappedDept) {
						setValue(`documents.${rowIndex}.department`, mappedDept, {
							shouldDirty: true,
							shouldTouch: true,
						});
					}
					if (mappedSummary) {
						setValue(`documents.${rowIndex}.summary`, mappedSummary, {
							shouldDirty: true,
							shouldTouch: true,
						});
					}
				}
			}

			setValue(`documents.${rowIndex}.documentId`, payload.documentId, {
				shouldDirty: true,
				shouldTouch: true,
			});

			if (payload.cloudinaryUrl) {
				setValue(`documents.${rowIndex}.fileUrl`, payload.cloudinaryUrl, {
					shouldDirty: true,
				});
			}

			toast({
				title: "Upload successful",
				description: `Uploaded file for row ${rowIndex + 1}`,
			});
		} catch (err: any) {
			console.error("Upload failed", err);
			toast({
				title: "Upload failed",
				description: err?.message ?? "Unknown error",
				variant: "destructive",
			});
		} finally {
			setUploading((s) => ({ ...s, [rowKey]: false }));
		}
	};

	async function handleSave() {
		const data = getValues("documents");

		const res = await bulkSave.mutateAsync({ data });

		if (res) {
			console.log("Save Success", res);
		}
	}

	const documentsWatch = watch("documents");

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
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink href="/dashboard/documents/upload">
							Upload
						</BreadcrumbLink>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<Card>
				<div className="flex flex-col items-center gap-4 sm:flex-row">
					<CardHeader className="w-full flex-col items-start gap-4 space-y-0 sm:flex-row sm:items-center">
						<div className="flex flex-1 flex-col gap-1.5">
							<CardTitle>Upload Documents</CardTitle>
							<CardDescription>
								Add documents here to upload them to the system. Documents are
								automatically tagged and summarised using AI. <br />
								Please verify before uploading.
							</CardDescription>
						</div>
					</CardHeader>
				</div>

				<CardContent className="flex flex-col gap-8">
					<form
						onSubmit={form.handleSubmit((vals) => {
							console.log("submit payload", vals);
							toast({ title: "Form submitted (see console)" });
						})}
					>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Type</TableHead>
									<TableHead>Department</TableHead>
									<TableHead>Summary</TableHead>
									<TableHead>File</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{fields.map((field, idx) => {
									const rowKey = field.id;
									const isUploading = !!uploading[rowKey];
									const current = documentsWatch?.[idx] ?? {};

									return (
										<TableRow key={field.id}>
											<TableCell className="w-32">
												<Controller
													control={control}
													name={`documents.${idx}.documentType`}
													defaultValue={field.documentType}
													render={({ field: { value, onChange } }) => {
														const stringVal = enumToString(value);
														return (
															<Select
																value={stringVal}
																onValueChange={(v) => {
																	const parsed = stringToEnum(
																		DocumentType as any,
																		v,
																	);
																	onChange(parsed);
																}}
															>
																<SelectTrigger className="w-full">
																	<SelectValue placeholder="Document Type" />
																</SelectTrigger>
																<SelectContent>
																	{Object.values(DocumentType).map((d) => (
																		<SelectItem
																			key={String(d)}
																			value={String(d)}
																		>
																			{String(d)}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
														);
													}}
												/>
											</TableCell>

											<TableCell className="w-32">
												<Controller
													control={control}
													name={`documents.${idx}.department`}
													defaultValue={field.department}
													render={({ field: { value, onChange } }) => {
														const stringVal = enumToString(value);
														return (
															<Select
																value={stringVal}
																onValueChange={(v) => {
																	const parsed = stringToEnum(
																		Department as any,
																		v,
																	);
																	onChange(parsed);
																}}
															>
																<SelectTrigger className="w-full">
																	<SelectValue placeholder="Department" />
																</SelectTrigger>
																<SelectContent>
																	{Object.values(Department).map((d) => (
																		<SelectItem
																			key={String(d)}
																			value={String(d)}
																		>
																			{String(d)}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
														);
													}}
												/>
											</TableCell>

											<TableCell className="w-full">
												<Controller
													control={control}
													name={`documents.${idx}.summary`}
													defaultValue={field.summary ?? ""}
													render={({ field }) => (
														<Textarea
															{...field}
															placeholder="Short summary"
															className="min-h-[6rem] w-full resize-y"
														/>
													)}
												/>
											</TableCell>

											<TableCell>
												<div className="flex items-center gap-3">
													<input
														type="file"
														accept="application/pdf,image/*"
														className="hidden"
														ref={(el) => {
															fileInputsRef.current[rowKey] = el;
														}}
														onChange={(e) => {
															const f = e.target.files?.[0] ?? null;
															handleFileChange(f, idx);
															e.currentTarget.value = "";
														}}
														disabled={isUploading}
														aria-label={`file-input-${idx}`}
													/>

													<Button
														size="sm"
														onClick={() =>
															fileInputsRef.current[rowKey]?.click()
														}
														disabled={isUploading}
													>
														{isUploading
															? "Uploading..."
															: current?.fileUrl
																? "Change file"
																: "Choose file"}
													</Button>

													<div className="text-sm">
														{isUploading ? (
															<Skeleton className="h-4 w-24" />
														) : current?.fileUrl ? (
															<LinkPreview
																url={current.fileUrl}
																className="font-medium underline"
																isStatic
																imageSrc={
																	current.fileUrl
																		.replace("/upload/", "/upload/w_400/pg_1/")
																		.split(".")
																		.slice(0, -1)
																		.join(".") + ".jpg"
																}
															>
																View file
															</LinkPreview>
														) : current?.documentId ? (
															<span className="text-xs">
																ID: {current.documentId}
															</span>
														) : (
															<span className="text-xs text-muted-foreground">
																No file
															</span>
														)}
													</div>
												</div>
											</TableCell>

											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-2">
													<Button
														variant="ghost"
														size="sm"
														className="text-red-600"
														onClick={() => remove(idx)}
													>
														<IconTrash className="size-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>

						<div className="mt-4 flex gap-2">
							<Button type="submit" onClick={handleSave}>
								Save / Submit
							</Button>
							<Button
								variant="outline"
								onClick={() =>
									append({
										documentId: undefined,
										documentType: undefined,
										department: undefined,
										summary: "",
										fileUrl: undefined,
									})
								}
							>
								<FilePlus2 className="mr-2 h-4 w-4" />
								Add Another Document
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
