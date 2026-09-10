import type { Pool } from "pg";
import { withTransaction } from "../../../database/transaction.js";
import { IasWebhookRepository } from "./ias.repository.js";
import type {
  CompanyProvisionedInput,
  UserCreatedInput,
} from "./ias.validation.js";

export class IasWebhookService {
  constructor(
    private readonly db: Pool,
    private readonly repository: IasWebhookRepository,
  ) {}

  async provisionCompany(input: CompanyProvisionedInput) {
    const company = input.company ?? {
      ...(input.companyId !== undefined ? { id: input.companyId } : {}),
      name: input.name as string,
      code: input.code as string,
      email: input.email,
      phone: input.phone,
    };
    return withTransaction(this.db, (connection) =>
      this.repository.provisionCompany(connection, company),
    );
  }

  async assignDefaultRole(input: UserCreatedInput) {
    const user = input.user ?? {
      ...(input.userId !== undefined ? { id: input.userId } : {}),
      email: input.email as string,
      firstName: input.firstName as string,
      lastName: input.lastName,
      ...(input.companyId !== undefined ? { companyId: input.companyId } : {}),
      ...(input.companyCode !== undefined
        ? { companyCode: input.companyCode }
        : {}),
    };
    return withTransaction(this.db, (connection) =>
      this.repository.assignDefaultRole(connection, user),
    );
  }
}
