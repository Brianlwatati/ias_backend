import { Router } from "express";

import { db } from "../config/database.js";

import { createAuthRouter } from "../modules/auth/auth.routes.js";

const router = Router();

router.use("/auth", createAuthRouter(db));

export default router;
