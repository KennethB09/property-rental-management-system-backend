import express from "express";

import { checkUserIfCompletedAccountSetup } from "../controller/landlordController.js";

export const router = express.Router();

router.get("/check-setup/:id", checkUserIfCompletedAccountSetup);