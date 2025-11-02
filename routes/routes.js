import express from "express";

import {
  checkUserIfCompletedAccountSetup,
  completeAccountSetup,
  getProfile,
  EditLandlordProfile
} from "../controller/landlordController.js";

export const router = express.Router();

router.get("/check-setup/:id", checkUserIfCompletedAccountSetup);
router.post("/complete-setup", completeAccountSetup);
router.get("/get-profile/:id", getProfile);
router.post("/edit-landlord-profile", EditLandlordProfile)