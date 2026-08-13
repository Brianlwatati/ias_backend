// src/modules/roles/role.types.ts

export interface Role {
  id: number;
  productId: number | null;
  name: string;
  code: string;
  scope: "SYSTEM" | "PRODUCT";
  roleScopeKey: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}
