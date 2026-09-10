import type { Request, Response } from "express";
import type {
  CompanyProvisionedInput,
  UserCreatedInput,
} from "./ias.validation.js";
import { IasWebhookService } from "./ias.service.js";

export class IasWebhookController {
  constructor(private readonly service: IasWebhookService) {}

  ping = (_req: Request, res: Response): void => {
    res
      .status(200)
      .json({ success: true, message: "IAS webhook connection acknowledged" });
  };

  companyProvisioned = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.provisionCompany(
      req.body as CompanyProvisionedInput,
    );
    res
      .status(200)
      .json({
        success: true,
        message: "ERP company defaults provisioned",
        data: result,
      });
  };

  userCreated = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.assignDefaultRole(
      req.body as UserCreatedInput,
    );
    res
      .status(200)
      .json({
        success: true,
        message: "ERP default role assigned",
        data: result,
      });
  };
}
