import { Department, ApprovalStatus } from "@prisma/client";

export interface StudentsListResponse {
    id: number;
    name: string | null;
    email: string | null;
    student?: {
        academicNumber: string;
        department: Department;
        studyLevel: number;
        approvalStatus: ApprovalStatus;
        approvalUpdatedByUserId: number | null;
      } | null;
  }