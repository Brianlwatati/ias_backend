// src/modules/users/user.types.ts

export interface CompanyUser {
  id: number;
  companyId: number;
  systemRoleId: number;
  email: string;
  firstName: string;
  lastName: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}
