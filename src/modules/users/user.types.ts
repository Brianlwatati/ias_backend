// src/modules/users/user.types.ts

export interface CompanyUser {
  userId: number;
  companyId: number;
  systemRoleId: number;
  roleName: string | null;
  roleCode: string | null;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}
