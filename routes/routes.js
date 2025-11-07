import express from "express";

import {
  checkUserIfCompletedAccountSetup,
  completeAccountSetup,
  getProfile,
  EditLandlordProfile,
  listProperty
} from "../controller/landlordController.js";

import { getPropertyType } from "../controller/appController.js"

export const router = express.Router();

router.get("/check-setup/:id", checkUserIfCompletedAccountSetup);
router.post("/complete-setup", completeAccountSetup);
router.get("/get-profile/:id", getProfile);
router.post("/edit-landlord-profile", EditLandlordProfile);
router.post("/landlord-list-property", listProperty)

router.get("/property-type", getPropertyType);