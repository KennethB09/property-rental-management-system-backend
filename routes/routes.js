import express from "express";

import { checkUserIfCompletedAccountSetup, completeAccountSetup } from "../controller/landlordController.js";

export const router = express.Router();

router.get("/check-setup/:id", checkUserIfCompletedAccountSetup);
router.post("/complete-setup", completeAccountSetup)