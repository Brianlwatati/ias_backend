import type { PoolClient } from "pg";
import { NotFoundError } from "../../../errors/NotFoundError.js";

export class IasWebhookRepository {
  async provisionCompany(
    connection: PoolClient,
    company: {
      id?: number | undefined;
      name: string;
      code: string;
      email?: string | null | undefined;
      phone?: string | null | undefined;
    },
  ): Promise<{ companyId: number; companyProductId: number }> {
    const companyResult = await connection.query<{ id: number }>(
      `INSERT INTO companies (name, code, email, phone)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone
       RETURNING id`,
      [
        company.name,
        company.code,
        company.email ?? null,
        company.phone ?? null,
      ],
    );
    const companyId = companyResult.rows[0]?.id;
    if (companyId == null) throw new Error("Failed to provision company");

    const productResult = await connection.query<{ id: number }>(
      `INSERT INTO products (name, code, description) VALUES ('ERP System', 'ERP', 'Enterprise resource planning')
       ON CONFLICT (code) DO UPDATE SET status = 'ACTIVE' RETURNING id`,
    );
    const productId = productResult.rows[0]?.id;
    if (productId == null) throw new Error("Failed to provision ERP product");

    const grantResult = await connection.query<{ id: number }>(
      `INSERT INTO company_products (company_id, company_name, company_code, product_id, product_name, product_code)
       VALUES ($1, $2, $3, $4, 'ERP System', 'ERP')
       ON CONFLICT (company_id, product_id) DO UPDATE SET status = 'ACTIVE', revoked_at = NULL,
         company_name = EXCLUDED.company_name, company_code = EXCLUDED.company_code,
         product_name = EXCLUDED.product_name, product_code = EXCLUDED.product_code
       RETURNING id`,
      [companyId, company.name, company.code, productId],
    );
    const companyProductId = grantResult.rows[0]?.id;
    if (companyProductId == null)
      throw new Error("Failed to grant ERP product");

    await connection.query(
      `INSERT INTO roles (product_id, name, code, scope, role_scope_key, description)
       VALUES ($1, 'ERP User', 'ERP_USER', 'PRODUCT', 'PRODUCT:ERP', 'Standard ERP access')
       ON CONFLICT (role_scope_key, code) DO UPDATE SET status = 'ACTIVE'`,
      [productId],
    );

    return { companyId, companyProductId };
  }

  async assignDefaultRole(
    connection: PoolClient,
    user: {
      id?: number | undefined;
      email: string;
      companyId?: number | undefined;
      companyCode?: string | undefined;
    },
  ): Promise<{ userId: number; companyProductId: number; roleId: number }> {
    const userResult = await connection.query<{
      id: number;
      companyId: number;
    }>(
      `SELECT id, company_id AS "companyId" FROM users WHERE ${user.id ? "id = $1" : "email = $1"} LIMIT 1`,
      [user.id ?? user.email],
    );
    const userRow = userResult.rows[0];
    if (!userRow) throw new NotFoundError("IAS user was not found in ERP");

    const companyId = user.companyId ?? userRow.companyId;
    const grantResult = await connection.query<{ id: number }>(
      `SELECT id FROM company_products WHERE company_id = $1 AND product_code = 'ERP' AND status = 'ACTIVE' LIMIT 1`,
      [companyId],
    );
    const companyProductId = grantResult.rows[0]?.id;
    if (companyProductId == null)
      throw new NotFoundError("ERP product is not provisioned for the company");

    const roleResult = await connection.query<{ id: number }>(
      `SELECT id FROM roles WHERE code = 'ERP_USER' AND role_scope_key = 'PRODUCT:ERP' AND status = 'ACTIVE' LIMIT 1`,
    );
    const roleId = roleResult.rows[0]?.id;
    if (roleId == null)
      throw new NotFoundError("ERP default role is not configured");

    await connection.query(
      `INSERT INTO user_products (user_id, company_product_id, role_id, status)
       VALUES ($1, $2, $3, 'ACTIVE')
       ON CONFLICT (user_id, company_product_id) DO UPDATE SET role_id = EXCLUDED.role_id, status = 'ACTIVE'`,
      [userRow.id, companyProductId, roleId],
    );

    return { userId: userRow.id, companyProductId, roleId };
  }
}
