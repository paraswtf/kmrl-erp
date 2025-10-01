import { v2 as cloudinary } from "cloudinary";
import { db } from "@/server/db";
import { env } from "@/env";
import { documentNameToCode, departmentNameToCode } from "@/lib/utils";

cloudinary.config({
	cloud_name: env.CLOUDINARY_CLOUD_NAME,
	api_key: env.CLOUDINARY_API_KEY,
	api_secret: env.CLOUDINARY_API_SECRET,
});

export async function uploadSingleFile(
	file: {
		file: string;
		fileType: string;
		fileName: string;
	},
	folder: string,
) {
	const res = await cloudinary.uploader.upload(
		`data:${file.fileType};base64,${file.file}`,
		{
			folder,
			public_id: `${Date.now()} - ${file.fileName}`,
			resource_type: "auto",
			use_filename: true,
			type: "upload",
		},
	);

	return res;
}

export async function saveMultipleFiles(
	data: {
		documentId: string;
		department: string;
		documentType: string;
		summary: string;
	}[],
	uploadedById: string,
) {
	const res = await Promise.allSettled(
		data.map(async (file) => {
			const fileName = file.documentId.split("/").pop();
			const departmentName = documentNameToCode[file.department];
			const docTypeName = departmentNameToCode[file.documentType];
			const newPublicId = `${departmentName}/${docTypeName}/${fileName}`;
			const upload = await cloudinary.uploader.rename(
				file.documentId,
				newPublicId,
				{ overwrite: true },
			);

			return await db.document.create({
				data: {
					cloudinaryUrl: upload.secure_url,
					title: fileName as string,
					cloudinaryPublicId: upload.public_id,
					uploadedById: uploadedById,
					summary: file.summary,
					department: file.department,
					docType: file.documentType,
				},
			});
		}),
	);

	return res;
}
