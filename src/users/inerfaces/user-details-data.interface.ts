import { UserRole } from '@prisma/client';

export interface UserDetailsData {
  id: number;
  name: string | null;
  username: string;
  email: string | null;
  role: UserRole;
  authMethod: string;
  photoPath: string | null;
  academicNumber?: string;
  department?: string;
  level?: number;
}
