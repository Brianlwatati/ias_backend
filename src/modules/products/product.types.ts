// src/modules/products/product.types.ts

export interface Product {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}
