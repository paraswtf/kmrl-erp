import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export enum DocumentType {
	TBL = "Technical Bulletin",
	SAC = "Safety Circular",
	MMN = "Maintenance Manual",
	OPR = "Operating Procedure",
	INR = "Incident Report",
	TRM = "Training Manual",
	POL = "Policy Document",
	INP = "Inspection Report",
	ESP = "Equipment Specification",
	EMP = "Emergency Protocol",
	SOP = "Standard Operating Procedure",
	QAR = "Quality Assurance Report",
	AUD = "Compliance Audit",
	RAS = "Risk Assessment",
	WIN = "Work Instruction",
	COR = "Correspondence",
	REP = "Report",
	FOR = "Form",
	NOT = "Notice",
	AGD = "Agenda",
	MIN = "Minutes",
	PRO = "Proposal",
	CON = "Contract",
}

export enum Department {
	ENG = "Engineering Department",
	OPS = "Operations Department",
	RST = "Rolling Stock Department",
	SIG = "Signal & Telecommunication",
	ELE = "Electrical Department",
	CIV = "Civil Engineering",
	SAF = "Safety & Security",
	HR = "Human Resources",
	FIN = "Finance & Accounts",
	PMO = "Project Management Office",
	IT = "Information Technology",
	CR = "Customer Relations",
	PRC = "Procurement Department",
	LEG = "Legal & Compliance",
	MED = "Medical Department",
	ENV = "Environment Department",
	QC = "Quality Control",
	ADM = "Administration",
}

export const documentNameToCode = Object.fromEntries(
	Object.entries(DocumentType).map(([code, name]) => [name, code]),
) as Record<DocumentType, keyof typeof DocumentType>;

export const departmentNameToCode = Object.fromEntries(
	Object.entries(Department).map(([code, name]) => [name, code]),
) as Record<Department, keyof typeof Department>;
