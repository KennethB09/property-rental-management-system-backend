import express from "express";

import {
  checkUserIfCompletedAccountSetup,
  completeAccountSetup,
  getProfile,
  EditLandlordProfile,
  listProperty,
  getLandlordProperties,
  EditLandlordProperty,
  deleteProperty
} from "../controller/landlordController.js";

import { getPropertyType } from "../controller/appController.js"

export const router = express.Router();

router.get("/check-setup/:id", checkUserIfCompletedAccountSetup);
router.post("/complete-setup", completeAccountSetup);
router.get("/get-profile/:id", getProfile);
router.post("/edit-landlord-profile", EditLandlordProfile);
router.post("/landlord-list-property", listProperty)
router.get("/landlord-get-properties/:id", getLandlordProperties);
router.get("/property-type", getPropertyType);
router.post("/landlord-update-property/:id", EditLandlordProperty);
router.delete("/landlord-delete-property/:id", deleteProperty);